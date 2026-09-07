import { ProblemType } from './request.model';

/**
 * Position retenue pour l'intervention.
 *
 * `coordinates` est facultatif : un utilisateur qui refuse la géolocalisation
 * doit pouvoir signaler une panne malgré tout. L'adresse saisie suffit alors au
 * mécanicien pour se déplacer — refuser la demande faute de GPS serait absurde.
 */
export interface RequestLocation {
  readonly address: string;
  readonly coordinates?: {
    readonly latitude: number;
    readonly longitude: number;
  };
}

/**
 * Ce que le client envoie pour créer une demande d'intervention.
 *
 * Distinct d'`InterventionRequest`, et volontairement : le serveur décide de
 * l'identifiant, du statut, de l'estimation tarifaire et des horodatages. Les
 * demander au formulaire l'obligerait à inventer des valeurs que le serveur
 * écrasera — et laisserait croire que le client peut fixer son propre prix.
 */
export interface InterventionRequestDraft {
  readonly problemType: ProblemType;
  readonly description: string;
  readonly location: RequestLocation;

  /** Numéro de rappel, seul moyen de joindre un automobiliste en panne. */
  readonly contactPhone: string;

  /** Signale une immobilisation : le serveur priorise la mise en relation. */
  readonly isEmergency: boolean;

  /** Véhicule concerné, choisi parmi le parc du client. Facultatif. */
  readonly vehicleId?: string;

  /**
   * Photos du problème. Des `File`, pas des chaînes encodées : un envoi en
   * `multipart/form-data` évite les 33 % de surpoids du base64, ce qui compte
   * sur un réseau mobile facturé au volume.
   */
  readonly photos: readonly File[];
}

/**
 * Traduit un `slug` de catégorie de service en type de problème.
 *
 * Les deux nomenclatures ne coïncident pas tout à fait, et il vaut mieux
 * l'assumer ici qu'aligner l'une sur l'autre à la va-vite :
 *   - les catégories emploient des tirets (`panne-moteur`), les types de
 *     problème des underscores (`panne_moteur`) ;
 *   - « climatisation » et « électricité » sont des catégories de service, mais
 *     pas des types de panne déclarés : elles retombent sur `autre`.
 *
 * Fonction pure et exportée : testable sans conteneur d'injection, et un seul
 * endroit à corriger le jour où le backend unifiera les deux vocabulaires.
 */
const TYPES_PAR_CATEGORIE: Readonly<Record<string, ProblemType>> = {
  batterie: 'batterie',
  pneu: 'pneu',
  'panne-moteur': 'panne_moteur',
  freinage: 'freinage',
  remorquage: 'remorquage',
};

export function problemTypeFromCategorySlug(slug: string | undefined): ProblemType {
  if (slug === undefined || slug === '') {
    return 'autre';
  }

  return TYPES_PAR_CATEGORIE[slug] ?? 'autre';
}

/** Intitulés affichés dans le sélecteur de type de problème. */
export const PROBLEM_TYPE_LABELS: Readonly<Record<ProblemType, string>> = {
  batterie: 'Batterie / démarrage',
  pneu: 'Pneumatique',
  panne_moteur: 'Panne moteur',
  freinage: 'Freinage',
  remorquage: 'Remorquage',
  autre: 'Autre problème',
};
