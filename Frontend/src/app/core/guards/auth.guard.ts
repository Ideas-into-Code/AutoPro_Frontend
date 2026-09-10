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
    // Renvoi vers l'espace du rôle courant, pas vers l'accueil client : un
    // mécanicien qui tombe sur une route admin doit revenir à SON tableau de
    // bord, pas dans la coquille cliente.
    return roles.includes(role) ? true : router.parseUrl(auth.homeRoute());
  };
}

/**
 * Garde de la coquille cliente.
 *
 * L'accueil, la carte et la liste des mécaniciens restent publics : un visiteur
 * non connecté passe. Mais un mécanicien ou un administrateur connecté n'a rien
 * à faire dans l'espace client — on le renvoie vers le sien. Sans cette garde,
 * un lien mal ciblé ou une vieille notification fait « basculer » un mécanicien
 * dans l'interface client.
 */
export const clientAreaGuard: CanMatchFn = (): boolean | UrlTree => {
  if (serverPass()) {
    return true;
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.userRole();
  if (role === 'mecanicien' || role === 'admin') {
    return router.parseUrl(auth.homeRoute());
  }
  return true;
};
