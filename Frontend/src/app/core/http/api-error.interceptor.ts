import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, timeout } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { toApiError } from './api-error';

/**
 * Applique le délai maximal configuré et normalise toute erreur HTTP en
 * `ApiError` avant qu'elle n'atteigne les features.
 *
 * Intercepteur fonctionnel plutôt que classe : c'est la forme recommandée
 * depuis Angular 15 et elle s'injecte sans fournisseur supplémentaire.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const { timeoutMs } = inject(API_CONFIG);

  return next(request).pipe(
    timeout(timeoutMs),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        return throwError(() => toApiError(error));
      }

      // Un dépassement de `timeout` n'est pas une HttpErrorResponse : on le
      // ramène malgré tout à la forme normalisée, avec le statut 408.
      return throwError(() =>
        toApiError(new HttpErrorResponse({ status: 408, url: request.url })),
      );
    }),
  );
};
