import { Routes } from '@angular/router';

/**
 * Routes du domaine « Géolocalisation ».
 * Carte interactive et suivi GPS en temps réel.
 *
 * Structure attendue dans ce dossier (CONVENTIONS.md §1) :
 *   data/        dépôts d'accès au microservice « geolocation »
 *   models/      types propres au domaine
 *   components/  composants réutilisés dans cette feature uniquement
 *   pages/       composants routés, à déclarer ci-dessous
 *
 * À remplir par le ticket dédié.
 */
export const geolocationRoutes: Routes = [
  {
    path: '',
    // Écran d'attente en place du domaine, tant qu'aucun ticket ne l'a rempli.
    // Sans lui, un tableau de routes vide n'affiche rien du tout : l'utilisateur
    // se retrouve devant une zone blanche sans savoir si l'application a planté.
    // À remplacer par les vraies routes, pas à conserver.
    loadComponent: () => import('@shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
    data: { fonctionnalite: 'La carte interactive' },
  },
];
