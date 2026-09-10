/**
 * Types du domaine « Avis ».
 *
 * Le backend gère un avis **par mécanicien et par client** (une note, un
 * commentaire), sans photos ni lien à une intervention. L'écran s'aligne : on
 * note un mécanicien après avoir été dépanné par lui.
 */

/** Le mécanicien que le client s'apprête à noter. */
export interface ReviewTarget {
  readonly mechanicId: string;
  readonly mechanicName: string;

  /** Spécialité du mécanicien, pour le situer d'un coup d'œil. */
  readonly mechanicSpecialty: string;
}

/** Ce que le client envoie. */
export interface ReviewDraft {
  readonly mechanicId: string;

  /** Note de 1 à 5. Obligatoire : c'est la seule information indispensable. */
  readonly rating: number;

  /** Commentaire libre, éventuellement vide. */
  readonly comment: string;
}

/** Longueur maximale du commentaire, alignée sur le backend (`@Size(max = 1000)`). */
export const COMMENTAIRE_MAX = 1000;

/**
 * Libellés des cinq échelons, du plus bas au plus haut.
 *
 * Ici et non dans `RatingStars` : « Passable » convient à un service rendu,
 * pas à la note d'un article. Le composant partagé ne porte aucun libellé
 * propre à un écran (CONVENTIONS.md §5).
 */
export const LIBELLES_NOTE: readonly string[] = [
  'Passable',
  'Correct',
  'Bien',
  'Très bien',
  'Excellent',
];
