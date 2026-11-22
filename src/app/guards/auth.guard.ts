import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Auth } from '../services/auth';

export const authGuard = () => {
  // DEV-only short-circuit so /equipo (and other guarded routes) load without a token.
  if (environment.bypassAuth) {
    return true;
  }

  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
