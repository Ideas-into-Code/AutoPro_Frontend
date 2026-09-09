import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import { AuthService } from '@core/services/auth.service';
import { NearbyMechanic, RecentRequest } from '../models/home-cards.model';
import { HomeHighlightsRepository } from './home-highlights.repository';

/** Centre de Dakar — point de référence par défaut de l'accueil (pas de prompt GPS). */
const DAKAR = { latitude: 14.6937, longitude: -17.4441 };
const MAX_MECHANICS = 6;
const MAX_REQUESTS = 3;

interface BackendMechanic {
  id: number;
  fullName: string | null;
  firstName: string;
  lastName: string;
  specialization: string | null;
  averageRating: number | string | null;
  distanceKm: number | null;
}

interface BackendRequest {
  id: number;
  problemType: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

const PROBLEM_LABELS: Record<string, string> = {
  BATTERY: 'Batterie / démarrage',
  TIRE: 'Pneumatique',
  ENGINE: 'Panne moteur',
  BRAKES: 'Freinage',
  TOWING: 'Remorquage',
  OTHER: 'Autre problème',
};

const STATUS_LABELS: Record<BackendRequest['status'], { label: string; status: 'pending' | 'done'; color: 'primary' | 'warning' }> = {
  PENDING: { label: 'En attente', status: 'pending', color: 'primary' },
  ACCEPTED: { label: 'Acceptée', status: 'pending', color: 'primary' },
  IN_PROGRESS: { label: 'En cours', status: 'pending', color: 'primary' },
  COMPLETED: { label: 'Terminée', status: 'done', color: 'warning' },
  CANCELLED: { label: 'Annulée', status: 'done', color: 'warning' },
};

function splitSpecialties(s: string | null): string[] {
  if (!s) {
    return [];
  }
  return s
    .split(/\s*(?:,|;|\/|\bet\b|\+)\s*/i)
    .map((x) => x.trim())
    .filter(Boolean);
}

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

export class HttpHomeHighlightsRepository extends HomeHighlightsRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly auth = inject(AuthService);

  nearbyMechanics(): Observable<readonly NearbyMechanic[]> {
    const params = new HttpParams()
      .set('latitude', DAKAR.latitude)
      .set('longitude', DAKAR.longitude)
      .set('radiusKm', 50)
      .set('onlyAvailable', true);

    return this.http
      .get<BackendMechanic[]>(buildServiceUrl(this.config, 'mechanics', 'nearby'), { params })
      .pipe(
        map((rows) =>
          rows.slice(0, MAX_MECHANICS).map<NearbyMechanic>((m) => ({
            id: String(m.id),
            name: m.fullName || `${m.firstName} ${m.lastName}`.trim(),
            district: '',
            distance:
              m.distanceKm != null ? `${(Math.round(m.distanceKm * 10) / 10).toString()} km` : '',
            rating: Number(m.averageRating ?? 0),
            tags: splitSpecialties(m.specialization),
          })),
        ),
        catchError(() => of([])),
      );
  }

  recentRequests(): Observable<readonly RecentRequest[]> {
    // Ne pas appeler l'API sans être connecté : le 401 qui en résulterait
    // déclencherait la redirection vers la connexion (auth.interceptor), alors
    // que l'accueil est public.
    if (!this.auth.token()) {
      return of([]);
    }
    return this.http
      .get<BackendRequest[]>(buildServiceUrl(this.config, 'requests', ''))
      .pipe(
        map((rows) =>
          [...rows]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, MAX_REQUESTS)
            .map<RecentRequest>((r) => {
              const s = STATUS_LABELS[r.status];
              return {
                id: String(r.id),
                label: PROBLEM_LABELS[r.problemType] ?? 'Demande',
                date: DATE_FMT.format(new Date(r.createdAt)),
                icon: 'build',
                color: s.color,
                status: s.status,
                statusLabel: s.label,
              };
            }),
        ),
        // 401 quand l'utilisateur n'est pas connecté : l'accueil reste public.
        catchError(() => of([])),
      );
  }
}
