/**
 * Demande d'intervention vue par le mécanicien.
 *
 * Types propres à cette feature (une feature n'en importe jamais une autre) :
 * même entité côté backend que les « demandes » du client, mais l'écran
 * mécanicien n'en montre pas les mêmes choses et pilote d'autres actions.
 */

export type MechanicRequestStatus =
  | 'en_attente'
  | 'acceptee'
  | 'en_cours'
  | 'terminee'
  | 'annulee';

export type MechanicPaymentStatus = 'en_attente' | 'encaisse' | 'annule';

/** Motifs d'annulation, alignés sur l'enum backend `CancellationReason`. */
export const CANCELLATION_REASON_LABELS: Readonly<Record<string, string>> = {
  NO_LONGER_NEEDED: "Le client n'a plus besoin d'aide",
  FOUND_ANOTHER_SOLUTION: 'Le client a trouvé une autre solution',
  MECHANIC_TOO_SLOW: 'Intervention jugée trop lente',
  PRICE_TOO_HIGH: 'Prix jugé trop élevé',
  CREATED_BY_MISTAKE: 'Demande créée par erreur',
  MECHANIC_UNAVAILABLE: 'Mécanicien indisponible',
  OTHER: 'Autre raison',
};

export interface MechanicRequest {
  readonly id: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly clientPhone: string;
  readonly problemLabel: string;
  readonly description: string;
  readonly address: string;

  /** Position du client, géolocalisée à la création. `null` si non fournie. */
  readonly latitude: number | null;
  readonly longitude: number | null;

  readonly isEmergency: boolean;
  readonly status: MechanicRequestStatus;

  /** Photos jointes par le client. */
  readonly photoUrls: readonly string[];

  /** Motif d'annulation, présent uniquement si `status === 'annulee'`. */
  readonly cancellationReason: string | null;

  /** Prix convenu, `null` tant que le mécanicien ne l'a pas fixé. */
  readonly priceXOF: number | null;

  /** `null` tant que l'intervention n'est pas terminée. */
  readonly paymentStatus: MechanicPaymentStatus | null;

  readonly assignedToMe: boolean;
  readonly createdAt: string;
}

export const MECHANIC_REQUEST_STATUS_LABELS: Readonly<Record<MechanicRequestStatus, string>> = {
  en_attente: 'Nouvelle',
  acceptee: 'Acceptée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

/** Action possible sur une demande, selon son statut. */
export type MechanicRequestAction = 'accepter' | 'demarrer' | 'fixer_prix' | 'terminer' | 'encaisser';

export function actionsFor(r: MechanicRequest): MechanicRequestAction[] {
  if (r.status === 'en_attente') {
    return ['accepter'];
  }
  if (!r.assignedToMe) {
    return [];
  }
  switch (r.status) {
    case 'acceptee':
      return r.priceXOF === null ? ['fixer_prix', 'demarrer'] : ['fixer_prix', 'demarrer'];
    case 'en_cours':
      return r.priceXOF === null ? ['fixer_prix'] : ['fixer_prix', 'terminer'];
    case 'terminee':
      return r.paymentStatus === 'en_attente' ? ['encaisser'] : [];
    default:
      return [];
  }
}
