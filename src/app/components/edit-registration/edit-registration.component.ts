import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventRegistrationService, Registration } from '../../services/event-registration.service';
import { Subscription } from 'rxjs';

export interface AuditLog {
  id: string;
  registrationId: string;
  editedBy: string;
  timestamp: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
}

@Component({
  selector: 'app-edit-registration',
  templateUrl: './edit-registration.component.html',
  styleUrl: './edit-registration.component.css'
})
export class EditRegistrationComponent implements OnInit, OnDestroy {
  registration: Registration | null = null;
  registrationId: string = '';
  editForm: FormGroup;
  isSubmitting = false;
  isUpdating = false;
  
  // Security & Audit
  currentUser: User = {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@eventhub.com',
    role: 'admin'
  };
  
  auditLogs: AuditLog[] = [];
  showAuditModal = false;
  
  // UI State
  showDeleteModal = false;
  showRefundModal = false;
  refundAmount: number = 0;
  refundReason: string = '';
  
  // Seat validation
  originalSeats: number = 0;
  availableSeats: number = 0;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private eventService: EventRegistrationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.editForm = this.createEditForm();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.params.subscribe(params => {
        this.registrationId = params['id'];
        if (this.registrationId) {
          this.loadRegistration();
        } else {
          this.router.navigate(['/registrations']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createEditForm(): FormGroup {
    return this.fb.group({
      // Personal Information (Editable)
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]{10,}$/)]],
      companyName: ['', [Validators.required]],
      jobTitle: ['', [Validators.required]],
      
      // Booking Details (Editable)
      numberOfSeats: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      ticketType: ['standard', Validators.required],
      eventDate: ['', Validators.required],
      specialNotes: ['', Validators.maxLength(500)],
      
      // Payment Details (Admin Only)
      paymentStatus: ['pending', Validators.required],
      refundStatus: ['none', Validators.required],
      manualPaymentEntry: ['']
    });
  }

  loadRegistration(): void {
    const registration = this.eventService.getRegistrationById(this.registrationId);
    
    if (registration) {
      this.registration = registration;
      this.originalSeats = registration.numberOfSeats;
      
      // Parse company and job title from message
      const messageParts = this.parseRegistrationMessage(registration.message);
      
      this.editForm.patchValue({
        fullName: registration.fullName,
        email: registration.email,
        phone: registration.phone,
        companyName: messageParts.company || '',
        jobTitle: messageParts.jobTitle || '',
        numberOfSeats: registration.numberOfSeats,
        ticketType: this.extractTicketType(registration.message) || 'standard',
        eventDate: registration.eventDate,
        specialNotes: registration.specialRequirements || '',
        paymentStatus: registration.paymentStatus,
        refundStatus: 'none',
        manualPaymentEntry: ''
      });
      
      // Load audit logs (in real app, this would come from backend)
      this.loadAuditLogs();
    } else {
      this.router.navigate(['/registrations']);
    }
  }

  parseRegistrationMessage(message: string): { company?: string; jobTitle?: string } {
    const parts = message.split(',');
    const result: { company?: string; jobTitle?: string } = {};
    
    parts.forEach(part => {
      if (part.includes('Company:')) {
        result.company = part.split('Company: ')[1]?.trim();
      }
      if (part.includes('Job Title:')) {
        result.jobTitle = part.split('Job Title: ')[1]?.trim();
      }
    });
    
    return result;
  }

  extractTicketType(message: string): string | null {
    if (message.includes('Ticket Type:')) {
      return message.split('Ticket Type: ')[1]?.trim().toLowerCase();
    }
    return null;
  }

  loadAuditLogs(): void {
    // In real application, this would come from backend service
    this.auditLogs = [
      {
        id: '1',
        registrationId: this.registrationId,
        editedBy: 'System',
        timestamp: this.registration?.registrationDate || '',
        changes: [
          {
            field: 'Registration Created',
            oldValue: null,
            newValue: 'Initial registration'
          }
        ]
      }
    ];
  }

  validateSeatAvailability(): boolean {
    const requestedSeats = this.editForm.get('numberOfSeats')?.value || 0;
    return requestedSeats <= this.availableSeats;
  }

  onSubmit(): void {
    if (this.editForm.invalid || !this.registration) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    // Validate seat availability if changing seats
    if (this.editForm.get('numberOfSeats')?.value !== this.originalSeats && !this.validateSeatAvailability()) {
      alert('Not enough seats available for this booking');
      return;
    }

    this.isUpdating = true;
    this.collectChanges();
    
    const formData = this.editForm.value;
    
    const updatedRegistration: Partial<Registration> = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      message: `Company: ${formData.companyName}, Job Title: ${formData.jobTitle}, Ticket Type: ${formData.ticketType}`,
      numberOfSeats: formData.numberOfSeats,
      specialRequirements: formData.specialNotes,
      paymentStatus: formData.paymentStatus as 'confirmed' | 'pending' | 'cancelled' | 'refunded'
    };

