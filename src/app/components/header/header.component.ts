import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  currentUser: any;
  isAdmin = false;
  isManager = false;
  isLoggedIn = false;
  showMobileMenu = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.isAdmin = this.authService.isAdmin();
      this.isManager = this.authService.isManager();
    });
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  navigateToAdmin(): void {
    this.router.navigate(['/admin']);
    this.showMobileMenu = false;
  }

  navigateToManager(): void {
    this.router.navigate(['/manager']);
    this.showMobileMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.showMobileMenu = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.showMobileMenu = false;
  }

  // Check if user can see admin links
  canSeeAdminLinks(): boolean {
    return this.isAdmin || this.isManager;
  }

  // Get user display name
  getDisplayName(): string {
    return this.currentUser?.fullName || 'User';
  }

  // Get user initials for avatar
  getUserInitials(): string {
    if (!this.currentUser?.fullName) return 'U';
    const names = this.currentUser.fullName.split(' ');
    return names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
