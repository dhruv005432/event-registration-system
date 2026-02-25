import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

export interface ContactFormData {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  inquiryType: string;
  subject: string;
  message: string;
  agreeToPrivacy: boolean;
}

export interface DemoRequest {
  companyName: string;
  employeeCount: string;
  eventSize: string;
  preferredDate: string;
  preferredTime: string;
}

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  
  // Contact Form
  contactForm: FormGroup;
  isSubmitting = false;
  isSubmitted = false;
  ticketNumber: string = '';
  
  // Demo Request
  demoForm: FormGroup;
  isDemoSubmitting = false;
  isDemoSubmitted = false;
  
  // UI State
  showSuccessModal = false;
  showDemoModal = false;
  currentInquiryType = 'general';
  
  // Company Information
  companyInfo = {
    name: 'EventHub Technologies',
    headquarters: '1234 Tech Boulevard, Silicon Valley, CA 94025',
    branches: ['New York Office', 'London Office', 'Singapore Office'],
    workingHours: 'Monday - Friday: 9:00 AM - 6:00 PM PST',
    timezone: 'Pacific Standard Time (PST)',
    supportEmail: {
      general: 'support@eventhub.com',
      sales: 'sales@eventhub.com',
      technical: 'tech@eventhub.com'
    },
    phone: {
      support: '+1 (555) 123-4567',
      sales: '+1 (555) 234-5678',
      emergency: '+1 (555) 345-6789'
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/eventhub',
      twitter: 'https://twitter.com/eventhub',
      instagram: 'https://instagram.com/eventhub',
      facebook: 'https://facebook.com/eventhub'
    }
  };

  // Inquiry Types
  inquiryTypes = [
    { value: 'general', label: 'General Question' },
    { value: 'sales', label: 'Sales Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'demo', label: 'Demo Request' }
  ];

  // Employee Count Options
  employeeCounts = [
    { value: '1-10', label: '1-10 Employees' },
    { value: '11-50', label: '11-50 Employees' },
    { value: '51-200', label: '51-200 Employees' },
    { value: '201-500', label: '201-500 Employees' },
    { value: '500+', label: '500+ Employees' }
  ];

  // Event Size Options
  eventSizes = [
    { value: 'small', label: 'Small (1-50 attendees)' },
    { value: 'medium', label: 'Medium (51-200 attendees)' },
    { value: 'large', label: 'Large (201-500 attendees)' },
    { value: 'enterprise', label: 'Enterprise (500+ attendees)' }
  ];

  // Time Slots
  timeSlots = [
    { value: '9:00', label: '9:00 AM PST' },
    { value: '10:00', label: '10:00 AM PST' },
    { value: '11:00', label: '11:00 AM PST' },
    { value: '14:00', label: '2:00 PM PST' },
    { value: '15:00', label: '3:00 PM PST' },
    { value: '16:00', label: '4:00 PM PST' }
  ];

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.contactForm = this.createContactForm();
    this.demoForm = this.createDemoForm();
  }

  ngOnInit(): void {
    // Initialize any additional setup
  }

  createContactForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      companyName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]{10,}$/)]],
      inquiryType: ['general', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      agreeToPrivacy: [false, Validators.requiredTrue]
    });
  }

  createDemoForm(): FormGroup {
    return this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      employeeCount: ['', Validators.required],
      eventSize: ['', Validators.required],
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required]
    });
  }

  onSubmitContact(): void {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched(this.contactForm);
      return;
    }

    this.isSubmitting = true;
    
    // Generate ticket number
    this.ticketNumber = this.generateTicketNumber();
    
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.isSubmitted = true;
      this.showSuccessModal = true;
      
      // In real application, send to backend
      console.log('Contact Form Submitted:', {
        ...this.contactForm.value,
        ticketNumber: this.ticketNumber,
        timestamp: new Date().toISOString()
      });
    }, 2000);
  }

  onSubmitDemo(): void {
    if (this.demoForm.invalid) {
      this.markFormGroupTouched(this.demoForm);
      return;
    }

    this.isDemoSubmitting = true;
    
    // Simulate API call
    setTimeout(() => {
      this.isDemoSubmitting = false;
      this.isDemoSubmitted = true;
      this.showDemoModal = true;
      
      // In real application, send to backend
      console.log('Demo Request Submitted:', {
        ...this.demoForm.value,
        timestamp: new Date().toISOString()
      });
    }, 2000);
  }

  resetContactForm(): void {
    this.contactForm.reset();
    this.isSubmitted = false;
    this.showSuccessModal = false;
  }

  resetDemoForm(): void {
    this.demoForm.reset();
    this.isDemoSubmitted = false;
    this.showDemoModal = false;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  closeDemoModal(): void {
    this.showDemoModal = false;
  }

  // Helper methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private generateTicketNumber(): string {
    const prefix = 'EVT';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  // Getters for form controls
  get fullName() { return this.contactForm.get('fullName'); }
  get companyName() { return this.contactForm.get('companyName'); }
  get email() { return this.contactForm.get('email'); }
  get phone() { return this.contactForm.get('phone'); }
  get inquiryType() { return this.contactForm.get('inquiryType'); }
  get subject() { return this.contactForm.get('subject'); }
  get message() { return this.contactForm.get('message'); }
  get agreeToPrivacy() { return this.contactForm.get('agreeToPrivacy'); }

  get demoCompanyName() { return this.demoForm.get('companyName'); }
  get employeeCount() { return this.demoForm.get('employeeCount'); }
  get eventSize() { return this.demoForm.get('eventSize'); }
  get preferredDate() { return this.demoForm.get('preferredDate'); }
  get preferredTime() { return this.demoForm.get('preferredTime'); }

  // Utility methods
  getMinDate(): string {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Minimum tomorrow
    return today.toISOString().split('T')[0];
  }

  formatPhoneNumber(phone: string): string {
    // Simple phone formatting
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  openLiveChat(): void {
    // In real application, this would open live chat
    alert('Live chat would open here. In production, this would connect to your live chat system.');
  }

  openWhatsApp(): void {
    // In real application, this would open WhatsApp Business
    alert('WhatsApp Business would open here. In production, this would connect to your WhatsApp Business number.');
  }
}