    // Update registration
    setTimeout(() => {
      const success = this.eventService.updateRegistration(this.registrationId, updatedRegistration);
      
      if (success) {
        this.logAuditChanges();
        this.isUpdating = false;
        alert('Registration updated successfully!');
        this.loadRegistration(); // Reload to get latest data
      } else {
        this.isUpdating = false;
        alert('Failed to update registration');
      }
    }, 1000);
  }

  collectChanges(): void {
    const formData = this.editForm.value;
    const changes: AuditLog['changes'] = [];

    if (formData.fullName !== this.registration?.fullName) {
      changes.push({
        field: 'Full Name',
        oldValue: this.registration?.fullName,
        newValue: formData.fullName
      });
    }

    if (formData.email !== this.registration?.email) {
      changes.push({
        field: 'Email',
        oldValue: this.registration?.email,
        newValue: formData.email
      });
    }

    if (formData.numberOfSeats !== this.registration?.numberOfSeats) {
      changes.push({
        field: 'Number of Seats',
        oldValue: this.registration?.numberOfSeats,
        newValue: formData.numberOfSeats
      });
    }

    if (formData.paymentStatus !== this.registration?.paymentStatus) {
      changes.push({
        field: 'Payment Status',
        oldValue: this.registration?.paymentStatus,
        newValue: formData.paymentStatus
      });
    }

    // Store changes for audit log
    this.pendingChanges = changes;
  }

  private pendingChanges: AuditLog['changes'] = [];

  logAuditChanges(): void {
    const auditLog: AuditLog = {
      id: Date.now().toString(),
      registrationId: this.registrationId,
      editedBy: this.currentUser.name,
      timestamp: new Date().toISOString(),
      changes: this.pendingChanges
    };

    this.auditLogs.push(auditLog);
    
    // In real application, send to backend
    console.log('Audit Log:', auditLog);
  }

  cancelRegistration(): void {
    if (confirm('Are you sure you want to cancel this registration? This action cannot be undone.')) {
      this.eventService.updateRegistration(this.registrationId, { paymentStatus: 'cancelled' });
      
      this.logAuditChanges();
      alert('Registration cancelled successfully');
      this.router.navigate(['/registrations']);
    }
  }

  issueRefund(): void {
    if (!this.refundAmount || this.refundAmount <= 0) {
      alert('Please enter a valid refund amount');
      return;
    }

    if (!this.refundReason.trim()) {
      alert('Please provide a refund reason');
      return;
    }

    // Process refund
    this.eventService.updateRegistration(this.registrationId, { 
      paymentStatus: 'refunded',
      message: `${this.registration?.message} | Refunded: $${this.refundAmount} - ${this.refundReason}`
    });

    this.logAuditChanges();
    this.showRefundModal = false;
    this.refundAmount = 0;
    this.refundReason = '';
    
    alert('Refund processed successfully');
  }

  deleteRegistration(): void {
    if (confirm('Are you sure you want to delete this registration? This action cannot be undone.')) {
      const success = this.eventService.deleteRegistration(this.registrationId);
      
      if (success) {
        this.logAuditChanges();
        alert('Registration deleted successfully');
        this.router.navigate(['/registrations']);
      } else {
        alert('Failed to delete registration');
      }
    }
  }

  // UI Helper Methods
  showAuditLog(): void {
    this.showAuditModal = true;
  }

  closeAuditLog(): void {
    this.showAuditModal = false;
  }

  openRefundModal(): void {
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
    this.refundAmount = 0;
    this.refundReason = '';
  }

  backToList(): void {
    this.router.navigate(['/registrations']);
  }

  // Security Checks
  canEditPaymentStatus(): boolean {
    return this.currentUser.role === 'admin';
  }

  canEditAllFields(): boolean {
    return this.currentUser.role === 'admin' || this.currentUser.role === 'manager';
  }

  // Form validation helpers
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Getters for form controls
  get fullName() { return this.editForm.get('fullName'); }
  get email() { return this.editForm.get('email'); }
  get phone() { return this.editForm.get('phone'); }
  get companyName() { return this.editForm.get('companyName'); }
  get jobTitle() { return this.editForm.get('jobTitle'); }
  get numberOfSeats() { return this.editForm.get('numberOfSeats'); }
  get ticketType() { return this.editForm.get('ticketType'); }
  get eventDate() { return this.editForm.get('eventDate'); }
  get paymentStatus() { return this.editForm.get('paymentStatus'); }

  // Utility methods
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaymentStatusClass(status: string): string {
    switch(status) {
      case 'confirmed': return 'bg-green-600 text-white';
      case 'pending': return 'bg-yellow-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      case 'refunded': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  }

  getTicketTypeDisplay(type: string): string {
    switch(type) {
      case 'standard': return 'Standard';
      case 'vip': return 'VIP';
      case 'earlyBird': return 'Early Bird';
      default: return type;
    }
  }

  // Additional methods for template
  trackByAuditLogId(index: number, log: AuditLog): string {
    return log.id;
  }

  downloadTicket(): void {
    if (this.registration) {
      const ticketData = {
        registrationId: this.registration.id,
        eventName: this.registration.eventName,
        fullName: this.registration.fullName,
        numberOfSeats: this.registration.numberOfSeats
      };
      
      const blob = new Blob([JSON.stringify(ticketData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${this.registration.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  resendConfirmationEmail(): void {
    if (this.registration) {
      alert(`Confirmation email resent to ${this.registration.email}`);
      this.logAction('Email resent');
    }
  }

  private logAction(action: string): void {
    const auditLog: AuditLog = {
      id: Date.now().toString(),
      registrationId: this.registrationId,
      editedBy: this.currentUser.name,
      timestamp: new Date().toISOString(),
      changes: [{
        field: action,
        oldValue: null,
        newValue: 'Action performed'
      }]
    };

    this.auditLogs.push(auditLog);
    console.log('Action logged:', auditLog);
  }
}
