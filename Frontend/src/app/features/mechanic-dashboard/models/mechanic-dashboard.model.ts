/**
 * Types du tableau de bord mécanicien.
 *
 * Cette feature est un écran d'**agrégation**, comme l'accueil client : elle
 * réunit des informations venues de plusieurs domaines (gains, demandes,
 * disponibilité). Elle déclare donc ses propres types condensés plutôt que
 * d'importer ceux de `requests` ou de `pricing` — une feature ne doit jamais
 * en importer une autre (CONVENTIONS.md §1).
 */

/** Un point du graphique des gains : un jour, un montant. */
export interface EarningsPoint {
  /** Libellé court de l'abscisse, déjà traduit (« Lun », « Mar »…). */
  readonly label: string;

  /** Montant gagné ce jour-là, en francs CFA. */
  readonly amountXOF: number;
}

/** Résumé des gains affiché en tête du tableau de bord. */
export interface EarningsSummary {
  /** Total du jour, en francs CFA. */
  readonly todayXOF: number;

  /**
   * Évolution par rapport à la veille, en pourcentage.
   * Négatif si les gains baissent : l'écran doit pouvoir l'annoncer aussi.
   */
  readonly trendPercent: number;

  /** Historique récent, du plus ancien au plus récent. */
  readonly points: readonly EarningsPoint[];
}

/** Disponibilité déclarée du mécanicien. */
export interface Availability {
  /** `true` : le mécanicien reçoit des demandes. */
  readonly isOnline: boolean;
}

/**
 * Demande entrante proposée au mécanicien.
 *
 * Volontairement condensée : le mécanicien décide d'accepter ou non en
 * quelques secondes, souvent les mains sales. Il lui faut le lieu, la panne et
 * la rémunération, pas la fiche complète.
 */
export interface NewRequest {
  readonly id: string;
  readonly clientName: string;
  readonly vehicle: string;
  readonly problemLabel: string;

  /** Distance annoncée, déjà formatée (« 2,4 km »). */
  readonly distanceLabel: string;

  /** Rémunération estimée, en francs CFA. */
  readonly estimatedPayoutXOF: number;
}

/** Suite donnée par le mécanicien à une demande entrante. */
export type RequestDecision = 'acceptee' | 'refusee';
