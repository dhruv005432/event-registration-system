import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventRegistrationService, Event, Registration } from '../../services/event-registration.service';
import { Subscription } from 'rxjs';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DatePipe } from '@angular/common';

export interface RegistrationForm {
  // Personal Details
  fullName: string;
  corporateEmail: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  country: string;
  
  // Booking Details
  numberOfSeats: number;
  ticketType: 'standard' | 'vip' | 'earlyBird';
  couponCode: string;
  specialRequirements: string;
  
  // Payment Details
  paymentMethod: 'card' | 'upi' | 'netBanking';
  agreeToTerms: boolean;
}

export interface EventStatus {
  status: 'active' | 'limited' | 'closed' | 'upcoming';
  availableSeats: number;
  totalSeats: number;
  registrationDeadline?: Date;
}

export interface PaymentDetails {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

@Component({
  selector: 'app-register-event',
  templateUrl: './register-event.component.html',
  styleUrl: './register-event.component.css',
  providers: [DatePipe]
})
export class RegisterEventComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
  selectedEvent: Event | null = null;
  eventId: string | null = null;
  isSubmitting = false;
  registrationSuccess = false;
  registrationId: string = '';
  qrCodeUrl: string = '';
  
  // Pricing and payment
  basePrice: number = 0;
  totalPrice: number = 0;
  discountAmount: number = 0;
  taxAmount: number = 0;
  currency: string = 'USD';
  
  // Event status
  eventStatus: EventStatus | null = null;
  isRegistrationOpen: boolean = true;
  registrationDeadline: Date | null = null;
  
  // UI state
  showPaymentSection: boolean = false;
  showCouponSection: boolean = false;
  processingPayment: boolean = false;
  paymentSuccess: boolean = false;
  paymentError: string = '';
  
  // Draft management
  hasDraft: boolean = false;
  draftTimestamp: Date | null = null;
  
  // Seat management
  maxSeatsPerBooking: number = 10;
  minSeatsPerBooking: number = 1;
  availableSeats: number = 0;
  
