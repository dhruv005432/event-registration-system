import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const managerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user || !authService.isAuthenticated()) {
        // User is not authenticated, redirect to login
        router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        return false;
      }

      // Allow access to admin and manager roles
      if (!authService.hasAnyRole(['admin', 'manager'])) {
        // User is authenticated but doesn't have required role, redirect to unauthorized
        router.navigate(['/unauthorized']);
        return false;
      }

      // User is authenticated and has required role, allow access
      return true;
    })
  );
};
