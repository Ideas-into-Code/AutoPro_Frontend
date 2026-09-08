import { Routes } from '@angular/router';

import { BrowserPositionProvider, PositionProvider } from '@core';
import { authGuard } from '@core/guards/auth.guard';

import { ProfileRepository } from './data/profile.repository';
import { HttpProfileRepository } from './data/profile.repository.http';

/**
 * Routes du domaine « Profil » : compte de l'utilisateur connecté et, pour un
 * mécanicien, sa fiche professionnelle (spécialité, disponibilité, position).
 *
 * Le même écran sert les deux personas — il est monté sous `/profil` (coquille
 * client) et `/mecanicien/profil` (coquille mécanicien). `PositionProvider`
 * est fourni ici : le mécanicien capture sa position d'atelier depuis cette
 * page.
 */
export const profileRoutes: Routes = [
  {
    path: '',
    canMatch: [authGuard],
    providers: [
      { provide: ProfileRepository, useClass: HttpProfileRepository },
      { provide: PositionProvider, useClass: BrowserPositionProvider },
    ],
    loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage),
    title: 'Mon profil — AutoPro',
  },
];
