/**
 * Catégorie de service : la famille de panne ou d'entretien par laquelle un
 * client entre dans l'application.
 *
 * Ce type vit dans `core/models` et non dans une feature parce qu'au moins deux
 * domaines s'en servent — l'accueil les présente, les mécaniciens s'y filtrent —
 * et qu'une feature ne doit jamais en importer une autre (CONVENTIONS.md §1).
 *
 * Aucun nom de pictogramme ici, volontairement : l'iconographie est une
 * décision d'interface, pas une donnée métier. C'est la carte de catégorie qui
 * associe un `slug` à un pictogramme. Le backend n'a donc pas à connaître le
 * jeu d'icônes du frontend, et `core` n'a pas à dépendre de `shared/ui`.
 */
export interface ServiceCategory {
  readonly id: string;

  /**
   * Identifiant lisible et stable, utilisé dans les URL
   * (`/mecaniciens?categorie=batterie`). Distinct de `id` : un identifiant
   * technique peut changer de forme côté serveur sans casser les liens
   * partagés par les utilisateurs.
   */
  readonly slug: string;

  /** Intitulé affiché, déjà traduit par le serveur. */
  readonly label: string;

  /** Phrase courte qui lève l'ambiguïté entre deux catégories voisines. */
  readonly description: string;

  /**
   * Signale une catégorie traitée en urgence. L'accueil s'en sert pour mettre
   * en avant le dépannage sans coder « remorquage » en dur dans l'affichage.
   */
  readonly isEmergency: boolean;
}
