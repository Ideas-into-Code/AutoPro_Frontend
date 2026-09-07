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
  mechanicId?: string;
  /** Id de l'utilisateur (compte) du mécanicien — pour ouvrir une conversation. */
  mechanicUserId?: string;
  mechanicName?: string;
  vehicleLabel?: string;
  createdAt: string;
  updatedAt: string;
}
