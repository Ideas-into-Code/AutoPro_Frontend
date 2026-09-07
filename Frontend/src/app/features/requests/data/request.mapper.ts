import { InterventionRequest, ProblemType, RequestPaymentStatus, RequestStatus } from '../models/request.model';
import { InterventionRequestDraft } from '../models/request-draft.model';

/**
 * Traduction entre le vocabulaire du backend (`/api/service-requests`) et les
 * types du domaine « demandes » du frontend. Un seul endroit à corriger le jour
 * où les deux nomenclatures convergent.
 */

type BackendProblemType = 'BATTERY' | 'TIRE' | 'ENGINE' | 'BRAKES' | 'TOWING' | 'OTHER';
type BackendStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type BackendPaymentStatus = 'PENDING' | 'COLLECTED' | 'CANCELLED';

export interface BackendServiceRequest {
  id: number;
  clientId: number;
  clientName: string;
  mechanicId: number | null;
  mechanicName: string | null;
  vehicleId: number | null;
  vehicleLabel: string | null;
  description: string;
  problemType: BackendProblemType;
  contactPhone: string | null;
  isEmergency: boolean;
  status: BackendStatus;
  price: number | null;
  payment: { status: BackendPaymentStatus } | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequestPayload {
  description: string;
  problemType: BackendProblemType;
  contactPhone: string;
  isEmergency: boolean;
  address: string;
  latitude?: number;
  longitude?: number;
}

const PROBLEM_TO_BACKEND: Record<ProblemType, BackendProblemType> = {
  batterie: 'BATTERY',
  pneu: 'TIRE',
  panne_moteur: 'ENGINE',
  freinage: 'BRAKES',
  remorquage: 'TOWING',
  autre: 'OTHER',
};
const PROBLEM_FROM_BACKEND: Record<BackendProblemType, ProblemType> = {
  BATTERY: 'batterie',
  TIRE: 'pneu',
  ENGINE: 'panne_moteur',
  BRAKES: 'freinage',
  TOWING: 'remorquage',
  OTHER: 'autre',
};
const STATUS_FROM_BACKEND: Record<BackendStatus, RequestStatus> = {
  PENDING: 'en_attente',
  ACCEPTED: 'acceptee',
  IN_PROGRESS: 'en_cours',
  COMPLETED: 'terminee',
  CANCELLED: 'annulee',
};
const PAYMENT_FROM_BACKEND: Record<BackendPaymentStatus, RequestPaymentStatus> = {
  PENDING: 'en_attente',
  COLLECTED: 'encaisse',
  CANCELLED: 'annule',
};

export function toInterventionRequest(b: BackendServiceRequest): InterventionRequest {
  return {
    id: String(b.id),
    clientId: String(b.clientId),
    clientName: b.clientName,
    clientPhone: b.contactPhone ?? '',
    problemType: PROBLEM_FROM_BACKEND[b.problemType] ?? 'autre',
    description: b.description,
    status: STATUS_FROM_BACKEND[b.status],
    isEmergency: b.isEmergency,
    priceXOF: b.price,
    paymentStatus: b.payment ? PAYMENT_FROM_BACKEND[b.payment.status] : null,
    locationAddress: b.address ?? '',
    latitude: b.latitude ?? undefined,
    longitude: b.longitude ?? undefined,
    mechanicId: b.mechanicId != null ? String(b.mechanicId) : undefined,
    mechanicName: b.mechanicName ?? undefined,
    vehicleLabel: b.vehicleLabel ?? undefined,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export function toCreatePayload(draft: InterventionRequestDraft): CreateServiceRequestPayload {
  const coords = draft.location.coordinates;
  return {
    description: draft.description,
    problemType: PROBLEM_TO_BACKEND[draft.problemType],
    contactPhone: draft.contactPhone,
    isEmergency: draft.isEmergency,
    address: draft.location.address,
    ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
  };
}
