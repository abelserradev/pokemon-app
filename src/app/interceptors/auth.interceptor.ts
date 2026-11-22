import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  // Solo agregar token si estamos en el navegador
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');

    if (token) {
      // Clonar la petición y agregar el header de autorización
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // With bypassAuth, keep the page mounted so UI can soft-fail (empty team / PokeAPI search).
          if (error.status === 401 && !environment.bypassAuth) {
            if (isPlatformBrowser(platformId)) {
              localStorage.removeItem('token');
              router.navigate(['/login']);
            }
          }
          return throwError(() => error);
        }),
      );
    }
  }

  return next(req);
};
