import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Rattache le token JWT (`Authorization: Bearer …`) aux appels vers l'API et
 * déconnecte l'utilisateur si le serveur répond 401 sur une requête authentifiée.
 *
 * Placé avant `apiErrorInterceptor` dans la chaîne pour que la déconnexion
 * intervienne avant la normalisation de l'erreur.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const isApiCall = request.url.startsWith('/api') || request.url.includes('/api/');
  const isAuthEndpoint = request.url.includes('/api/auth/');

  const authorized =
    token && isApiCall && !isAuthEndpoint
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        auth.logout();
        void router.navigate(['/compte/connexion']);
      }
      return throwError(() => error);
    }),
  );
};
