import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '../config/api.config';
import { LiveLocation } from '../models/live-location.model';
import { RealtimeSocketService } from './realtime-socket.service';

/** Trame reçue sur `/topic/tracking/{mechanicId}`. */
interface BackendLocationUpdate {
  mechanicId: number;
  latitude: number;
  longitude: number;
  heading: number | null;
  timestamp: string;
}

interface BackendMechanic {
  latitude: number | null;
  longitude: number | null;
}

/** Poignée pour arrêter une diffusion de position en cours. */
export interface BroadcastHandle {
  stop(): void;
}

/**
 * Suivi de position d'un mécanicien pendant une intervention.
 *
 * Deux usages, deux personas :
 * - le **client** écoute la position du mécanicien qui vient vers lui
 *   (`watch`), en partant de la dernière position connue (`lastKnownPosition`) ;
 * - le **mécanicien** diffuse la sienne tant qu'il est en route
 *   (`startBroadcasting`).
 *
 * Dans `core` : deux features distinctes en dépendent (« demandes » côté client,
 * « espace mécanicien » côté pro), et une feature n'en importe jamais une autre.
 * Strictement navigateur — le rendu serveur n'ouvre ni WebSocket ni GPS.
 */
@Injectable({ providedIn: 'root' })
export class MechanicTrackingService {
  private readonly socket = inject(RealtimeSocketService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);

  /** Flux temps réel de la position d'un mécanicien. */
  watch(mechanicId: string): Observable<LiveLocation> {
    return this.socket.watch<BackendLocationUpdate>(`/topic/tracking/${mechanicId}`).pipe(
      map((u) => ({
        mechanicId: String(u.mechanicId),
        latitude: u.latitude,
        longitude: u.longitude,
        heading: u.heading ?? null,
        at: u.timestamp,
      })),
    );
  }

  /**
   * Dernière position enregistrée du mécanicien (`GET /api/mechanics/{id}`),
   * pour placer un premier repère avant l'arrivée du flux temps réel.
   */
  lastKnownPosition(mechanicId: string): Observable<{ latitude: number; longitude: number } | null> {
    return this.http
      .get<BackendMechanic>(buildServiceUrl(this.config, 'mechanics', mechanicId))
      .pipe(
        map((m) =>
          m.latitude != null && m.longitude != null
            ? { latitude: m.latitude, longitude: m.longitude }
            : null,
        ),
        catchError(() => of(null)),
      );
  }

  /**
   * Démarre la diffusion de la position de l'appareil sur `/app/tracking.update`.
   * À appeler par le mécanicien tant qu'il est en route vers un client.
   * Renvoie une poignée pour l'arrêter (à faire quand l'intervention se termine
   * ou que l'écran est quitté).
   */
  startBroadcasting(): BroadcastHandle {
    if (!isPlatformBrowser(this.platformId) || !('geolocation' in navigator)) {
      return { stop: () => undefined };
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.socket.publish('/app/tracking.update', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: Number.isFinite(pos.coords.heading) ? pos.coords.heading : null,
        });
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return {
      stop: () => navigator.geolocation.clearWatch(watchId),
    };
  }
}

/** Distance à vol d'oiseau entre deux points, en kilomètres. */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
