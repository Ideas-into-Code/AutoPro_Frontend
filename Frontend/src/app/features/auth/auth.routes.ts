import { Routes } from '@angular/router';

/**
 * Routes du domaine « Authentification ».
 * Inscription, connexion par téléphone/OTP ou e-mail, sélection de rôle.
 */
export const authRoutes: Routes = [
  {
    path: 'connexion',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'selection-role',
    loadComponent: () =>
      import('./pages/role-selection/role-selection').then((m) => m.RoleSelectionComponent),
  },
  {
    path: 'inscription',
    loadComponent: () => import('./pages/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    redirectTo: 'connexion',
    pathMatch: 'full',
  },
];
