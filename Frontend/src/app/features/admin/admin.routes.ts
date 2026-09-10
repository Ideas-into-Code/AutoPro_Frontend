import { Routes } from '@angular/router';

import { roleGuard } from '@core/guards/auth.guard';

import {
  AccountDirectoryRepository,
  AccountModerationRepository,
  MechanicApprovalRepository,
  SystemOverviewRepository,
} from './data/admin-dashboard.repository';
import {
  HttpAccountDirectoryRepository,
  HttpAccountModerationRepository,
  HttpMechanicApprovalRepository,
  HttpSystemOverviewRepository,
} from './data/admin-dashboard.repository.http';

/**
 * Routes du back-office : supervision, gestion des comptes, validation des
 * mécaniciens.
 */
export const adminRoutes: Routes = [
  {
    path: '',

    // Back-office réservé aux administrateurs authentifiés.
    canMatch: [roleGuard('admin')],

    /**
     * Dépôts du back-office, tous branchés sur `/api/admin/**` :
     * indicateurs (`/stats`), comptes (`/users` + `/mechanics`), modération
     * (`PATCH /users/{id}/status`), validation (`/mechanics/pending`,
     * `PATCH /mechanics/{id}/validate`).
     *
     * Fournis sur la route et non globalement : seul ce domaine s'en sert, et
     * le code du back-office reste hors du bundle initial.
     *
     * Quatre contrats, quatre classes — chacune sans état : c'est le backend
     * qui fait autorité sur le statut d'un compte, et l'écran relit après
     * chaque écriture.
     */
    providers: [
      { provide: SystemOverviewRepository, useClass: HttpSystemOverviewRepository },
      { provide: AccountDirectoryRepository, useClass: HttpAccountDirectoryRepository },
      { provide: AccountModerationRepository, useClass: HttpAccountModerationRepository },
      { provide: MechanicApprovalRepository, useClass: HttpMechanicApprovalRepository },
    ],

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardPage),
        title: 'Back-office — AutoPro',
      },
    ],
  },
];
