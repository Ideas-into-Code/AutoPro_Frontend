import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import { InterventionRequest } from '../models/request.model';
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
 * L'API est un monolithe : pas de microservice « requests » séparé. Les photos
 * ne sont pas encore envoyées ici (upload dédié à venir, cf. `FileUpload`) —
 * la création se fait en JSON.
 */
export class HttpRequestRepository extends RequestRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  private url(path = ''): string {
    return buildServiceUrl(this.config, 'requests', path);
  }

  create(draft: InterventionRequestDraft): Observable<InterventionRequest> {
    return this.http
      .post<BackendServiceRequest>(this.url(), toCreatePayload(draft))
      .pipe(map(toInterventionRequest));
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

  cancel(id: string): Observable<InterventionRequest> {
    return this.http
      .patch<BackendServiceRequest>(this.url(`${id}/status`), { status: 'CANCELLED' })
      .pipe(map(toInterventionRequest));
  }
}
