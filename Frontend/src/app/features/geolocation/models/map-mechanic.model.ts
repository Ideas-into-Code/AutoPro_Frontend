import { MapCoordinates } from '@shared/ui';

export type { MapCoordinates };

export type MapMechanicPriceLevel = 1 | 2 | 3;

export interface MapMechanic {
  readonly id: string;
  readonly profileId: string;
  readonly fullName: string;
  readonly workshopName: string;
  readonly avatarUrl?: string;
  readonly specialties: readonly string[];
  readonly rating: number;
  readonly reviewCount: number;
  readonly isAvailable: boolean;
  readonly isVerified: boolean;
  readonly address: string;
  readonly location: MapCoordinates;
  readonly distanceKm: number;
  readonly priceLevel: MapMechanicPriceLevel;
  readonly opensAt: string;
  readonly badgeLabel?: string;
}
