import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import { ReviewDraft, ReviewTarget } from '../models/review.model';
import { ReviewSubmissionRepository, ReviewTargetRepository } from './review.repository';

/**
 * Implémentations réelles, à fournir à la place des versions simulées lorsque
 * le microservice répondra — deux lignes à changer dans `reviews.routes.ts`,
 * et rien d'autre dans l'écran.
 */
export class HttpReviewTargetRepository extends ReviewTargetRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  pending(): Observable<ReviewTarget> {
    return this.http.get<ReviewTarget>(buildServiceUrl(this.config, 'reviews', 'pending/me'));
  }
}

export class HttpReviewSubmissionRepository extends ReviewSubmissionRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  /**
   * Envoi en `multipart/form-data` et non en JSON : les photos sont des
   * fichiers binaires. Aucun en-tête `Content-Type` n'est posé — le navigateur
   * doit le composer lui-même pour y placer la frontière du multipart, et
   * l'écrire à la main casse l'envoi.
   */
  submit(draft: ReviewDraft): Observable<void> {
    const corps = new FormData();

    corps.append('interventionId', draft.interventionId);
    corps.append('rating', String(draft.rating));
    corps.append('comment', draft.comment);
    draft.photos.forEach((photo) => corps.append('photos', photo, photo.name));

    return this.http.post<void>(buildServiceUrl(this.config, 'reviews', 'reviews'), corps);
  }
}
