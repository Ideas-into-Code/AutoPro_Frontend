import { Routes } from '@angular/router';

import { roleGuard } from '@core/guards/auth.guard';

import {
  AccountDirectoryRepository,
  AccountModerationRepository,
  MechanicApprovalRepository,
  SystemOverviewRepository,
} from './data/admin-dashboard.repository';
import { MockAdminBackend } from './data/admin-dashboard.repository.mock';

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
     * POINT DE BASCULE DU BACK-OFFICE.
     *
     * Le jour où les microservices répondent, ces quatre lignes deviennent
     * leurs équivalents `Http…`, déjà écrits dans
     * `data/admin-dashboard.repository.http.ts` :
     *
     *   { provide: SystemOverviewRepository, useClass: HttpSystemOverviewRepository },
     *   { provide: AccountDirectoryRepository, useClass: HttpAccountDirectoryRepository },
     *   { provide: AccountModerationRepository, useClass: HttpAccountModerationRepository },
     *   { provide: MechanicApprovalRepository, useClass: HttpMechanicApprovalRepository },
     *
     * Aucun composant ne bouge.
     *
     * Fournis sur la route et non globalement : seul ce domaine s'en sert, et
     * les données simulées restent ainsi hors du bundle initial.
     *
     * `useExisting` et non `useClass` : les quatre contrats sont servis par une
     * seule et même instance simulée, faute de quoi valider une candidature ne
     * changerait rien au statut affiché dans la table. Les contrats, eux,
     * restent bien distincts — c'est le serveur qui est unique.
     */
    providers: [
      MockAdminBackend,
      { provide: SystemOverviewRepository, useExisting: MockAdminBackend },
      { provide: AccountDirectoryRepository, useExisting: MockAdminBackend },
      { provide: AccountModerationRepository, useExisting: MockAdminBackend },
      { provide: MechanicApprovalRepository, useExisting: MockAdminBackend },
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
