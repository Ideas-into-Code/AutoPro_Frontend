import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { PositionProvider } from '@core';
import { InteractiveMapComponent, InteractiveMapMarker } from '@shared/ui';

import { MOCK_MAP_MECHANICS } from '../../data/mock-map-mechanics.data';
import { MapCoordinates, MapMechanic } from '../../models/map-mechanic.model';

export type FilterChip = 'near_me' | 'rating' | 'price' | 'diagnostic' | 'open_now';

type LocationStatus = 'idle' | 'loading' | 'ready' | 'failed';

const DAKAR_CENTER: MapCoordinates = {
  latitude: 14.6937,
  longitude: -17.4441,
};
const DAKAR_LOCATION_RADIUS_KM = 80;

@Component({
  selector: 'app-interactive-map-page',
  standalone: true,
  imports: [CommonModule, InteractiveMapComponent, RouterLink],
  templateUrl: './interactive-map-page.html',
  styleUrls: ['./interactive-map-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractiveMapPage implements OnInit {
  private readonly positions = inject(PositionProvider);

  protected readonly allMechanics = signal<readonly MapMechanic[]>(MOCK_MAP_MECHANICS);

  protected readonly searchQuery = signal('');
  protected readonly activeFilter = signal<FilterChip | null>('near_me');
  protected readonly userLocation = signal<MapCoordinates | null>(DAKAR_CENTER);
  protected readonly locationStatus = signal<LocationStatus>('idle');

  protected readonly isBottomSheetOpen = signal(false);
  protected readonly selectedMechanicId = signal<string | null>(null);

  protected readonly filterChips: ReadonlyArray<{ id: FilterChip; label: string; icon: string }> = [
    { id: 'near_me',    label: 'Près de moi',  icon: 'near_me' },
    { id: 'rating',     label: 'Note 4.8+',    icon: 'star' },
    { id: 'price',      label: 'Prix modéré',  icon: 'payments' },
    { id: 'diagnostic', label: 'Diagnostic',   icon: 'build' },
    { id: 'open_now',   label: 'Disponible',   icon: 'schedule' },
  ];

  protected readonly filteredMechanics = computed(() => {
    let list = [...this.allMechanics()];

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(query) ||
          m.workshopName.toLowerCase().includes(query) ||
          m.specialties.some((s) => s.toLowerCase().includes(query)) ||
          m.address.toLowerCase().includes(query),
      );
    }

    const filter = this.activeFilter();
    switch (filter) {
      case 'near_me':
        list.sort((a, b) => a.distanceKm - b.distanceKm);
        break;
      case 'rating':
        list = list.filter((m) => m.rating >= 4.8);
        break;
      case 'price':
        list = list.filter((m) => m.priceLevel <= 2);
        break;
      case 'diagnostic':
        list = list.filter((m) =>
          m.specialties.some((specialty) => specialty.toLowerCase().includes('diagnostic')),
        );
        break;
      case 'open_now':
        list = list.filter((m) => m.isAvailable);
        break;
      default:
        break;
    }

    return list;
  });

  protected readonly selectedMechanic = computed(() => {
    const selectedId = this.selectedMechanicId();
    return this.allMechanics().find((mechanic) => mechanic.id === selectedId) ?? null;
  });

  protected readonly mapMarkers = computed<readonly InteractiveMapMarker[]>(() =>
    this.filteredMechanics().map((mechanic) => ({
      id: mechanic.id,
	      title: mechanic.workshopName || mechanic.fullName,
	      subtitle: mechanic.specialties[0],
	      ratingLabel: `${mechanic.rating.toFixed(1)} etoiles`,
	      href: `/mecaniciens/${mechanic.profileId}`,
	      coordinates: mechanic.location,
	    })),
	  );

  ngOnInit(): void {
    this.refreshLocation();
  }

  toggleFilter(filter: FilterChip): void {
    if (this.activeFilter() === filter) {
      this.activeFilter.set(null);
    } else {
      this.activeFilter.set(filter);
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  refreshLocation(): void {
    this.locationStatus.set('loading');

    this.positions
      .current()
      .pipe(take(1))
      .subscribe({
        next: (position) => {
          const location = {
            latitude: position.latitude,
            longitude: position.longitude,
          };

          if (distanceBetweenKm(location, DAKAR_CENTER) > DAKAR_LOCATION_RADIUS_KM) {
            this.userLocation.set(DAKAR_CENTER);
            this.locationStatus.set('failed');
            return;
          }

          this.userLocation.set(location);
          this.locationStatus.set('ready');
        },
        error: () => {
          this.userLocation.set(DAKAR_CENTER);
          this.locationStatus.set('failed');
        },
      });
  }

  toggleBottomSheet(): void {
    this.isBottomSheetOpen.update((val) => !val);
  }

  onMarkerSelect(marker: InteractiveMapMarker): void {
    const mechanic = this.allMechanics().find((item) => item.id === marker.id);
    if (mechanic) {
      this.onMechanicSelect(mechanic);
    }
  }

  onMechanicSelect(mechanic: MapMechanic): void {
    this.selectedMechanicId.set(mechanic.id);
    this.isBottomSheetOpen.set(true);
  }
}

function distanceBetweenKm(from: MapCoordinates, to: MapCoordinates): number {
  const earthRadiusKm = 6371;
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
