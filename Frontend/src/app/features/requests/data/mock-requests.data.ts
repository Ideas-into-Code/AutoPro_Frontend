import { InterventionRequest } from '../models/request.model';

export const MOCK_REQUESTS: InterventionRequest[] = [
  {
    id: 'req-2026-001',
    clientId: 'usr-client-01',
    clientName: 'Mohamed El Fadel Badji',
    clientPhone: '+221 77 100 22 33',
    problemType: 'batterie',
    description: 'La voiture ne démarre plus aux Almadies en face du restaurant.',
    status: 'en_cours',
    estimatedPriceXOF: 15000,
    locationAddress: 'Les Almadies, Dakar',
    mechanicId: 'mec-001',
    mechanicName: 'Boubacar Sidibe (Garage Sidibe Auto)',
    createdAt: '2026-07-29T18:30:00Z',
    updatedAt: '2026-07-29T18:45:00Z',
  },
  {
    id: 'req-2026-002',
    clientId: 'usr-client-02',
    clientName: 'Halima Lena Camara',
    clientPhone: '+221 77 200 33 44',
    problemType: 'pneu',
    description: 'Crevaison du pneu arrière gauche près de la Corniche.',
    status: 'terminee',
    estimatedPriceXOF: 10000,
    locationAddress: 'Corniche Ouest, Dakar',
    mechanicId: 'mec-002',
    mechanicName: 'Mame Goumba Amar (Atelier Amar Dépannage)',
    createdAt: '2026-07-25T09:15:00Z',
    updatedAt: '2026-07-25T10:10:00Z',
  },
];
