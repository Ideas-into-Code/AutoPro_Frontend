import { Mechanic } from '../models/mechanic.model';

export const MOCK_MECHANICS: Mechanic[] = [
  {
    id: 'mec-001',
    fullName: 'Boubacar Sidibe',
    workshopName: 'Garage Sidibe Auto',
    phone: '+221 77 300 44 55',
    email: 'boubacar.sidibe@garage-sidibe.sn',
    avatarUrl: 'assets/images/avatars/mec-1.png',
    specialties: ['Mécanique générale', 'Diagnostic électronique', 'Freinage'],
    rating: 4.9,
    reviewCount: 42,
    isAvailable: true,
    isVerified: true,
    address: 'Dakar Plateau, Avenue Lamine Guèye, Dakar',
    location: {
      latitude: 14.6708,
      longitude: -17.4373,
    },
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Mohamed El Fadel Badji',
        rating: 5,
        comment:
          'Intervention super rapide pour une panne de batterie aux Almadies. Travail propre !',
        createdAt: '2026-07-25T14:00:00Z',
      },
      {
        id: 'rev-2',
        authorName: 'Halima Lena Camara',
        rating: 4.8,
        comment: 'Excellent mécanicien, très poli et professionnel.',
        createdAt: '2026-07-20T09:30:00Z',
      },
    ],
  },
  {
    id: 'mec-002',
    fullName: 'Mame Goumba Amar',
    workshopName: 'Atelier Amar Dépannage',
    phone: '+221 77 400 55 66',
    email: 'goumba.amar@amar-depannage.sn',
    avatarUrl: 'assets/images/avatars/mec-2.png',
    specialties: ['Climatisation auto', 'Pneumatique', 'Électricité auto'],
    rating: 4.8,
    reviewCount: 29,
    isAvailable: true,
    isVerified: true,
    address: 'Keur Massar, Route de Rufisque, Dakar',
    location: {
      latitude: 14.7743,
      longitude: -17.3142,
    },
    reviews: [
      {
        id: 'rev-3',
        authorName: 'Mohamed El Fadel Badji',
        rating: 4.7,
        comment: 'Dépannage sur autoroute rapide et efficace.',
        createdAt: '2026-07-18T16:20:00Z',
      },
    ],
  },
];
