export type ProblemType =
  'batterie' | 'pneu' | 'panne_moteur' | 'freinage' | 'remorquage' | 'autre';

export type RequestStatus = 'en_attente' | 'acceptee' | 'en_cours' | 'terminee' | 'annulee';

/** Intitulés d'état affichés à l'utilisateur. */
export const REQUEST_STATUS_LABELS: Readonly<Record<RequestStatus, string>> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

export const REQUEST_PAYMENT_LABELS: Readonly<Record<'en_attente' | 'encaisse' | 'annule', string>> = {
  en_attente: 'À régler en espèces',
  encaisse: 'Payé en espèces',
  annule: 'Paiement annulé',
};

/** Un client ne peut annuler que tant que l'intervention n'a pas commencé/fini. */
export function peutEtreAnnulee(status: RequestStatus): boolean {
  return status === 'en_attente' || status === 'acceptee';
}

/**
 * Motif d'annulation, choisi dans une liste par le client. Aligné sur l'enum
 * backend `CancellationReason`.
 */
export type CancellationReason =
  | 'NO_LONGER_NEEDED'
  | 'FOUND_ANOTHER_SOLUTION'
  | 'MECHANIC_TOO_SLOW'
  | 'PRICE_TOO_HIGH'
  | 'CREATED_BY_MISTAKE'
  | 'MECHANIC_UNAVAILABLE'
  | 'OTHER';

export const CANCELLATION_REASON_LABELS: Readonly<Record<CancellationReason, string>> = {
  NO_LONGER_NEEDED: "Je n'ai plus besoin d'aide",
  FOUND_ANOTHER_SOLUTION: 'J’ai trouvé une autre solution',
  MECHANIC_TOO_SLOW: 'Le mécanicien met trop de temps',
  PRICE_TOO_HIGH: 'Le prix proposé est trop élevé',
  CREATED_BY_MISTAKE: 'Demande créée par erreur',
  MECHANIC_UNAVAILABLE: "Le mécanicien n'est pas disponible",
  OTHER: 'Autre raison',
};

/** Choix proposés au client, dans l'ordre d'affichage. */
export const CANCELLATION_REASONS: readonly CancellationReason[] = [
  'NO_LONGER_NEEDED',
  'FOUND_ANOTHER_SOLUTION',
  'MECHANIC_TOO_SLOW',
  'PRICE_TOO_HIGH',
  'CREATED_BY_MISTAKE',
  'OTHER',
];

/** État du paiement en espèces, tel que renvoyé par le backend. */
export type RequestPaymentStatus = 'en_attente' | 'encaisse' | 'annule';

export interface InterventionRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  problemType: ProblemType;
  description: string;
  status: RequestStatus;
  isEmergency: boolean;

  /**
   * Prix convenu par le mécanicien, en francs CFA. `null` tant qu'il n'est pas
   * fixé. (Le backend ne fournit pas d'estimation avant acceptation.)
   */
  priceXOF: number | null;

  /** `null` tant que l'intervention n'est pas terminée. */
  paymentStatus: RequestPaymentStatus | null;

  locationAddress: string;
  latitude?: number;
  longitude?: number;

  /** Photos jointes par le client à la création. */
  photoUrls: string[];

  /** Motif d'annulation, présent uniquement si `status === 'annulee'`. */
  cancellationReason?: CancellationReason;

  mechanicId?: string;
  /** Id de l'utilisateur (compte) du mécanicien — pour ouvrir une conversation. */
  mechanicUserId?: string;
  mechanicName?: string;
  vehicleLabel?: string;
  createdAt: string;
  updatedAt: string;
}
