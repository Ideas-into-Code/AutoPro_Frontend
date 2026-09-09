import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import { ReviewDraft, ReviewTarget } from '../models/review.model';
import { ReviewSubmissionRepository, ReviewTargetRepository } from './review.repository';

interface BackendMechanic {
  id: number;
  fullName: string | null;
  firstName: string;
  lastName: string;
  specialization: string | null;
}

export class HttpReviewTargetRepository extends ReviewTargetRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  forMechanic(mechanicId: string): Observable<ReviewTarget> {
    return this.http
      .get<BackendMechanic>(buildServiceUrl(this.config, 'mechanics', mechanicId))
      .pipe(
        map((m) => ({
          mechanicId: String(m.id),
          mechanicName: m.fullName || `${m.firstName} ${m.lastName}`.trim(),
          mechanicSpecialty: m.specialization ?? '',
        })),
      );
  }
}

export class HttpReviewSubmissionRepository extends ReviewSubmissionRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  submit(draft: ReviewDraft): Observable<void> {
    return this.http
      .post<unknown>(
        buildServiceUrl(this.config, 'mechanics', `${draft.mechanicId}/reviews`),
        { rating: draft.rating, comment: draft.comment || null },
      )
      .pipe(map(() => undefined));
  }
}
