import { Routes } from '@angular/router';

import { ReviewSubmissionRepository, ReviewTargetRepository } from './data/review.repository';
import {
  MockReviewSubmissionRepository,
  MockReviewTargetRepository,
} from './data/review.repository.mock';

/**
 * Routes du domaine « Avis » : notation et commentaires post-intervention.
 */
export const reviewsRoutes: Routes = [
  {
    path: '',

    /**
     * POINT DE BASCULE DU DOMAINE « AVIS ».
     *
     * Le jour où le microservice répond, ces deux lignes deviennent leurs
     * équivalents `Http…`, déjà écrits dans `data/review.repository.http.ts` :
     *
     *   { provide: ReviewTargetRepository, useClass: HttpReviewTargetRepository },
     *   { provide: ReviewSubmissionRepository, useClass: HttpReviewSubmissionRepository },
     *
     * Aucun composant ne bouge.
     */
    providers: [
      { provide: ReviewTargetRepository, useClass: MockReviewTargetRepository },
      { provide: ReviewSubmissionRepository, useClass: MockReviewSubmissionRepository },
    ],

    children: [
      {
        path: 'nouveau',
        loadComponent: () =>
          import('./pages/review-form/review-form').then((m) => m.ReviewFormPage),
        title: 'Donner mon avis — AutoPro',
      },

      /**
       * La liste des avis reçus n'a pas encore de ticket. Déclarée malgré tout :
       * sans elle, `/avis` tomberait sur la route joker, c'est-à-dire une 404,
       * alors que l'adresse figure dans la navigation.
       */
      {
        path: '',
        loadComponent: () =>
          import('@shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
        data: { fonctionnalite: 'La liste de vos avis' },
      },
    ],
  },
];
