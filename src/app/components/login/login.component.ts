import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export enum LoginStep {
  LOGIN = 'login',
  TWO_FACTOR = 'two_factor',
  FORGOT_PASSWORD = 'forgot_password',
  RESET_PASSWORD = 'reset_password'
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  resetPasswordForm: FormGroup;
  
  currentStep: LoginStep = LoginStep.LOGIN;
  isSubmitting = false;
  loginSuccess = false;
  
  // Security features
  showPassword = false;
  rememberMe = false;
  loginAttempts = 0;
  maxLoginAttempts = 5;
  accountLocked = false;
  
  // Two-Factor Authentication
  twoFactorCode = '';
  twoFactorSent = false;
  twoFactorResendEnabled = false;
  twoFactorTimer = 60;
  twoFactorInterval: any;
  
  // Forgot Password
  resetEmailSent = false;
  resetToken = '';
  
  // Error handling
  errorMessage = '';
  successMessage = '';
  
  // User role for redirection
  userRole: string = '';
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loginForm = this.createLoginForm();
    this.forgotPasswordForm = this.createForgotPasswordForm();
    this.resetPasswordForm = this.createResetPasswordForm();
  }

  ngOnInit(): void {
    // Check for reset token in URL
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        if (params['token']) {
          this.resetToken = params['token'];
          this.currentStep = LoginStep.RESET_PASSWORD;
        }
        
        // Check for redirect URL
        if (params['redirect']) {
          // Store redirect URL for after login
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('redirectUrl', params['redirect']);
          }
        }
      })
    );
    
    // Check if user is already logged in
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.redirectBasedOnRole();
        }
      })
    );
    
    // Check for remembered email
    if (isPlatformBrowser(this.platformId)) {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      if (rememberedEmail) {
        this.loginForm.patchValue({ email: rememberedEmail, rememberMe: true });
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.twoFactorInterval) {
      clearInterval(this.twoFactorInterval);
    }
  }

  createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  createForgotPasswordForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]]
    });
  }

  createResetPasswordForm(): FormGroup {
    return this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Custom validator for password matching
  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    if (this.accountLocked) {
      this.errorMessage = 'Account is locked due to multiple failed attempts. Please contact support.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const credentials: LoginCredentials = this.loginForm.value;

    // Simulate API call for login
    setTimeout(() => {
      this.processLogin(credentials);
    }, 1500);
  }

  processLogin(credentials: LoginCredentials): void {
    // Simulate authentication logic
    const mockUsers = [
      { email: 'admin@eventhub.com', password: 'admin123', role: 'admin', verified: true },
      { email: 'manager@eventhub.com', password: 'manager123', role: 'manager', verified: true },
      { email: 'user@eventhub.com', password: 'user123', role: 'user', verified: true },
      { email: 'unverified@eventhub.com', password: 'user123', role: 'user', verified: false }
    ];

    const user = mockUsers.find(u => u.email === credentials.email && u.password === credentials.password);

    if (!user) {
      this.handleLoginFailure();
      return;
    }

    if (!user.verified) {
      this.errorMessage = 'Account not verified. Please check your email for verification link.';
      this.isSubmitting = false;
      return;
    }

    // Successful login
    this.loginAttempts = 0;
    this.userRole = user.role;

    // Handle remember me
    if (credentials.rememberMe) {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('rememberedEmail', credentials.email);
      }
    } else {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('rememberedEmail');
      }
    }

    // Simulate 2FA requirement for admin/manager
    if (user.role === 'admin' || user.role === 'manager') {
      this.currentStep = LoginStep.TWO_FACTOR;
      this.sendTwoFactorCode();
      this.isSubmitting = false;
    } else {
      this.completeLogin(user);
    }
  }

  handleLoginFailure(): void {
    this.loginAttempts++;
    this.isSubmitting = false;

    if (this.loginAttempts >= this.maxLoginAttempts) {
      this.accountLocked = true;
      this.errorMessage = 'Account locked due to multiple failed attempts. Please contact support or reset your password.';
    } else {
      const remainingAttempts = this.maxLoginAttempts - this.loginAttempts;
      this.errorMessage = `Invalid credentials. ${remainingAttempts} attempts remaining.`;
    }
  }

  sendTwoFactorCode(): void {
    // Simulate sending 2FA code
    this.twoFactorSent = true;
    this.twoFactorTimer = 60;
    this.twoFactorResendEnabled = false;
    
    // Start countdown timer
    this.twoFactorInterval = setInterval(() => {
      this.twoFactorTimer--;
      if (this.twoFactorTimer <= 0) {
        this.twoFactorResendEnabled = true;
        clearInterval(this.twoFactorInterval);
      }
    }, 1000);
    
    this.successMessage = 'Two-factor authentication code sent to your email.';
  }

  verifyTwoFactorCode(): void {
    if (this.twoFactorCode.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit code.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Simulate 2FA verification
    setTimeout(() => {
      if (this.twoFactorCode === '123456') {
        const user = {
          email: this.loginForm.value.email,
          role: this.userRole,
          verified: true
        };
        this.completeLogin(user);
      } else {
        this.errorMessage = 'Invalid verification code. Please try again.';
        this.isSubmitting = false;
      }
    }, 1000);
  }

  resendTwoFactorCode(): void {
    this.sendTwoFactorCode();
  }

  completeLogin(user: any): void {
    this.loginSuccess = true;
    this.isSubmitting = false;
    
    // Store user session (in real app, this would be JWT token)
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('authToken', 'mock-jwt-token-' + Date.now());
    }
    
    // Update auth service (simulate login)
    // In real implementation, this would be handled by the auth service login method
    
    // Redirect based on role after a short delay
    setTimeout(() => {
      this.redirectBasedOnRole();
    }, 1500);
  }

  redirectBasedOnRole(): void {
    const user = this.authService.getCurrentUser();
    let redirectUrl = null;
    
    if (isPlatformBrowser(this.platformId)) {
      redirectUrl = localStorage.getItem('redirectUrl');
      // Clear redirect URL
      localStorage.removeItem('redirectUrl');
    }
    
    if (redirectUrl) {
      this.router.navigate([redirectUrl]);
      return;
    }
    
    // Role-based redirection
    switch (user?.role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'manager':
        this.router.navigate(['/manager']);
        break;
      case 'user':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }

  // Forgot Password Flow
  startForgotPassword(): void {
    this.currentStep = LoginStep.FORGOT_PASSWORD;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onForgotPasswordSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.forgotPasswordForm.value.email;

    // Simulate sending reset email
    setTimeout(() => {
      this.resetEmailSent = true;
      this.isSubmitting = false;
      this.successMessage = `Password reset link sent to ${email}. Please check your inbox.`;
    }, 1500);
  }

  // Reset Password Flow
  onResetPasswordSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched(this.resetPasswordForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const resetData: ResetPasswordData = {
      token: this.resetToken,
      newPassword: this.resetPasswordForm.value.newPassword,
      confirmPassword: this.resetPasswordForm.value.confirmPassword
    };

    // Simulate password reset
    setTimeout(() => {
      this.successMessage = 'Password reset successfully. You can now login with your new password.';
      this.isSubmitting = false;
      
      // Redirect to login after delay
      setTimeout(() => {
        this.backToLogin();
      }, 2000);
    }, 1500);
  }

  // Social Login Methods
  loginWithGoogle(): void {
    this.isSubmitting = true;
    // Simulate Google OAuth
    setTimeout(() => {
      const user = {
        email: 'user@gmail.com',
        role: 'user',
        verified: true
      };
      this.completeLogin(user);
    }, 1500);
  }

  loginWithLinkedIn(): void {
    this.isSubmitting = true;
    // Simulate LinkedIn OAuth
    setTimeout(() => {
      const user = {
        email: 'user@linkedin.com',
        role: 'manager',
        verified: true
      };
      this.completeLogin(user);
    }, 1500);
  }

  loginWithMicrosoft(): void {
    this.isSubmitting = true;
    // Simulate Microsoft OAuth
    setTimeout(() => {
      const user = {
        email: 'user@outlook.com',
        role: 'admin',
        verified: true
      };
      this.completeLogin(user);
    }, 1500);
  }

  // Navigation Methods
  backToLogin(): void {
    this.currentStep = LoginStep.LOGIN;
    this.errorMessage = '';
    this.successMessage = '';
    this.twoFactorCode = '';
    this.resetEmailSent = false;
    this.isSubmitting = false;
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  contactSupport(): void {
    // In real app, this would navigate to support page or open email client
    window.location.href = 'mailto:support@eventhub.com';
  }

  // OTP Input Methods
  onOtpInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;
    
    if (value.length === 1) {
      // Move to next input
      if (index < 5) {
        const nextInput = input.parentElement.children[index + 1];
        if (nextInput) nextInput.focus();
      }
    }
    
    // Update twoFactorCode
    this.updateTwoFactorCode();
  }

  onOtpKeyDown(event: any, index: number): void {
    const input = event.target;
    
    // Handle backspace
    if (event.key === 'Backspace' && input.value === '') {
      // Move to previous input
      if (index > 0) {
        const prevInput = input.parentElement.children[index - 1];
        if (prevInput) prevInput.focus();
      }
    }
    
    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = input.parentElement.children[index - 1];
      if (prevInput) prevInput.focus();
    }
    
    if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = input.parentElement.children[index + 1];
      if (nextInput) nextInput.focus();
    }
  }

  updateTwoFactorCode(): void {
    const inputs = document.querySelectorAll('.otp-input');
    let code = '';
    inputs.forEach((input: any) => {
      code += input.value;
    });
    this.twoFactorCode = code;
  }

  trackByIndex(index: number): number {
    return index;
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
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  get forgotEmail() { return this.forgotPasswordForm.get('email'); }
  get newPassword() { return this.resetPasswordForm.get('newPassword'); }
  get confirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }
}
