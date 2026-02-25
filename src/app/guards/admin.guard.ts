import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
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

      if (!authService.hasRole('admin')) {
        // User is authenticated but not admin, redirect to unauthorized
        router.navigate(['/unauthorized']);
        return false;
      }

      // User is authenticated and is admin, allow access
      return true;
    })
  );
};
