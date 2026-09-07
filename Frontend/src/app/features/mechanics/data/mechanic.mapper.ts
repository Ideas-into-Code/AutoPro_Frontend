import { Mechanic, MechanicReview } from '../models/mechanic.model';

/**
 * Traduction du vocabulaire backend (`/api/mechanics`) vers le modèle riche du
 * frontend. Le monolithe ne pagine pas cet endpoint et ne renvoie qu'une
 * spécialité en texte libre : l'adaptation se fait ici, pas dans les écrans.
 */

export interface BackendMechanic {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  experienceYears: number | null;
  bio: string | null;
  isAvailable: boolean;
  validationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  averageRating: number | string | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
}

export interface BackendReview {
  id: number;
  mechanicId: number;
  reviewerId: number;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** Découpe une spécialité en mots-clés affichables (« Pneu et freinage » → 2 tags). */
function splitSpecialties(specialization: string | null): string[] {
  if (!specialization) {
    return [];
  }
  return specialization
    .split(/\s*(?:,|;|\/|\bet\b|\+)\s*/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function toMechanic(b: BackendMechanic, reviews: readonly MechanicReview[] = []): Mechanic {
  return {
    id: String(b.id),
    fullName: b.fullName || `${b.firstName} ${b.lastName}`.trim(),
    workshopName: b.bio ?? '',
    phone: b.phone ?? '',
    email: b.email,
    avatarUrl: '',
    specialties: splitSpecialties(b.specialization),
    rating: Number(b.averageRating ?? 0),
    reviewCount: b.reviewCount ?? 0,
    isAvailable: b.isAvailable,
    isVerified: b.validationStatus === 'APPROVED',
    address:
      b.latitude != null && b.longitude != null
        ? `${b.latitude.toFixed(4)}, ${b.longitude.toFixed(4)}`
        : '',
    location: { latitude: b.latitude ?? 0, longitude: b.longitude ?? 0 },
    reviews: [...reviews],
  };
}

export function toMechanicReview(b: BackendReview): MechanicReview {
  return {
    id: String(b.id),
    authorName: b.reviewerName,
    rating: b.rating,
    comment: b.comment ?? '',
    createdAt: b.createdAt,
  };
}

/**
 * Mots-clés de spécialité associés à une catégorie de service choisie sur
 * l'accueil. Le backend filtre par sous-chaîne de `specialization` ; on lui
 * envoie donc un mot représentatif.
 */
const KEYWORD_BY_CATEGORY: Readonly<Record<string, string>> = {
  batterie: 'batterie',
  pneu: 'pneu',
  'panne-moteur': 'moteur',
  freinage: 'frein',
  remorquage: 'remorquage',
  climatisation: 'clim',
  electricite: 'électr',
};

export function specializationFilter(categorySlug?: string, search?: string): string | undefined {
  if (search && search.trim() !== '') {
    return search.trim();
  }
  if (categorySlug && KEYWORD_BY_CATEGORY[categorySlug]) {
    return KEYWORD_BY_CATEGORY[categorySlug];
  }
  return undefined;
}
