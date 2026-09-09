import { DatePipe, isPlatformBrowser } from '@angular/common';
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
 * Carte de suivi en temps réel du mécanicien en route vers le client.
 *
 *   <app-live-tracking-card
 *     [mechanicId]="d.mechanicId"
 *     [mechanicName]="d.mechanicName"
 *     [clientLocation]="lieuClient()"
 *   />
 *
 * Point de départ : la dernière position connue du mécanicien
 * (`GET /api/mechanics/{id}`). Puis chaque relevé qu'il diffuse
 * (`/topic/tracking/{id}`) déplace le repère. Strictement navigateur : aucune
 * souscription pendant le rendu serveur.
 */
@Component({
  selector: 'app-live-tracking-card',
  imports: [InteractiveMapComponent, DatePipe],
  templateUrl: './live-tracking-card.html',
  styleUrl: './live-tracking-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveTrackingCard implements OnInit {
  private readonly tracking = inject(MechanicTrackingService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly mechanicId = input.required<string>();
  readonly mechanicName = input<string | undefined>(undefined);

  /** Lieu de l'intervention (là où le client attend). */
  readonly clientLocation = input<MapCoordinates | null>(null);

  protected readonly position = signal<MapCoordinates | null>(null);
  protected readonly derniereMaj = signal<Date | null>(null);
  protected readonly enAttente = computed(() => this.position() === null);

  protected readonly distanceKm = computed(() => {
    const pos = this.position();
    const client = this.clientLocation();
    if (!pos || !client) {
      return null;
    }
    return Math.round(haversineKm(pos, client) * 10) / 10;
  });

  protected readonly markers = computed<readonly InteractiveMapMarker[]>(() => {
    const pos = this.position();
    if (!pos) {
      return [];
    }
    return [
      {
        id: 'mecano',
        title: this.mechanicName() ?? 'Votre mécanicien',
        subtitle: 'En route vers vous',
        coordinates: pos,
      },
    ];
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const id = this.mechanicId();

    // Premier repère : dernière position enregistrée.
    this.tracking
      .lastKnownPosition(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => {
        if (p && this.position() === null) {
          this.position.set(p);
        }
      });

    // Puis les relevés temps réel.
    this.tracking
      .watch(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loc) => {
        this.position.set({ latitude: loc.latitude, longitude: loc.longitude });
        this.derniereMaj.set(loc.at ? new Date(loc.at) : new Date());
      });
  }
}
