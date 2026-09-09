export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MechanicReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Mechanic {
  id: string;

  /** Id du compte utilisateur du mécanicien — pour ouvrir une conversation. */
  userId: string;
  fullName: string;

  /** Présentation libre saisie par le mécanicien (nom d'atelier, description). */
  workshopName: string;
  phone: string;
  email: string;
  avatarUrl: string;
  specialties: string[];

  /** Années d'expérience déclarées, ou `null` si non renseignées. */
  experienceYears: number | null;

  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isVerified: boolean;

  /** Adresse lisible, ou `''` si seule la position GPS est connue. */
  address: string;
  location: Coordinates;
  reviews: MechanicReview[];
}
