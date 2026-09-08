import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import { AuthService } from '@core/services/auth.service';
import {
  Availability,
  EarningsPoint,
  EarningsSummary,
  NewRequest,
  RequestDecision,
} from '../models/mechanic-dashboard.model';
import {
  MechanicAvailabilityRepository,
  MechanicDashboardRepository,
  RequestDecisionRepository,
} from './mechanic-dashboard.repository';

interface BackendEarnings {
  mechanicId: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  completedInterventions: number;
  dailyBreakdown: { date: string; amount: number }[];
}

interface BackendMechanic {
  id: number;
  isAvailable: boolean;
}

interface BackendServiceRequest {
  id: number;
  clientName: string;
  vehicleLabel: string | null;
  problemType: string;
  status: string;
  mechanicId: number | null;
  price: number | null;
}

const PROBLEM_LABELS: Record<string, string> = {
  BATTERY: 'Batterie / démarrage',
  TIRE: 'Pneumatique',
  ENGINE: 'Panne moteur',
  BRAKES: 'Freinage',
  TOWING: 'Remorquage',
  OTHER: 'Autre problème',
};

const JOURS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

function toEarnings(b: BackendEarnings): EarningsSummary {
  const points: EarningsPoint[] = (b.dailyBreakdown ?? []).map((d) => ({
    label: JOURS[new Date(d.date).getDay()],
    amountXOF: Number(d.amount ?? 0),
  }));
  // Tendance : dernier jour comparé à la moyenne des jours précédents.
  const last = points.at(-1)?.amountXOF ?? 0;
  const previous = points.slice(0, -1);
  const avgPrev =
    previous.length > 0 ? previous.reduce((s, p) => s + p.amountXOF, 0) / previous.length : 0;
  const trendPercent = avgPrev > 0 ? Math.round(((last - avgPrev) / avgPrev) * 100) : 0;

  return { todayXOF: Number(b.dailyEarnings ?? 0), trendPercent, points };
}

export class HttpMechanicDashboardRepository extends MechanicDashboardRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly auth = inject(AuthService);

  earnings(): Observable<EarningsSummary> {
    const mechanicId = this.auth.currentUser()?.mechanicId;
    if (!mechanicId) {
      return of<EarningsSummary>({ todayXOF: 0, trendPercent: 0, points: [] });
    }
    // Endpoint : `/api/mechanic/earnings/{id}` — pas un « service » nommé.
    return this.http
      .get<BackendEarnings>(`${this.config.gateway}/mechanic/earnings/${mechanicId}`)
      .pipe(map(toEarnings));
  }

  incomingRequest(): Observable<NewRequest | null> {
    return this.http.get<BackendServiceRequest[]>(buildServiceUrl(this.config, 'requests', '')).pipe(
      map((rows) => {
        const pending = rows.find((r) => r.status === 'PENDING' && r.mechanicId == null);
        if (!pending) {
          return null;
        }
        return {
          id: String(pending.id),
          clientName: pending.clientName,
          vehicle: pending.vehicleLabel ?? 'Véhicule non précisé',
          problemLabel: PROBLEM_LABELS[pending.problemType] ?? 'Autre problème',
          distanceLabel: '',
          estimatedPayoutXOF: Number(pending.price ?? 0),
        } satisfies NewRequest;
      }),
    );
  }
}

export class HttpMechanicAvailabilityRepository extends MechanicAvailabilityRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  private meUrl(path = ''): string {
    return buildServiceUrl(this.config, 'mechanics', path === '' ? 'me' : `me/${path}`);
  }

  current(): Observable<Availability> {
    return this.http.get<BackendMechanic>(this.meUrl()).pipe(map((m) => ({ isOnline: m.isAvailable })));
  }

  update(isOnline: boolean): Observable<Availability> {
    return this.http
      .patch<BackendMechanic>(this.meUrl('availability'), { available: isOnline })
      .pipe(map((m) => ({ isOnline: m.isAvailable })));
  }
}

export class HttpRequestDecisionRepository extends RequestDecisionRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  decide(requestId: string, decision: RequestDecision): Observable<void> {
    // Le backend n'a pas de « refus » : refuser une demande PENDING revient à
    // ne pas la prendre. On l'écarte donc seulement côté écran.
    if (decision === 'refusee') {
      return of(void 0);
    }
    return this.http
      .patch<unknown>(buildServiceUrl(this.config, 'requests', `${requestId}/status`), {
        status: 'ACCEPTED',
      })
      .pipe(map(() => void 0));
  }
}
