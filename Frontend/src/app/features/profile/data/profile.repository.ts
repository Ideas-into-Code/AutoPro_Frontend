import { Observable } from 'rxjs';

import { AccountPatch, MechanicPatch, Profile } from '../models/profile.model';

/**
 * Dépôt du profil de l'utilisateur connecté.
 *
 * Un seul contrat malgré deux ressources backend : l'écran n'agit jamais sur
 * l'une sans avoir l'autre sous les yeux (le mécanicien voit son compte et sa
 * fiche pro sur la même page), et les séparer n'apporterait ici aucune
 * réutilisation.
 *
 * Classe abstraite = contrat + jeton d'injection.
 */
export abstract class ProfileRepository {
  /** Compte + fiche mécanicien si le rôle en a une. */
  abstract load(): Observable<Profile>;

  /** Met à jour le compte (`PUT /api/users/me`). Renvoie le profil rechargé. */
  abstract saveAccount(patch: AccountPatch): Observable<Profile>;

  /** Met à jour la fiche mécanicien (`PUT /api/mechanics/me`). */
  abstract saveMechanic(patch: MechanicPatch): Observable<Profile>;

  /**
   * Téléverse une photo de profil (`POST /api/files/profile-picture`) et
   * renvoie son URL. À sauvegarder ensuite via `saveMechanic({ photoUrl })`.
   */
  abstract uploadPhoto(file: File): Observable<string>;
}
