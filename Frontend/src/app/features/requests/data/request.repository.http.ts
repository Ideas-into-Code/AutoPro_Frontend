import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { API_CONFIG, ImageUploadService, buildServiceUrl } from '@core';
import { CancellationReason, InterventionRequest } from '../models/request.model';
import { InterventionRequestDraft } from '../models/request-draft.model';
import {
  BackendServiceRequest,
  toCreatePayload,
  toInterventionRequest,
} from './request.mapper';
import { RequestRepository } from './request.repository';

/**
 * Demandes d'intervention contre le backend AutoPro (`/api/service-requests`).
 *
 * Les photos jointes sont d'abord téléversées (`POST /api/files/image`), puis
 * leurs URLs partent avec la demande en JSON.
 */
export class HttpRequestRepository extends RequestRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly images = inject(ImageUploadService);

  private url(path = ''): string {
    return buildServiceUrl(this.config, 'requests', path);
  }

  create(draft: InterventionRequestDraft): Observable<InterventionRequest> {
    return this.images.uploadAll(draft.photos).pipe(
      switchMap((photoUrls) =>
        this.http.post<BackendServiceRequest>(this.url(), {
          ...toCreatePayload(draft),
          ...(photoUrls.length > 0 ? { photoUrls } : {}),
        }),
      ),
      map(toInterventionRequest),
    );
  }

  list(): Observable<readonly InterventionRequest[]> {
    return this.http
      .get<BackendServiceRequest[]>(this.url())
      .pipe(map((rows) => rows.map(toInterventionRequest)));
  }

  findById(id: string): Observable<InterventionRequest> {
    return this.http
      .get<BackendServiceRequest>(this.url(id))
      .pipe(map(toInterventionRequest));
  }

  cancel(id: string, reason: CancellationReason): Observable<InterventionRequest> {
    return this.http
      .patch<BackendServiceRequest>(this.url(`${id}/status`), {
        status: 'CANCELLED',
        cancellationReason: reason,
      })
      .pipe(map(toInterventionRequest));
  }
}
