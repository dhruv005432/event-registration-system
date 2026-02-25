import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventRegistrationService, Registration } from '../../services/event-registration.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';

export interface FilterOptions {
  searchTerm: string;
  eventFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
  paymentStatus: string;
  registrationStatus: string;
}

export interface AuditLog {
  id: string;
  registrationId: string;
  editedBy: string;
  timestamp: string;
  changes: string[];
}

@Component({
  selector: 'app-registration-list',
  templateUrl: './registration-list.component.html',
  styleUrl: './registration-list.component.css'
})
export class RegistrationListComponent implements OnInit, OnDestroy {
  registrations: Registration[] = [];
  filteredRegistrations: Registration[] = [];
  selectedRegistrations: string[] = [];
  loading = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Sorting
  sortColumn: string = 'registrationDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Filtering
  showFilters = false;
  filterForm: FormGroup;
  filters: FilterOptions = {
    searchTerm: '',
    eventFilter: '',
    dateRange: { start: '', end: '' },
    paymentStatus: '',
    registrationStatus: ''
  };
  
  // Statistics
  totalRegistrations = 0;
  confirmedCount = 0;
  pendingCount = 0;
  cancelledCount = 0;
  paidCount = 0;
  refundedCount = 0;
  
  // UI State
  showBulkActions = false;
  selectedRegistration: Registration | null = null;
  showDetailsModal = false;
  showEmailModal = false;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private eventService: EventRegistrationService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadRegistrations();
    this.initializeSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      searchTerm: [''],
      eventFilter: [''],
      dateStart: [''],
      dateEnd: [''],
      paymentStatus: [''],
      registrationStatus: ['']
    });
  }

  loadRegistrations(): void {
    this.loading = true;
    
    this.subscriptions.add(
      this.eventService.getRegistrations().subscribe(data => {
        this.registrations = data;
        this.applyFilters();
        this.calculateStatistics();
        this.loading = false;
      })
    );
  }

  initializeSubscriptions(): void {
    // Watch for filter form changes
    this.subscriptions.add(
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
      })
    );
  }

  applyFilters(): void {
    let filtered = [...this.registrations];
    
    // Search filter
    const searchTerm = this.filterForm.get('searchTerm')?.value || '';
    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.eventName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Event filter
    const eventFilter = this.filterForm.get('eventFilter')?.value || '';
    if (eventFilter) {
      filtered = filtered.filter(reg => reg.eventName === eventFilter);
    }
    
    // Date range filter
    const dateStart = this.filterForm.get('dateStart')?.value;
    const dateEnd = this.filterForm.get('dateEnd')?.value;
    if (dateStart) {
      filtered = filtered.filter(reg => reg.eventDate >= dateStart);
    }
    if (dateEnd) {
      filtered = filtered.filter(reg => reg.eventDate <= dateEnd);
    }
    
    // Payment status filter
    const paymentStatus = this.filterForm.get('paymentStatus')?.value || '';
    if (paymentStatus) {
      filtered = filtered.filter(reg => reg.paymentStatus === paymentStatus);
    }
    
    // Registration status filter (derived from payment status)
    const registrationStatus = this.filterForm.get('registrationStatus')?.value || '';
    if (registrationStatus) {
      filtered = filtered.filter(reg => {
        switch(registrationStatus) {
          case 'confirmed': return reg.paymentStatus === 'confirmed';
          case 'cancelled': return reg.paymentStatus === 'cancelled';
          case 'waitlisted': return reg.paymentStatus === 'pending';
          default: return true;
        }
      });
    }
    
    this.filteredRegistrations = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.filteredRegistrations.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch(column) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'fullName':
          aVal = a.fullName.toLowerCase();
          bVal = b.fullName.toLowerCase();
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'eventName':
          aVal = a.eventName.toLowerCase();
          bVal = b.eventName.toLowerCase();
          break;
        case 'numberOfSeats':
          aVal = a.numberOfSeats;
          bVal = b.numberOfSeats;
          break;
        case 'paymentStatus':
          aVal = a.paymentStatus;
          bVal = b.paymentStatus;
          break;
        case 'registrationDate':
          aVal = new Date(a.registrationDate);
          bVal = new Date(b.registrationDate);
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  calculateStatistics(): void {
    this.totalRegistrations = this.registrations.length;
    this.confirmedCount = this.registrations.filter(r => r.paymentStatus === 'confirmed').length;
    this.pendingCount = this.registrations.filter(r => r.paymentStatus === 'pending').length;
    this.cancelledCount = this.registrations.filter(r => r.paymentStatus === 'cancelled').length;
    this.paidCount = this.registrations.filter(r => r.paymentStatus === 'confirmed').length;
    this.refundedCount = this.registrations.filter(r => r.paymentStatus === 'refunded').length;
  }

  // Selection Management
  toggleSelection(registrationId: string): void {
    const index = this.selectedRegistrations.indexOf(registrationId);
    if (index > -1) {
      this.selectedRegistrations.splice(index, 1);
    } else {
      this.selectedRegistrations.push(registrationId);
    }
    this.showBulkActions = this.selectedRegistrations.length > 0;
  }

  selectAll(): void {
    if (this.selectedRegistrations.length === this.getPaginatedData().length) {
      this.selectedRegistrations = [];
    } else {
      this.selectedRegistrations = this.getPaginatedData().map(reg => reg.id);
    }
    this.showBulkActions = this.selectedRegistrations.length > 0;
  }

  // Pagination
  getPaginatedData(): Registration[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredRegistrations.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  // Actions
  viewDetails(registration: Registration): void {
    this.selectedRegistration = registration;
    this.showDetailsModal = true;
  }

  editRegistration(registration: Registration): void {
    // Navigate to edit page
    // This would typically use router navigation
    console.log('Edit registration:', registration.id);
  }

  cancelRegistration(registrationId: string): void {
    if (confirm('Are you sure you want to cancel this registration?')) {
      this.eventService.updateRegistration(registrationId, { paymentStatus: 'cancelled' });
      this.loadRegistrations();
    }
  }

  resendEmail(registration: Registration): void {
    // Simulate sending email
    alert(`Confirmation email resent to ${registration.email}`);
    this.logAction(registration.id, 'Email resent');
  }

  downloadTicket(registration: Registration): void {
    // Simulate ticket download
    const ticketData = {
      registrationId: registration.id,
      eventName: registration.eventName,
      fullName: registration.fullName,
      numberOfSeats: registration.numberOfSeats
    };
    
    const blob = new Blob([JSON.stringify(ticketData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${registration.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.logAction(registration.id, 'Ticket downloaded');
  }

  // Bulk Actions
  bulkDelete(): void {
    if (confirm(`Are you sure you want to delete ${this.selectedRegistrations.length} registrations?`)) {
      this.selectedRegistrations.forEach(id => {
        this.eventService.deleteRegistration(id);
      });
      this.selectedRegistrations = [];
      this.showBulkActions = false;
      this.loadRegistrations();
    }
  }

  bulkEmail(): void {
    this.showEmailModal = true;
  }

  sendBulkEmail(subject: string, message: string): void {
    // Simulate bulk email sending
    const selectedRegs = this.registrations.filter(reg => 
      this.selectedRegistrations.includes(reg.id)
    );
    
    alert(`Bulk email sent to ${selectedRegs.length} recipients`);
    this.selectedRegistrations.forEach(id => {
      this.logAction(id, 'Bulk email sent');
    });
    
    this.showEmailModal = false;
    this.selectedRegistrations = [];
    this.showBulkActions = false;
  }

  // Export
  exportToExcel(): void {
    // Simulate Excel export
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportToPDF(): void {
    // Simulate PDF export
    alert('PDF export functionality would be implemented here');
  }

  private generateCSV(): string {
    const headers = ['Registration ID', 'Name', 'Email', 'Event', 'Seats', 'Payment Status', 'Date'];
    const rows = this.filteredRegistrations.map(reg => [
      reg.id,
      reg.fullName,
      reg.email,
      reg.eventName,
      reg.numberOfSeats.toString(),
      reg.paymentStatus,
      new Date(reg.registrationDate).toLocaleDateString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Audit Log
  private logAction(registrationId: string, action: string): void {
    // In a real application, this would be sent to a backend service
    const auditLog: AuditLog = {
      id: Date.now().toString(),
      registrationId,
      editedBy: 'Admin User', // Would come from authentication service
      timestamp: new Date().toISOString(),
      changes: [action]
    };
    
    console.log('Audit Log:', auditLog);
  }

  // Utility Methods
  getPaymentStatusBadgeClass(status: string): string {
    switch(status) {
      case 'confirmed': return 'bg-green-600 text-white';
      case 'pending': return 'bg-yellow-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      case 'refunded': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  }

  getRegistrationStatusBadgeClass(status: string): string {
    switch(status) {
      case 'confirmed': return 'bg-green-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      case 'waitlisted': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  }

  getRegistrationStatus(paymentStatus: string): string {
    switch(paymentStatus) {
      case 'confirmed': return 'confirmed';
      case 'cancelled': return 'cancelled';
      case 'pending': return 'waitlisted';
      default: return 'unknown';
    }
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Get unique events for filter dropdown
  getUniqueEvents(): string[] {
    return [...new Set(this.registrations.map(reg => reg.eventName))];
  }

  // Get paginated data for display
  get displayedRegistrations(): Registration[] {
    return this.getPaginatedData();
  }

  // Helper methods for template
  trackByRegistrationId(index: number, registration: Registration): string {
    return registration.id;
  }

  getPaginationPages(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    
    // Show max 5 pages
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
