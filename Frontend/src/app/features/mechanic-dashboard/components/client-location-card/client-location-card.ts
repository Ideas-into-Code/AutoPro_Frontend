import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MechanicTrackingService, RoutingService, haversineKm } from '@core';
import { InteractiveMapComponent, InteractiveMapMarker, MapCoordinates } from '@shared/ui';

/**
 * Carte d'orientation du mécanicien vers le client.
 *
 *   <app-client-location-card
 *     [clientLocation]="lieuClient()"
 *     [clientName]="d.clientName"
 *     [address]="d.address"
 *   />
 *
 * Montre le lieu de l'intervention (repère), la position de l'appareil du
 * mécanicien (`watchOwnPosition`) et le trajet entre les deux, dessiné
 * directement sur la carte : le mécanicien n'a qu'à suivre le tracé, sans
 * quitter l'application. Strictement navigateur : aucun relevé GPS pendant le
 * rendu serveur.
 */
@Component({
  selector: 'app-client-location-card',
  imports: [InteractiveMapComponent],
  templateUrl: './client-location-card.html',
  styleUrl: './client-location-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientLocationCard implements OnInit {
  private readonly tracking = inject(MechanicTrackingService);
  private readonly routing = inject(RoutingService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** Lieu de l'intervention (là où le client attend). */
  readonly clientLocation = input.required<MapCoordinates | null>();
  readonly clientName = input<string | undefined>(undefined);
  readonly address = input<string | undefined>(undefined);

  protected readonly maPosition = signal<MapCoordinates | null>(null);

  /** Tracé routier réel, quand le service d'itinéraire est joignable. */
  private readonly roadPath = signal<readonly MapCoordinates[] | null>(null);
  private readonly roadDistanceKm = signal<number | null>(null);
  private readonly roadDurationMin = signal<number | null>(null);

  /** Dernière position depuis laquelle un itinéraire routier a été demandé. */
  private lastRoutedFrom: MapCoordinates | null = null;

  protected readonly markers = computed<readonly InteractiveMapMarker[]>(() => {
    const client = this.clientLocation();
    if (!client) {
      return [];
    }
    return [
      {
        id: 'client',
        title: this.clientName() ?? 'Client',
        subtitle: this.address() || 'Lieu de l’intervention',
        coordinates: client,
      },
    ];
  });

  /**
   * Trajet à dessiner : le tracé routier s'il a pu être calculé, sinon une
   * ligne directe entre le mécanicien et le client.
   */
  protected readonly routePath = computed<readonly MapCoordinates[] | null>(() => {
    const road = this.roadPath();
    if (road && road.length >= 2) {
      return road;
    }
    const moi = this.maPosition();
    const client = this.clientLocation();
    return moi && client ? [moi, client] : null;
  });

  protected readonly distanceKm = computed(() => {
    const routier = this.roadDistanceKm();
    if (routier !== null) {
      return routier;
    }
    const moi = this.maPosition();
    const client = this.clientLocation();
    if (!moi || !client) {
      return null;
    }
    return Math.round(haversineKm(moi, client) * 10) / 10;
  });

  protected readonly dureeMin = computed(() => this.roadDurationMin());

  constructor() {
    // Recalcule l'itinéraire routier quand le mécanicien s'est notablement
    // déplacé (au moins 150 m), pour ne pas solliciter le service à chaque
    // relevé GPS.
    effect(() => {
      const moi = this.maPosition();
      const client = this.clientLocation();
      if (!moi || !client) {
        return;
      }
      if (this.lastRoutedFrom && haversineKm(this.lastRoutedFrom, moi) < 0.15) {
        return;
      }
      this.lastRoutedFrom = moi;
      this.routing
        .road(moi, client)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((route) => {
          this.roadPath.set(route?.path ?? null);
          this.roadDistanceKm.set(route?.distanceKm ?? null);
          this.roadDurationMin.set(route?.durationMin ?? null);
        });
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.tracking
      .watchOwnPosition()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => this.maPosition.set(p));
  }
}
