import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

/**
 * Routes du domaine « Véhicules » : gestion du parc du client.
 * Le dépôt `VehicleRepository` est fourni globalement (`provideCore`), car le
 * formulaire de signalement s'en sert aussi.
 */
export const vehiclesRoutes: Routes = [
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/my-vehicles/my-vehicles').then((m) => m.MyVehiclesPage),
    title: 'Mes véhicules — AutoPro',
  },
];
