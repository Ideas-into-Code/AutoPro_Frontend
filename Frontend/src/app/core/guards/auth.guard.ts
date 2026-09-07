import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';

import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * Autorise l'accès à une zone uniquement si l'utilisateur est connecté.
 * Sinon, redirige vers la page de connexion.
 *
 * `CanMatchFn` plutôt que `CanActivateFn` : la route n'est même pas mise en
 * correspondance, donc le code de la feature protégée n'est pas téléchargé
 * pour un visiteur non connecté.
 */
export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.parseUrl('/compte/connexion');
};

/** Autorise l'accès si l'utilisateur a l'un des rôles attendus. */
export function roleGuard(...roles: UserRole[]): CanMatchFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.userRole();
    if (role === null) {
      return router.parseUrl('/compte/connexion');
    }
    return roles.includes(role) ? true : router.parseUrl('/accueil');
  };
}
