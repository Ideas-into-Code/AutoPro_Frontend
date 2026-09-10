import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import { AuthService } from '@core/services/auth.service';
import { MechanicRequest } from '../models/mechanic-request.model';
import { BackendServiceRequest, toMechanicRequest } from './mechanic-request.mapper';

/**
 * Demandes d'intervention côté mécanicien, contre `/api/service-requests`.
 *
 * Le backend renvoie déjà, pour un compte `ROLE_MECHANIC`, les demandes en
 * attente + celles qui lui sont assignées. Les actions (accepter, démarrer,
 * fixer le prix, terminer, encaisser) sont les mêmes endpoints que ceux du
 * cycle de vie de la demande.
 */
export abstract class MechanicRequestRepository {
  abstract list(): Observable<readonly MechanicRequest[]>;
  abstract findById(id: string): Observable<MechanicRequest>;
  abstract accept(id: string): Observable<MechanicRequest>;
  abstract start(id: string): Observable<MechanicRequest>;
  abstract complete(id: string): Observable<MechanicRequest>;
  abstract setPrice(id: string, amountXOF: number): Observable<MechanicRequest>;
  abstract collectPayment(id: string, notes?: string): Observable<void>;
}

export class HttpMechanicRequestRepository extends MechanicRequestRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly auth = inject(AuthService);

  private url(path = ''): string {
    return buildServiceUrl(this.config, 'requests', path);
  }

  private get myId(): string | undefined {
    return this.auth.currentUser()?.mechanicId;
  }

  list(): Observable<readonly MechanicRequest[]> {
    return this.http
      .get<BackendServiceRequest[]>(this.url())
      .pipe(map((rows) => rows.map((r) => toMechanicRequest(r, this.myId))));
  }

  findById(id: string): Observable<MechanicRequest> {
    return this.http
      .get<BackendServiceRequest>(this.url(id))
      .pipe(map((r) => toMechanicRequest(r, this.myId)));
  }

  accept(id: string): Observable<MechanicRequest> {
    return this.patchStatus(id, 'ACCEPTED');
  }

  start(id: string): Observable<MechanicRequest> {
    return this.patchStatus(id, 'IN_PROGRESS');
  }

  complete(id: string): Observable<MechanicRequest> {
    return this.patchStatus(id, 'COMPLETED');
  }

  setPrice(id: string, amountXOF: number): Observable<MechanicRequest> {
    return this.http
      .patch<BackendServiceRequest>(this.url(`${id}/price`), { amount: amountXOF })
      .pipe(map((r) => toMechanicRequest(r, this.myId)));
  }

  collectPayment(id: string, notes?: string): Observable<void> {
    return this.http
      .post<unknown>(this.url(`${id}/payment/collect`), notes ? { notes } : {})
      .pipe(map(() => undefined));
  }

  private patchStatus(id: string, status: string): Observable<MechanicRequest> {
    return this.http
      .patch<BackendServiceRequest>(this.url(`${id}/status`), { status })
      .pipe(map((r) => toMechanicRequest(r, this.myId)));
  }
}
