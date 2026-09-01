/**
 * Types du domaine « Avis ».
 *
 * L'avis porte sur une **intervention terminée**, pas sur un mécanicien en
 * général : c'est ce qui distingue un avis d'une opinion, et ce qui permettra
 * au backend de refuser une note venue de quelqu'un qui n'a jamais été dépanné.
 */

/** L'intervention que le client s'apprête à noter. */
export interface ReviewTarget {
  readonly interventionId: string;

  readonly mechanicId: string;
  readonly mechanicName: string;

  /** Spécialité du mécanicien, pour le situer d'un coup d'œil. */
  readonly mechanicSpecialty: string;

  /** Prestation réalisée (« Remplacement des plaquettes de frein »). */
  readonly serviceLabel: string;

  /** Fin de l'intervention, au format ISO. Mise en forme par l'écran. */
  readonly completedAt: string;
}

/** Ce que le client envoie. */
export interface ReviewDraft {
  readonly interventionId: string;

  /** Note de 1 à 5. Obligatoire : c'est la seule information indispensable. */
  readonly rating: number;

  /** Commentaire libre, éventuellement vide. */
  readonly comment: string;

  /**
   * Photos jointes en preuve du travail.
   *
   * Des `File` et non des chaînes : l'envoi se fait en `multipart`, et
   * convertir en base64 gonflerait la charge d'un tiers pour rien.
   */
  readonly photos: readonly File[];
}

/** Longueur maximale du commentaire, alignée sur ce qu'acceptera le backend. */
export const COMMENTAIRE_MAX = 500;

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
