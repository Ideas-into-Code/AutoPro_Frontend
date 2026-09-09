import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

import { API_CONFIG, buildServiceUrl } from '../config/api.config';
import { AuthService } from './auth.service';
import { BroadcastHandle, MechanicTrackingService } from './mechanic-tracking.service';

interface BackendServiceRequest {
  status: string;
  mechanicId: number | null;
}

/** Statuts pour lesquels le mécanicien est « en route » vers un client. */
const EN_ROUTE_STATUSES = new Set(['ACCEPTED', 'IN_PROGRESS']);

/** Fréquence de vérification d'une intervention active, en ms. */
const POLL_MS = 15_000;

/**
 * Présence du mécanicien.
 *
 * Tant qu'une intervention **acceptée ou en cours** lui est attribuée, sa
 * position est diffusée en continu (`/app/tracking.update`) — quel que soit
 * l'écran de l'espace mécanicien où il se trouve. C'est ce qui permet au client
 * de « voir le mécanicien venir » sur sa carte de suivi, sans que le mécanicien
 * ait à rester sur une page précise.
 *
 * Activé par la coquille mécanicien (`start`), strictement navigateur.
 */
@Injectable({ providedIn: 'root' })
export class MechanicPresenceService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly auth = inject(AuthService);
  private readonly tracking = inject(MechanicTrackingService);
  private readonly platformId = inject(PLATFORM_ID);

  /** `true` quand une intervention active fait diffuser la position. */
  readonly enRoute = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private broadcast: BroadcastHandle | null = null;

  start(): void {
    if (!isPlatformBrowser(this.platformId) || this.timer !== null) {
      return;
    }
    if (this.auth.userRole() !== 'mecanicien') {
      return;
    }
    this.check();
    this.timer = setInterval(() => this.check(), POLL_MS);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.stopBroadcast();
  }

  private check(): void {
    const mechanicId = this.auth.currentUser()?.mechanicId;
    if (!mechanicId) {
      return;
    }
    this.http
      .get<BackendServiceRequest[]>(buildServiceUrl(this.config, 'requests', ''))
      .subscribe({
        next: (rows) => {
          const active = rows.some(
            (r) => EN_ROUTE_STATUSES.has(r.status) && String(r.mechanicId) === mechanicId,
          );
          if (active) {
            this.startBroadcast();
          } else {
            this.stopBroadcast();
          }
        },
        error: () => undefined,
      });
  }

  private startBroadcast(): void {
    if (this.broadcast) {
      return;
    }
    this.broadcast = this.tracking.startBroadcasting();
    this.enRoute.set(true);
  }

  private stopBroadcast(): void {
    this.broadcast?.stop();
    this.broadcast = null;
    this.enRoute.set(false);
  }
}
