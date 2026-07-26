import { Routes } from '@angular/router';

/**
 * Table de routage racine.
 *
 * Chaque domaine métier est chargé en différé (`loadChildren`) : le code d'une
 * feature n'est téléchargé que si l'utilisateur s'y rend. C'est déterminant
 * pour la contrainte réseau du cahier des charges — sur une 3G instable,
 * envoyer le back-office admin à un client qui cherche un mécanicien serait
 * du gaspillage de données.
 *
 * Ce fichier ne contient QUE des déclarations de routes : aucune logique,
 * aucun garde. Les gardes appartiennent au fichier de routes de la feature
 * concernée, au plus près de la règle qu'ils appliquent.
 *
 * Les URL sont en français, langue de l'application.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'bienvenue',
  },

  // --- Parcours public ------------------------------------------------------
  {
    path: 'bienvenue',
    loadChildren: () =>
      import('@features/onboarding/onboarding.routes').then((m) => m.onboardingRoutes),
  },
  {
    path: 'compte',
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.authRoutes),
  },

  // --- Espace client --------------------------------------------------------
  {
    path: 'mecaniciens',
    loadChildren: () =>
      import('@features/mechanics/mechanics.routes').then((m) => m.mechanicsRoutes),
  },
  {
    path: 'carte',
    loadChildren: () =>
      import('@features/geolocation/geolocation.routes').then((m) => m.geolocationRoutes),
  },
  {
    path: 'demandes',
    loadChildren: () => import('@features/requests/requests.routes').then((m) => m.requestsRoutes),
  },
  {
    path: 'messages',
    loadChildren: () =>
      import('@features/messaging/messaging.routes').then((m) => m.messagingRoutes),
  },
  {
    path: 'avis',
    loadChildren: () => import('@features/reviews/reviews.routes').then((m) => m.reviewsRoutes),
  },

  // --- Espace mécanicien ----------------------------------------------------
  {
    path: 'tarifs',
    loadChildren: () => import('@features/pricing/pricing.routes').then((m) => m.pricingRoutes),
  },

  // --- Back-office ----------------------------------------------------------
  {
    path: 'admin',
    loadChildren: () => import('@features/admin/admin.routes').then((m) => m.adminRoutes),
  },

  // --- Repli ----------------------------------------------------------------
  // Toujours en dernier : une route joker placée plus haut avalerait tout.
  {
    path: '**',
    loadComponent: () => import('@shared/pages/not-found/not-found').then((m) => m.NotFound),
  },
];
