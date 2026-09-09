import {
  MechanicPaymentStatus,
  MechanicRequest,
  MechanicRequestStatus,
} from '../models/mechanic-request.model';

type BackendStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type BackendProblem = 'BATTERY' | 'TIRE' | 'ENGINE' | 'BRAKES' | 'TOWING' | 'OTHER';
type BackendPayment = 'PENDING' | 'COLLECTED' | 'CANCELLED';

export interface BackendServiceRequest {
  id: number;
  clientId: number;
  clientName: string;
  mechanicId: number | null;
  description: string;
  problemType: BackendProblem;
  contactPhone: string | null;
  isEmergency: boolean;
  status: BackendStatus;
  price: number | null;
  payment: { status: BackendPayment } | null;
  address: string | null;
  photoUrls: string[] | null;
  cancellationReason: string | null;
  createdAt: string;
}

const STATUS: Record<BackendStatus, MechanicRequestStatus> = {
  PENDING: 'en_attente',
  ACCEPTED: 'acceptee',
  IN_PROGRESS: 'en_cours',
  COMPLETED: 'terminee',
  CANCELLED: 'annulee',
};

const PAYMENT: Record<BackendPayment, MechanicPaymentStatus> = {
  PENDING: 'en_attente',
  COLLECTED: 'encaisse',
  CANCELLED: 'annule',
};

const PROBLEM_LABELS: Record<BackendProblem, string> = {
  BATTERY: 'Batterie / démarrage',
  TIRE: 'Pneumatique',
  ENGINE: 'Panne moteur',
  BRAKES: 'Freinage',
  TOWING: 'Remorquage',
  OTHER: 'Autre problème',
};

export function toMechanicRequest(
  b: BackendServiceRequest,
  myMechanicId: string | undefined,
): MechanicRequest {
  return {
    id: String(b.id),
    clientId: String(b.clientId),
    clientName: b.clientName,
    clientPhone: b.contactPhone ?? '',
    problemLabel: PROBLEM_LABELS[b.problemType] ?? 'Autre problème',
    description: b.description,
    address: b.address ?? '',
    photoUrls: b.photoUrls ?? [],
    cancellationReason: b.cancellationReason ?? null,
    isEmergency: b.isEmergency,
    status: STATUS[b.status],
    priceXOF: b.price,
    paymentStatus: b.payment ? PAYMENT[b.payment.status] : null,
    assignedToMe:
      myMechanicId !== undefined && b.mechanicId != null && String(b.mechanicId) === myMechanicId,
    createdAt: b.createdAt,
  };
}
