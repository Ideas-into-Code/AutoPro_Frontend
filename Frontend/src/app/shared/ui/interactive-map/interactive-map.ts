import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as Leaflet from 'leaflet';

import { Icon } from '../icon/icon';

export interface MapCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface InteractiveMapMarker {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly ratingLabel?: string;
  readonly href?: string;
  readonly coordinates: MapCoordinates;
}

interface FallbackMapPoint {
  readonly marker: InteractiveMapMarker;
  readonly x: number;
  readonly y: number;
}

interface FallbackUserPoint {
  readonly x: number;
  readonly y: number;
}

interface FallbackTile {
  readonly href: string;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const FALLBACK_TILE_ZOOM = 12;
const FALLBACK_TILE_MIN_X = 1847;
const FALLBACK_TILE_MAX_X = 1851;
const FALLBACK_TILE_MIN_Y = 1877;
const FALLBACK_TILE_MAX_Y = 1880;
const FALLBACK_TILE_COLUMNS = FALLBACK_TILE_MAX_X - FALLBACK_TILE_MIN_X + 1;
const FALLBACK_TILE_ROWS = FALLBACK_TILE_MAX_Y - FALLBACK_TILE_MIN_Y + 1;

const FALLBACK_BOUNDS = {
  north: 14.85985040060104,
  south: 14.519780046326074,
  west: -17.666015625,
  east: -17.2265625,
} as const;

const FALLBACK_TILES = buildFallbackTiles();

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  imports: [Icon],
  templateUrl: './interactive-map.html',
  styleUrls: ['./interactive-map.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractiveMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('mapContainer', { static: false })
  private mapContainerRef?: ElementRef<HTMLDivElement>;

  public readonly markers = input<readonly InteractiveMapMarker[]>([]);
  public readonly userLocation = input<MapCoordinates | null>({
    latitude: 14.6937,
    longitude: -17.4441,
  });
  public readonly selectedMarkerId = input<string | null>(null);
  public readonly mode = input<'view' | 'picker'>('view');

  /**
   * Tracé à dessiner sur la carte (itinéraire vers le client, par exemple).
   * Liste ordonnée de points ; `null` ou moins de deux points = aucun tracé.
   */
  public readonly routePath = input<readonly MapCoordinates[] | null>(null);

  public readonly markerSelect = output<InteractiveMapMarker>();
  public readonly locationSelect = output<MapCoordinates>();

  protected readonly hasLoadedTiles = signal(false);
  protected readonly hasTileError = signal(false);
  protected readonly fallbackTiles = FALLBACK_TILES;

  protected readonly fallbackMarkers = computed<readonly FallbackMapPoint[]>(() =>
    this.markers().map((marker) => ({
      marker,
      ...coordinatesToFallbackPoint(marker.coordinates),
    })),
  );

  protected readonly fallbackUserPoint = computed<FallbackUserPoint | null>(() => {
    const loc = this.userLocation();
    return loc ? coordinatesToFallbackPoint(loc) : null;
  });

  /** Tracé projeté sur le fond de carte de repli, sous forme `"x,y x,y …"`. */
  protected readonly fallbackRoutePoints = computed<string | null>(() => {
    const path = this.routePath();
    if (!path || path.length < 2) {
      return null;
    }
    return path
      .map((point) => {
        const { x, y } = coordinatesToFallbackPoint(point);
        return `${x},${y}`;
      })
      .join(' ');
  });

  private leaflet?: typeof Leaflet;
  private map?: Leaflet.Map;
  private markerLayer?: Leaflet.LayerGroup;
  private userMarker?: Leaflet.Marker;
  private routeLine?: Leaflet.Polyline;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.mapContainerRef) {
      return;
    }

