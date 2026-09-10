import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

interface LatLng {
  readonly latitude: number;
  readonly longitude: number;
}

/** Tracé routier calculé entre deux points. */
export interface RoadRoute {
  /** Points du tracé, dans l'ordre (départ → arrivée). */
  readonly path: readonly LatLng[];
  /** Distance de conduite en kilomètres. */
  readonly distanceKm: number;
  /** Durée estimée en minutes. */
  readonly durationMin: number;
}

interface OsrmResponse {
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }[];
}

/**
 * Calcul d'itinéraire routier, pour dessiner le trajet directement sur la carte
 * de l'application (aucune redirection vers une appli de navigation externe).
 *
 * S'appuie sur le service public OSRM. Quand il est injoignable (hors ligne,
 * rendu serveur), la méthode renvoie `null` et l'appelant retombe sur une ligne
 * directe entre les deux points.
 */
@Injectable({ providedIn: 'root' })
export class RoutingService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  road(from: LatLng, to: LatLng): Observable<RoadRoute | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    return this.http.get<OsrmResponse>(url).pipe(
      map((res): RoadRoute | null => {
        const route = res.routes?.[0];
        if (!route || !route.geometry?.coordinates?.length) {
          return null;
        }
        return {
          path: route.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
          distanceKm: Math.round((route.distance / 1000) * 10) / 10,
          durationMin: Math.max(1, Math.round(route.duration / 60)),
        };
      }),
      catchError(() => of(null)),
    );
  }
}
