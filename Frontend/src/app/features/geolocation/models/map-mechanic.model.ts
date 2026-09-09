import { MapCoordinates } from '@shared/ui';

import type { NearbyMechanic } from '@core';

export type { MapCoordinates };

export type MapMechanicPriceLevel = 1 | 2 | 3;

/**
 * Mécanicien tel qu'affiché sur la carte.
 *
 * Dérivé du modèle neutre `NearbyMechanic` de `core`. Les champs que le backend
 * ne fournit pas (`priceLevel`, `opensAt`) sont **optionnels** et non inventés :
 * l'écran masque simplement la ligne correspondante. Afficher « Prix modéré »
 * sans donnée serait exactement le « faux fonctionnel » qu'on veut éviter.
 */
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
  readonly priceLevel?: MapMechanicPriceLevel;
  readonly opensAt?: string;
  readonly badgeLabel?: string;
}

/** `NearbyMechanic` (core) → `MapMechanic` (vue carte). */
export function toMapMechanic(m: NearbyMechanic): MapMechanic {
  return {
    id: m.id,
    profileId: m.id,
    fullName: m.fullName,
    workshopName: m.bio,
    specialties: m.specialties,
    rating: Math.round(m.rating * 10) / 10,
    reviewCount: m.reviewCount,
    isAvailable: m.isAvailable,
    isVerified: m.isVerified,
    address: '',
    location: { latitude: m.latitude, longitude: m.longitude },
    distanceKm: m.distanceKm,
    badgeLabel: m.isVerified ? 'Vérifié' : undefined,
  };
}
