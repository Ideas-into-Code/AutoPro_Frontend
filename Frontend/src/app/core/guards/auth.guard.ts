import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';

import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * La session vit dans `localStorage`, inaccessible au rendu serveur : y refuser
 * l'accès redirigerait tout le monde vers la connexion avant l'hydratation.
 * On laisse donc passer côté serveur ; le contrôle réel a lieu dans le
 * navigateur, juste après l'hydratation.
 */
function serverPass(): boolean {
  return !isPlatformBrowser(inject(PLATFORM_ID));
}

/**
 * Autorise l'accès à une zone uniquement si l'utilisateur est connecté.
 * Sinon, redirige vers la page de connexion.
 *
 * `CanMatchFn` plutôt que `CanActivateFn` : la route n'est même pas mise en
 * correspondance, donc le code de la feature protégée n'est pas téléchargé
 * pour un visiteur non connecté.
 */
export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  if (serverPass()) {
    return true;
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.parseUrl('/compte/connexion');
};

/** Autorise l'accès si l'utilisateur a l'un des rôles attendus. */
export function roleGuard(...roles: UserRole[]): CanMatchFn {
  return (): boolean | UrlTree => {
    if (serverPass()) {
      return true;
    }
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.userRole();
    if (role === null) {
      return router.parseUrl('/compte/connexion');
    }
    return roles.includes(role) ? true : router.parseUrl('/accueil');
  };
}
