import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import {
  AccountStatus,
  ApprovalDecision,
  ManagedAccount,
  PendingMechanic,
  SystemMetric,
} from '../models/admin-dashboard.model';
import {
  AccountDirectoryRepository,
  AccountModerationRepository,
  MechanicApprovalRepository,
  SystemOverviewRepository,
} from './admin-dashboard.repository';

/**
 * Implémentations réelles, à fournir à la place des versions simulées lorsque
 * les microservices répondront — quatre lignes à changer dans `admin.routes.ts`,
 * et rien d'autre dans l'écran.
 *
 * Les adresses suivent le découpage du **backend** et non celui de la page :
 * les indicateurs relèvent d'`admin`, les comptes d'`auth`, les candidatures de
 * `mechanics`. C'est bien pourquoi l'écran ne les connaît pas.
 */
export class HttpSystemOverviewRepository extends SystemOverviewRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  metrics(): Observable<readonly SystemMetric[]> {
    return this.http.get<readonly SystemMetric[]>(
      buildServiceUrl(this.config, 'admin', 'metrics/overview'),
    );
  }
}

export class HttpAccountDirectoryRepository extends AccountDirectoryRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  accounts(): Observable<readonly ManagedAccount[]> {
    return this.http.get<readonly ManagedAccount[]>(
      buildServiceUrl(this.config, 'auth', 'admin/accounts'),
    );
  }
}

export class HttpAccountModerationRepository extends AccountModerationRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  setStatus(accountId: string, status: AccountStatus): Observable<ManagedAccount> {
    return this.http.patch<ManagedAccount>(
      buildServiceUrl(this.config, 'auth', `admin/accounts/${accountId}/status`),
      { status },
    );
  }
}

export class HttpMechanicApprovalRepository extends MechanicApprovalRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  pending(): Observable<readonly PendingMechanic[]> {
    return this.http.get<readonly PendingMechanic[]>(this.url('applications/pending'));
  }

  decide(mechanicId: string, decision: ApprovalDecision): Observable<void> {
    return this.http.post<void>(this.url(`applications/${mechanicId}/decision`), { decision });
  }

  private url(chemin: string): string {
    return buildServiceUrl(this.config, 'mechanics', chemin);
  }
}
