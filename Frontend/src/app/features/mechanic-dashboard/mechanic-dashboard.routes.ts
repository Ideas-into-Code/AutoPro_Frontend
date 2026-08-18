import { Routes } from '@angular/router';

import {
  MechanicAvailabilityRepository,
  MechanicDashboardRepository,
  RequestDecisionRepository,
} from './data/mechanic-dashboard.repository';
import {
  MockMechanicAvailabilityRepository,
  MockMechanicDashboardRepository,
  MockRequestDecisionRepository,
} from './data/mechanic-dashboard.repository.mock';

/**
 * Routes de l'espace mécanicien.
 *
 * Cette feature ne correspond à aucun microservice, comme `home` : c'est un
 * écran d'agrégation qui réunit gains, disponibilité et demandes. L'exception
 * est la même, et la règle de dépendance reste intacte — aucune autre feature
 * n'est importée.
 */
export const mechanicDashboardRoutes: Routes = [
  {
    path: '',

    /**
     * POINT DE BASCULE DE L'ESPACE MÉCANICIEN.
     *
     * Le jour où les microservices répondent, ces trois lignes deviennent
     * leurs équivalents `Http…`, déjà écrits dans
     * `data/mechanic-dashboard.repository.http.ts`. Aucun composant ne bouge.
     *
     * Fournis sur la route et non globalement : seul ce domaine s'en sert, et
     * les données simulées restent ainsi hors du bundle initial.
     */
    providers: [
      { provide: MechanicDashboardRepository, useClass: MockMechanicDashboardRepository },
      { provide: MechanicAvailabilityRepository, useClass: MockMechanicAvailabilityRepository },
      { provide: RequestDecisionRepository, useClass: MockRequestDecisionRepository },
    ],

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/mechanic-dashboard/mechanic-dashboard').then(
            (m) => m.MechanicDashboardPage,
          ),
        title: 'Tableau de bord mécanicien — AutoPro',
      },
    ],
  },
];
