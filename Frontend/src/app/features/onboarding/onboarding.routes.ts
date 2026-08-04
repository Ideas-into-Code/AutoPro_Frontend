import { Routes } from '@angular/router';

/**
 * Routes du domaine « Onboarding ».
 * Parcours de première utilisation, côté client uniquement.
 */
export const onboardingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/splash/splash').then((m) => m.SplashComponent),
  },
  {
    path: 'presentation',
    loadComponent: () => import('./pages/slides/slides').then((m) => m.SlidesComponent),
  },
];
