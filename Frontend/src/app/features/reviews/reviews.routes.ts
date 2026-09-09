import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

import { ReviewSubmissionRepository, ReviewTargetRepository } from './data/review.repository';
import {
  HttpReviewSubmissionRepository,
  HttpReviewTargetRepository,
} from './data/review.repository.http';

/**
 * Routes du domaine « Avis » : notation d'un mécanicien après intervention.
 *
 * Dépôts branchés sur `/api/mechanics/{id}` (fiche du mécanicien à noter) et
 * `POST /api/mechanics/{id}/reviews` (envoi). Déposer un avis suppose d'être
 * connecté — d'où `authGuard`.
 */
export const reviewsRoutes: Routes = [
  {
    path: '',
    canMatch: [authGuard],
    providers: [
      { provide: ReviewTargetRepository, useClass: HttpReviewTargetRepository },
      { provide: ReviewSubmissionRepository, useClass: HttpReviewSubmissionRepository },
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
