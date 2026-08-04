export type ProblemType =
  'batterie' | 'pneu' | 'panne_moteur' | 'freinage' | 'remorquage' | 'autre';

export type RequestStatus = 'en_attente' | 'acceptee' | 'en_cours' | 'terminee' | 'annulee';

export interface InterventionRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  problemType: ProblemType;
  description: string;
  status: RequestStatus;
  estimatedPriceXOF: number; // Prix estimé en Francs CFA
  locationAddress: string;
  mechanicId?: string;
  mechanicName?: string;
  createdAt: string;
  updatedAt: string;
}
