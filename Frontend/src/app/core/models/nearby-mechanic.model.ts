/**
 * Mécanicien renvoyé par la recherche géospatiale (`GET /api/mechanics/nearby`).
 *
 * Modèle **neutre**, volontairement pauvre : il ne porte que ce que le backend
 * sait réellement. La carte interactive et le bandeau de l'accueil en dérivent
 * chacun leur propre vue — une feature n'importe jamais le modèle d'une autre,
 * mais toutes peuvent dépendre de `core`.
 */
export interface NearbyMechanic {
  /** Id du profil mécanicien — sert aussi de lien vers `/mecaniciens/{id}`. */
  readonly id: string;
  readonly userId: string;
  readonly fullName: string;

  /** Spécialité(s) déclarée(s), déjà découpées en mots-clés affichables. */
  readonly specialties: readonly string[];

  /** Texte libre du mécanicien (tient lieu de nom d'atelier). */
  readonly bio: string;

  readonly rating: number;
  readonly reviewCount: number;
  readonly isAvailable: boolean;

  /** Dossier validé par un administrateur. */
  readonly isVerified: boolean;

  readonly latitude: number;
  readonly longitude: number;

  /** Distance au point de recherche, en kilomètres, arrondie à 0,1. */
  readonly distanceKm: number;
}

/** Paramètres de la recherche géospatiale. */
export interface NearbyMechanicQuery {
  readonly latitude: number;
  readonly longitude: number;

  /** Rayon de recherche en km. Défaut backend : 20. */
  readonly radiusKm?: number;

  /** Sous-chaîne de spécialité (le backend filtre en « contient »). */
  readonly specialization?: string;

  /** N'inclure que les mécaniciens disponibles. Défaut backend : `true`. */
  readonly onlyAvailable?: boolean;
}