    void this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['markers']) {
      this.updateMarkers();
    }
    if (changes['userLocation']) {
      this.updateUserMarker();
    }
    if (changes['selectedMarkerId']) {
      this.highlightSelectedMarker();
    }
    if (changes['routePath']) {
      this.updateRoute();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  public zoomIn(): void {
    this.map?.zoomIn();
  }

  public zoomOut(): void {
    this.map?.zoomOut();
  }

  public centerOnUser(): void {
    const loc = this.userLocation();
    if (loc && this.map) {
      this.map.flyTo([loc.latitude, loc.longitude], 14, { duration: 0.7 });
    }
  }

  private async initMap(): Promise<void> {
    const leaflet = await import('leaflet');
    this.leaflet = leaflet;

    const defaultCenter = this.userLocation() ?? { latitude: 14.6937, longitude: -17.4441 };
    const container = this.mapContainerRef?.nativeElement;
    if (!container) return;

    this.map = leaflet.map(container, {
      center: [defaultCenter.latitude, defaultCenter.longitude],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });

    const tiles = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      crossOrigin: true,
    });

    tiles.on('tileload', () => {
      this.hasLoadedTiles.set(true);
      this.hasTileError.set(false);
    });
    tiles.on('tileerror', () => this.hasTileError.set(true));
    tiles.addTo(this.map);

    this.markerLayer = leaflet.layerGroup().addTo(this.map);

    this.updateUserMarker();
    this.updateMarkers();
    this.updateRoute();
    this.fitToVisiblePoints();

    if (this.mode() === 'picker') {
      this.map.on('click', (event: Leaflet.LeafletMouseEvent) => {
        this.locationSelect.emit({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        });
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.map?.invalidateSize();
        this.fitToVisiblePoints();
      });
      this.resizeObserver.observe(container);
    }

    setTimeout(() => {
      this.map?.invalidateSize();
      this.fitToVisiblePoints();
    }, 0);
  }

  private updateUserMarker(): void {
    if (!this.map || !this.leaflet) return;

    const loc = this.userLocation();
    if (!loc) {
      this.userMarker?.remove();
      this.userMarker = undefined;
      return;
    }

    const icon = this.leaflet.divIcon({
      className: 'ap-leaflet-location',
      html: '<span class="ap-leaflet-location__dot"></span>',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!this.userMarker) {
      this.userMarker = this.leaflet
        .marker([loc.latitude, loc.longitude], { icon, interactive: false })
        .addTo(this.map);
    } else {
      this.userMarker.setLatLng([loc.latitude, loc.longitude]);
      this.userMarker.setIcon(icon);
    }
  }

  private updateRoute(): void {
    if (!this.map || !this.leaflet) return;

    const path = this.routePath();
    const points =
      path && path.length >= 2
        ? path.map((p) => this.leaflet!.latLng(p.latitude, p.longitude))
        : [];

    if (points.length < 2) {
      this.routeLine?.remove();
      this.routeLine = undefined;
      return;
    }

    if (!this.routeLine) {
      this.routeLine = this.leaflet.polyline(points, {
        color: '#1d4ed8',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round',
        lineCap: 'round',
      });
      this.routeLine.addTo(this.map);
    } else {
      this.routeLine.setLatLngs(points);
    }
  }

  private updateMarkers(): void {
    if (!this.leaflet || !this.markerLayer) return;

    this.markerLayer.clearLayers();

    this.markers().forEach((marker) => {
      const leafletMarker = this.leaflet!.marker(
        [marker.coordinates.latitude, marker.coordinates.longitude],
        {
          icon: this.createMarkerIcon(marker),
          keyboard: true,
          title: marker.title,
        },
      );

      leafletMarker.on('click', () => this.markerSelect.emit(marker));
      leafletMarker.addTo(this.markerLayer!);
    });

    this.fitToVisiblePoints();
  }

  private createMarkerIcon(marker: InteractiveMapMarker): Leaflet.DivIcon {
    const selectedClass =
      marker.id === this.selectedMarkerId() ? ' ap-leaflet-marker--selected' : '';
    const escapedTitle = escapeHtml(marker.title);
    const escapedRating = escapeHtml(marker.ratingLabel ?? marker.subtitle ?? '');
    const escapedHref = marker.href ? escapeHtml(marker.href) : '';
    const cardStart = escapedHref
      ? `<a class="ap-leaflet-marker__card" href="${escapedHref}" aria-label="Voir le profil de ${escapedTitle}">`
      : '<span class="ap-leaflet-marker__card">';
    const cardEnd = escapedHref ? '</a>' : '</span>';

    return this.leaflet!.divIcon({
      className: `ap-leaflet-marker${selectedClass}`,
      html: `
        <span class="ap-leaflet-marker__button" aria-label="Selectionner ${escapedTitle}">
          <span class="ap-leaflet-marker__badge" aria-hidden="true">
            <svg class="ap-leaflet-marker__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15.2 6.2a4.2 4.2 0 0 0-5.7 5.7L3.6 17.8v2.6h2.6l5.9-5.9a4.2 4.2 0 0 0 5.7-5.7l-2.6 2.6-2.6-2.6Z"></path>
            </svg>
          </span>
          ${cardStart}
            <span class="ap-leaflet-marker__name">${escapedTitle}</span>
            ${escapedRating ? `<span class="ap-leaflet-marker__rating">${escapedRating}</span>` : ''}
          ${cardEnd}
        </span>
      `,
      iconSize: [128, 84],
      iconAnchor: [64, 84],
      popupAnchor: [0, -72],
    });
  }

  private highlightSelectedMarker(): void {
    this.updateMarkers();

    const selected = this.markers().find((marker) => marker.id === this.selectedMarkerId());
    if (selected && this.map) {
      this.map.flyTo([selected.coordinates.latitude, selected.coordinates.longitude], 15, {
        duration: 0.7,
      });
    }
  }

  private fitToVisiblePoints(): void {
    if (!this.map || !this.leaflet) return;

    const points = this.markers().map((marker) =>
      this.leaflet!.latLng(marker.coordinates.latitude, marker.coordinates.longitude),
    );
    const loc = this.userLocation();

    if (loc) {
      points.push(this.leaflet.latLng(loc.latitude, loc.longitude));
    }

    (this.routePath() ?? []).forEach((p) => {
      points.push(this.leaflet!.latLng(p.latitude, p.longitude));
    });

    if (points.length === 0) return;

    if (points.length === 1) {
      this.map.setView(points[0], 13);
      return;
    }

    const isDesktop = window.matchMedia('(min-width: 48rem)').matches;

    this.map.fitBounds(this.leaflet.latLngBounds(points), {
      maxZoom: 13,
      paddingTopLeft: isDesktop ? [56, 120] : [24, 136],
      paddingBottomRight: isDesktop ? [424, 96] : [24, 220],
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function coordinatesToFallbackPoint(coordinates: MapCoordinates): FallbackUserPoint {
  const x =
    ((coordinates.longitude - FALLBACK_BOUNDS.west) /
      (FALLBACK_BOUNDS.east - FALLBACK_BOUNDS.west)) *
    100;
  const y =
    ((FALLBACK_BOUNDS.north - coordinates.latitude) /
      (FALLBACK_BOUNDS.north - FALLBACK_BOUNDS.south)) *
    100;

  return {
    x: clamp(x, 6, 94),
    y: clamp(y, 14, 86),
  };
}

function buildFallbackTiles(): readonly FallbackTile[] {
  const tiles: FallbackTile[] = [];
  const width = 100 / FALLBACK_TILE_COLUMNS;
  const height = 100 / FALLBACK_TILE_ROWS;

  for (let tileY = FALLBACK_TILE_MIN_Y; tileY <= FALLBACK_TILE_MAX_Y; tileY += 1) {
    for (let tileX = FALLBACK_TILE_MIN_X; tileX <= FALLBACK_TILE_MAX_X; tileX += 1) {
      tiles.push({
        href: `https://tile.openstreetmap.org/${FALLBACK_TILE_ZOOM}/${tileX}/${tileY}.png`,
        left: (tileX - FALLBACK_TILE_MIN_X) * width,
        top: (tileY - FALLBACK_TILE_MIN_Y) * height,
        width,
        height,
      });
    }
  }

  return tiles;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
