import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, delay, of } from 'rxjs';

import { ReviewDraft, ReviewTarget } from '../models/review.model';
import { ReviewSubmissionRepository, ReviewTargetRepository } from './review.repository';

const INTERVENTION: ReviewTarget = {
  interventionId: 'int-2026-0412',
  mechanicId: 'mec-014',
  mechanicName: 'Modou Niang',
  mechanicSpecialty: 'Freinage et suspension',
  serviceLabel: 'Remplacement des plaquettes de frein',
  completedAt: '2026-09-01T16:20:00',
};

/**
 * Latence artificielle, dans le navigateur seulement.
 * L'appliquer au rendu serveur figerait la page prérendue sur son état de
 * chargement — même règle que les autres dépôts simulés du projet.
 */
function simuler<T>(valeur: T, platformId: object, ms = 400): Observable<T> {
  const reponse = of(valeur);

  return isPlatformBrowser(platformId) ? reponse.pipe(delay(ms)) : reponse;
}

export class MockReviewTargetRepository extends ReviewTargetRepository {
  private readonly platformId = inject(PLATFORM_ID);

  pending(): Observable<ReviewTarget> {
    return simuler(INTERVENTION, this.platformId);
  }
}

export class MockReviewSubmissionRepository extends ReviewSubmissionRepository {
  private readonly platformId = inject(PLATFORM_ID);

  submit(_draft: ReviewDraft): Observable<void> {
    // 900 ms : l'envoi transporte des photos, un aller-retour instantané
    // masquerait l'état de chargement au lieu de l'éprouver.
    return simuler(undefined, this.platformId, 900);
  }
}
