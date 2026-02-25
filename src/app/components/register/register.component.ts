import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

export enum AccountType {
  INDIVIDUAL = 'individual',
  ORGANIZATION = 'organization',
  EVENT_MANAGER = 'event_manager'
}

export interface UserRegistration {
  // Personal Information
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  
  // Company Information (for organizations)
  companyName?: string;
  industryType?: string;
  companySize?: string;
  websiteUrl?: string;
  country: string;
  
  // Account Settings
  accountType: AccountType;
  subscribeToNewsletter: boolean;
  enableTwoFactorAuth: boolean;
  defaultLanguage: string;
  timeZone: string;
  
  // Security
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  captchaVerified: boolean;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
  selectedAccountType: AccountType = AccountType.INDIVIDUAL;
  isSubmitting = false;
  registrationSuccess = false;
  verificationEmailSent = false;
  
  // Password strength indicator
  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthColor = '';
  
  // Form steps
  currentStep = 1;
  totalSteps = 3;
  
  // Available options
  accountTypes = [
    {
      type: AccountType.INDIVIDUAL,
      title: 'Individual User',
      description: 'Perfect for personal event management and attending events',
      features: ['Create personal events', 'Join public events', 'Track registrations', 'Basic analytics'],
      icon: 'fas fa-user'
    },
    {
      type: AccountType.ORGANIZATION,
      title: 'Organization / Company',
      description: 'Enterprise solution for companies and organizations',
      features: ['Team collaboration', 'Advanced analytics', 'Custom branding', 'Priority support'],
      icon: 'fas fa-building'
    },
    {
      type: AccountType.EVENT_MANAGER,
      title: 'Event Manager',
      description: 'Professional event management with advanced tools',
      features: ['Unlimited events', 'Advanced reporting', 'API access', 'White-label options'],
      icon: 'fas fa-calendar-alt'
    }
  ];
  
  industryTypes = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Entertainment',
    'Sports', 'Corporate', 'Non-Profit', 'Government', 'Other'
  ];
  
  companySizes = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
  ];
  
  languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' }
  ];
  
  timeZones = [
    { value: 'UTC', name: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', name: 'Eastern Time (ET)' },
    { value: 'America/Chicago', name: 'Central Time (CT)' },
    { value: 'America/Denver', name: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
    { value: 'Europe/London', name: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', name: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', name: 'Japan Standard Time (JST)' }
  ];
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registrationForm = this.createRegistrationForm();
  }

  ngOnInit(): void {
    // Watch for password changes to update strength indicator
    this.subscriptions.add(
      this.registrationForm.get('password')?.valueChanges.subscribe(() => {
        this.updatePasswordStrength();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createRegistrationForm(): FormGroup {
    return this.fb.group({
      // Personal Information
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]{10,}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]],
      
      // Company Information (conditional)
      companyName: [''],
      industryType: [''],
      companySize: [''],
      websiteUrl: ['', Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)],
      country: ['', Validators.required],
      
      // Account Settings
      accountType: [AccountType.INDIVIDUAL, Validators.required],
      subscribeToNewsletter: [false],
      enableTwoFactorAuth: [false],
      defaultLanguage: ['en'],
      timeZone: ['UTC'],
      
      // Security
      agreeToTerms: [false, Validators.requiredTrue],
      agreeToPrivacy: [false, Validators.requiredTrue],
      captchaVerified: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Custom validator for password matching
  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  selectAccountType(type: AccountType): void {
    this.selectedAccountType = type;
    this.registrationForm.patchValue({ accountType: type });
    
    // Toggle company information fields based on account type
    const companyFields = ['companyName', 'industryType', 'companySize', 'websiteUrl'];
    if (type === AccountType.ORGANIZATION) {
      companyFields.forEach(field => {
        this.registrationForm.get(field)?.setValidators([Validators.required]);
        this.registrationForm.get(field)?.updateValueAndValidity();
      });
    } else {
      companyFields.forEach(field => {
        this.registrationForm.get(field)?.clearValidators();
        this.registrationForm.get(field)?.updateValueAndValidity();
      });
    }
  }

  updatePasswordStrength(): void {
    const password = this.registrationForm.get('password')?.value || '';
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
    
    this.passwordStrength = strength;
    
    if (strength < 40) {
      this.passwordStrengthText = 'Weak';
      this.passwordStrengthColor = 'text-red-500';
    } else if (strength < 70) {
      this.passwordStrengthText = 'Medium';
      this.passwordStrengthColor = 'text-yellow-500';
    } else {
      this.passwordStrengthText = 'Strong';
      this.passwordStrengthColor = 'text-green-500';
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onCaptchaVerified(): void {
    this.registrationForm.patchValue({ captchaVerified: true });
  }

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.markFormGroupTouched(this.registrationForm);
      return;
    }

    this.isSubmitting = true;

    const formData = this.registrationForm.value;
    
    const registrationData: UserRegistration = {
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      companyName: formData.companyName,
      industryType: formData.industryType,
      companySize: formData.companySize,
      websiteUrl: formData.websiteUrl,
      country: formData.country,
      accountType: formData.accountType,
      subscribeToNewsletter: formData.subscribeToNewsletter,
      enableTwoFactorAuth: formData.enableTwoFactorAuth,
      defaultLanguage: formData.defaultLanguage,
      timeZone: formData.timeZone,
      agreeToTerms: formData.agreeToTerms,
      agreeToPrivacy: formData.agreeToPrivacy,
      captchaVerified: formData.captchaVerified
    };

    // Simulate API call for registration
    setTimeout(() => {
      this.registrationSuccess = true;
      this.verificationEmailSent = true;
      this.isSubmitting = false;
      
      // In real implementation, this would call the auth service
      // this.authService.register(registrationData).subscribe(...)
    }, 2000);
  }

  registerWithGoogle(): void {
    // Implement Google OAuth registration
    console.log('Register with Google');
    // this.authService.signInWithGoogle().subscribe(...)
  }

  registerWithLinkedIn(): void {
    // Implement LinkedIn OAuth registration
    console.log('Register with LinkedIn');
    // this.authService.signInWithLinkedIn().subscribe(...)
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
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

  // Form field getters for validation
  get fullName() { return this.registrationForm.get('fullName'); }
  get email() { return this.registrationForm.get('email'); }
  get phoneNumber() { return this.registrationForm.get('phoneNumber'); }
  get password() { return this.registrationForm.get('password'); }
  get confirmPassword() { return this.registrationForm.get('confirmPassword'); }
  get companyName() { return this.registrationForm.get('companyName'); }
  get industryType() { return this.registrationForm.get('industryType'); }
  get companySize() { return this.registrationForm.get('companySize'); }
  get websiteUrl() { return this.registrationForm.get('websiteUrl'); }
  get country() { return this.registrationForm.get('country'); }
  get agreeToTerms() { return this.registrationForm.get('agreeToTerms'); }
  get agreeToPrivacy() { return this.registrationForm.get('agreeToPrivacy'); }
  get captchaVerified() { return this.registrationForm.get('captchaVerified'); }
}
