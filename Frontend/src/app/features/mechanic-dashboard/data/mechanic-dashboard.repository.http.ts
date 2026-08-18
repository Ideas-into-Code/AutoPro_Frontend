import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import {
  Availability,
  EarningsSummary,
  NewRequest,
  RequestDecision,
} from '../models/mechanic-dashboard.model';
import {
  MechanicAvailabilityRepository,
  MechanicDashboardRepository,
  RequestDecisionRepository,
} from './mechanic-dashboard.repository';

/**
 * Implémentations réelles, à fournir en lieu et place des versions simulées
 * lorsque les microservices répondront — trois lignes à changer dans
 * `mechanic-dashboard.routes.ts`, et rien d'autre.
 *
 * Les gains relèvent du service « pricing », la disponibilité du service
 * « mechanics », les décisions du service « requests » : le découpage suit
 * celui du backend, et non celui de l'écran.
 */
export class HttpMechanicDashboardRepository extends MechanicDashboardRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  earnings(): Observable<EarningsSummary> {
    return this.http.get<EarningsSummary>(buildServiceUrl(this.config, 'pricing', 'earnings/me'));
  }

  incomingRequest(): Observable<NewRequest | null> {
    return this.http.get<NewRequest | null>(
      buildServiceUrl(this.config, 'requests', 'interventions/incoming'),
    );
  }
}

export class HttpMechanicAvailabilityRepository extends MechanicAvailabilityRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  current(): Observable<Availability> {
    return this.http.get<Availability>(this.url());
  }

  update(isOnline: boolean): Observable<Availability> {
    return this.http.put<Availability>(this.url(), { isOnline });
  }

  private url(): string {
    return buildServiceUrl(this.config, 'mechanics', 'me/availability');
  }
}

export class HttpRequestDecisionRepository extends RequestDecisionRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  decide(requestId: string, decision: RequestDecision): Observable<void> {
    return this.http.post<void>(
      buildServiceUrl(this.config, 'requests', `interventions/${requestId}/decision`),
      { decision },
    );
  }
}
