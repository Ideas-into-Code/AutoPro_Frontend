/**
 * Types du domaine « Profil ».
 *
 * Le profil réunit deux ressources backend distinctes — le compte
 * (`/api/users/me`) et, pour un mécanicien, la fiche professionnelle
 * (`/api/mechanics/me`). L'écran n'en connaît qu'un seul objet ; le dépôt fait
 * la jonction.
 */

export type ProfileRole = 'client' | 'mecanicien' | 'admin';

/** Partie « compte », commune à tous les rôles. */
export interface AccountProfile {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;

  /** Non modifiable : sert d'identifiant de connexion. */
  readonly email: string;

  readonly role: ProfileRole;
}

/** Partie « mécanicien », présente uniquement si `role === 'mecanicien'`. */
export interface MechanicProfile {
  readonly specialization: string;
  readonly experienceYears: number | null;
  readonly bio: string;
  readonly isAvailable: boolean;

  /** Dossier validé par un administrateur — condition pour se rendre disponible. */
  readonly isVerified: boolean;

  readonly latitude: number | null;
  readonly longitude: number | null;

  /** URL de la photo de profil, ou `null`. */
  readonly photoUrl: string | null;

  /** Horaires d'ouverture, texte libre (`''` si non renseignés). */
  readonly openingHours: string;
}

export interface Profile {
  readonly account: AccountProfile;
  readonly mechanic: MechanicProfile | null;
}

/** Ce que l'écran envoie pour la partie compte. */
export interface AccountPatch {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
}

/** Ce que l'écran envoie pour la partie mécanicien. */
export interface MechanicPatch {
  readonly specialization: string;
  readonly experienceYears: number | null;
  readonly bio: string;
  readonly isAvailable: boolean;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly photoUrl: string | null;
  readonly openingHours: string;
}
