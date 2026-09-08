import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import {
  AccountStatus,
  ApprovalDecision,
  ManagedAccount,
  PendingMechanic,
  SystemMetric,
} from '../models/admin-dashboard.model';
import {
  AdminStatsDTO,
  MechanicDetailDTO,
  UserDetailDTO,
  toManagedAccount,
  toManagedAccounts,
  toMetrics,
  toPendingMechanic,
} from './admin.mapper';
import {
  AccountDirectoryRepository,
  AccountModerationRepository,
  MechanicApprovalRepository,
  SystemOverviewRepository,
} from './admin-dashboard.repository';

/**
 * Implémentations réelles du back-office, branchées sur `/api/admin/**`.
 *
 * Le backend est un monolithe : les trois blocs de l'écran tapent tous le même
 * préfixe `admin`, mais restent servis par des contrats distincts — un futur
 * écran en lecture seule n'héritera pas des méthodes de modération.
 */
export class HttpSystemOverviewRepository extends SystemOverviewRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  metrics(): Observable<readonly SystemMetric[]> {
    return this.http
      .get<AdminStatsDTO>(buildServiceUrl(this.config, 'admin', 'stats'))
      .pipe(map(toMetrics));
  }
}

export class HttpAccountDirectoryRepository extends AccountDirectoryRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  accounts(): Observable<readonly ManagedAccount[]> {
    // Deux vues : le statut d'un mécanicien tient à son compte ET à la
    // validation de son dossier.
    return forkJoin({
      users: this.http.get<UserDetailDTO[]>(buildServiceUrl(this.config, 'admin', 'users')),
      mechanics: this.http.get<MechanicDetailDTO[]>(
        buildServiceUrl(this.config, 'admin', 'mechanics'),
      ),
    }).pipe(map(({ users, mechanics }) => toManagedAccounts(users, mechanics)));
  }
}

export class HttpAccountModerationRepository extends AccountModerationRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  setStatus(accountId: string, status: AccountStatus): Observable<ManagedAccount> {
    // La table n'émet que « actif » ou « suspendu » ; `en_attente` se tranche
    // dans la file de validation.
    return this.http
      .patch<UserDetailDTO>(buildServiceUrl(this.config, 'admin', `users/${accountId}/status`), {
        active: status === 'actif',
      })
      .pipe(map(toManagedAccount));
  }
}

export class HttpMechanicApprovalRepository extends MechanicApprovalRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  pending(): Observable<readonly PendingMechanic[]> {
    return this.http
      .get<MechanicDetailDTO[]>(buildServiceUrl(this.config, 'admin', 'mechanics/pending'))
      .pipe(map((liste) => liste.map(toPendingMechanic)));
  }

  decide(mechanicId: string, decision: ApprovalDecision): Observable<void> {
    return this.http
      .patch<MechanicDetailDTO>(
        buildServiceUrl(this.config, 'admin', `mechanics/${mechanicId}/validate`),
        { approved: decision === 'validee' },
      )
      .pipe(map(() => void 0));
  }
}
