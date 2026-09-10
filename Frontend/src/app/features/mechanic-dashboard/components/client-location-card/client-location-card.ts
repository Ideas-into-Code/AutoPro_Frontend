import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MechanicTrackingService, haversineKm } from '@core';
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
 * mécanicien (`watchOwnPosition`) et un lien vers l'itinéraire dans une appli de
 * navigation. Strictement navigateur : aucun relevé GPS pendant le rendu serveur.
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** Lieu de l'intervention (là où le client attend). */
  readonly clientLocation = input.required<MapCoordinates | null>();
  readonly clientName = input<string | undefined>(undefined);
  readonly address = input<string | undefined>(undefined);

  protected readonly maPosition = signal<MapCoordinates | null>(null);

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

  protected readonly distanceKm = computed(() => {
    const moi = this.maPosition();
    const client = this.clientLocation();
    if (!moi || !client) {
      return null;
    }
    return Math.round(haversineKm(moi, client) * 10) / 10;
  });

  /** Itinéraire ouvert dans l'appli de cartes de l'appareil (Google Maps / OSM). */
  protected readonly itineraireUrl = computed(() => {
    const client = this.clientLocation();
    if (!client) {
      return null;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${client.latitude},${client.longitude}&travelmode=driving`;
  });

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