  // Ticket pricing multipliers
  ticketPrices = {
    standard: 1,
    vip: 1.5,
    earlyBird: 0.8
  };
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private eventService: EventRegistrationService,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.registrationForm = this.createRegistrationForm();
  }

  ngOnInit(): void {
    this.loadDraft();
    this.checkForDraft();
    
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        this.eventId = params['eventId'];
        if (this.eventId) {
          this.loadEventDetails();
        } else {
          this.router.navigate(['/events']);
        }
      })
    );
    
    // Watch for form changes to calculate price
    this.subscriptions.add(
      this.registrationForm.valueChanges.subscribe(() => {
        this.calculateTotalPrice();
        this.validateSeatAvailability();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createRegistrationForm(): FormGroup {
    return this.fb.group({
      // Personal Details
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      corporateEmail: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]{10,}$/)]],
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      jobTitle: ['', [Validators.required, Validators.minLength(2)]],
      country: ['', Validators.required],
      
      // Booking Details
      numberOfSeats: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      ticketType: ['standard', Validators.required],
      couponCode: [''],
      specialRequirements: ['', Validators.maxLength(500)],
      
      // Payment Details
      paymentMethod: ['card', Validators.required],
      agreeToTerms: [false, Validators.requiredTrue]
    });
  }

  loadEventDetails(): void {
    if (this.eventId) {
      this.selectedEvent = this.eventService.getEventById(this.eventId);
      if (this.selectedEvent) {
        this.basePrice = this.selectedEvent.price;
        this.availableSeats = this.selectedEvent.availableSeats;
        this.updateEventStatus();
        this.calculateTotalPrice();
      } else {
        this.router.navigate(['/events']);
      }
    }
  }

  updateEventStatus(): void {
    if (!this.selectedEvent) return;
    
    const requestedSeats = this.registrationForm.get('numberOfSeats')?.value || 1;
    const availableSeats = this.selectedEvent.availableSeats;
    const totalSeats = this.selectedEvent.totalSeats || this.selectedEvent.availableSeats + 20; // Estimate total seats
    
    if (availableSeats === 0) {
      this.eventStatus = {
        status: 'closed',
        availableSeats: 0,
        totalSeats: totalSeats
      };
      this.isRegistrationOpen = false;
    } else if (availableSeats < requestedSeats) {
      this.eventStatus = {
        status: 'limited',
        availableSeats: availableSeats,
        totalSeats: totalSeats
      };
      this.isRegistrationOpen = false;
    } else {
      this.eventStatus = {
        status: 'active',
        availableSeats: availableSeats,
        totalSeats: totalSeats
      };
      this.isRegistrationOpen = true;
    }
  }

  checkForDraft(): void {
    if (isPlatformBrowser(this.platformId)) {
      const draftData = localStorage.getItem('registrationDraft');
      if (draftData) {
        const draft = JSON.parse(draftData);
        if (draft.eventId === this.eventId) {
          this.hasDraft = true;
          this.draftTimestamp = new Date(draft.timestamp);
        }
      }
    }
  }

  validateSeatAvailability(): void {
    if (!this.selectedEvent) return;
    
    const requestedSeats = this.registrationForm.get('numberOfSeats')?.value || 1;
    const availableSeats = this.selectedEvent.availableSeats;
    
    if (requestedSeats > availableSeats) {
      this.registrationForm.get('numberOfSeats')?.setErrors({ 
        insufficientSeats: { 
          requested: requestedSeats, 
          available: availableSeats 
        } 
      });
    } else {
      this.registrationForm.get('numberOfSeats')?.setErrors(null);
    }
    
    this.updateEventStatus();
  }

  calculateTotalPrice(): void {
    if (!this.selectedEvent) return;
    
    const numberOfSeats = this.registrationForm.get('numberOfSeats')?.value || 1;
    const ticketType = this.registrationForm.get('ticketType')?.value || 'standard';
    const couponCode = this.registrationForm.get('couponCode')?.value || '';
    
    // Calculate base total
    const ticketMultiplier = this.ticketPrices[ticketType as keyof typeof this.ticketPrices];
    let subtotal = this.basePrice * numberOfSeats * ticketMultiplier;
    
    // Apply coupon discount
    this.discountAmount = 0;
    if (couponCode.toUpperCase() === 'EARLY20') {
      this.discountAmount = subtotal * 0.2;
    } else if (couponCode.toUpperCase() === 'CORP15') {
      this.discountAmount = subtotal * 0.15;
    } else if (couponCode.toUpperCase() === 'STUDENT10') {
      this.discountAmount = subtotal * 0.1;
    }
    
    subtotal -= this.discountAmount;
    
    // Calculate tax (8% for example)
    this.taxAmount = subtotal * 0.08;
    
    // Calculate total
    this.totalPrice = subtotal + this.taxAmount;
  }

  onSubmit(): void {
    if (this.registrationForm.invalid || !this.selectedEvent) {
      this.markFormGroupTouched(this.registrationForm);
      return;
    }

    this.isSubmitting = true;

    const formData = this.registrationForm.value;
    
    const registration: Omit<Registration, 'id' | 'registrationDate' | 'paymentStatus'> = {
      fullName: formData.fullName,
      email: formData.corporateEmail,
      phone: formData.phoneNumber,
      gender: 'other', // Default value
      dateOfBirth: '', // Optional for corporate registration
      eventName: this.selectedEvent.name,
      eventCategory: this.selectedEvent.category,
      eventDate: this.selectedEvent.date,
      timeSlot: this.selectedEvent.time,
      venue: this.selectedEvent.venue,
      numberOfSeats: formData.numberOfSeats,
      paymentMode: formData.paymentMethod === 'card' ? 'online' : 'offline',
      specialRequirements: formData.specialRequirements,
      message: `Company: ${formData.companyName}, Job Title: ${formData.jobTitle}, Ticket Type: ${formData.ticketType}`
    };

    // Simulate API call
    setTimeout(() => {
      const newRegistration = this.eventService.addRegistration(registration);
      this.registrationId = newRegistration.id;
      this.generateQRCode();
      this.registrationSuccess = true;
      this.isSubmitting = false;
    }, 2000);
  }

  generateQRCode(): void {
    // Generate QR code URL (simplified)
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${this.registrationId}`;
  }

  downloadTicket(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Simulate PDF download
      const ticketData = {
        registrationId: this.registrationId,
        eventName: this.selectedEvent?.name,
        fullName: this.registrationForm.get('fullName')?.value,
        numberOfSeats: this.registrationForm.get('numberOfSeats')?.value,
        totalPrice: this.totalPrice
      };
      
      const blob = new Blob([JSON.stringify(ticketData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${this.registrationId}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  saveAsDraft(): void {
    // Save form data to localStorage
    if (isPlatformBrowser(this.platformId)) {
      const draftData = {
        formData: this.registrationForm.value,
        eventId: this.eventId,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('registrationDraft', JSON.stringify(draftData));
      alert('Registration saved as draft!');
    }
  }

  loadDraft(): void {
    if (isPlatformBrowser(this.platformId)) {
      const draftData = localStorage.getItem('registrationDraft');
      if (draftData) {
        const draft = JSON.parse(draftData);
        this.registrationForm.patchValue(draft.formData);
        this.eventId = draft.eventId;
        this.loadEventDetails();
      }
    }
  }

  resetForm(): void {
    this.registrationForm.reset();
    this.registrationSuccess = false;
    this.registrationId = '';
    this.qrCodeUrl = '';
  }

  goBackToEvents(): void {
    this.router.navigate(['/events']);
  }

  // Helper methods
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getEventStatus(): string {
    if (!this.selectedEvent) return 'Unknown';
    const availableSeats = this.selectedEvent.availableSeats;
    const requestedSeats = this.registrationForm.get('numberOfSeats')?.value || 1;
    
    if (availableSeats === 0) return 'Closed';
    if (availableSeats < requestedSeats) return 'Limited Seats';
    return 'Active';
  }

  isEventFullyBooked(): boolean {
    if (!this.selectedEvent) return true;
    const requestedSeats = this.registrationForm.get('numberOfSeats')?.value || 1;
    return this.selectedEvent.availableSeats < requestedSeats;
  }

  // Form field getters for validation
  get fullName() { return this.registrationForm.get('fullName'); }
  get corporateEmail() { return this.registrationForm.get('corporateEmail'); }
  get phoneNumber() { return this.registrationForm.get('phoneNumber'); }
  get companyName() { return this.registrationForm.get('companyName'); }
  get jobTitle() { return this.registrationForm.get('jobTitle'); }
  get country() { return this.registrationForm.get('country'); }
  get numberOfSeats() { return this.registrationForm.get('numberOfSeats'); }
  get agreeToTerms() { return this.registrationForm.get('agreeToTerms'); }
}
