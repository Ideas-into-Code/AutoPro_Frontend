/**
 * Types des vignettes affichées sur l'accueil.
 *
 * Volontairement distincts des modèles de domaine (`Mechanic`,
 * `InterventionRequest`) : l'accueil n'affiche qu'un résumé, et le déclarer
 * ainsi évite qu'il dépende du domaine « mécaniciens » ou « demandes ». Une
 * feature ne doit jamais en importer une autre (CONVENTIONS.md §1).
 */

/** Mécanicien mis en avant sur l'accueil, sous forme condensée. */
export interface NearbyMechanic {
  readonly id: string;
  readonly name: string;
  readonly district: string;
  readonly distance: string;
  readonly rating: number;
  readonly tags: readonly string[];
}

/** Demande récente de l'utilisateur, telle que résumée sur l'accueil. */
export interface RecentRequest {
  readonly id: string;
  readonly label: string;
  readonly date: string;
  readonly icon: string;
  readonly color: 'primary' | 'warning';
  readonly status: 'pending' | 'done';
  readonly statusLabel: string;
}
