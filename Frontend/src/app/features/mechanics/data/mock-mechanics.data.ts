import { Mechanic } from '../models/mechanic.model';

/** Calcule la note moyenne et le nombre d'avis depuis le tableau reviews. */
function computeStats(reviews: Mechanic['reviews']): { rating: number; reviewCount: number } {
  const count = reviews.length;
  if (count === 0) return { rating: 0, reviewCount: 0 };
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / count;
  return { rating: Math.round(avg * 10) / 10, reviewCount: count };
}

const mec001Reviews: Mechanic['reviews'] = [
  {
    id: 'rev-1',
    authorName: 'Mohamed El Fadel Badji',
    rating: 5,
    comment: 'Intervention super rapide pour une panne de batterie aux Almadies. Travail propre !',
    createdAt: '2026-07-25T14:00:00Z',
  },
  {
    id: 'rev-2',
    authorName: 'Halima Lena Camara',
    rating: 4.8,
    comment: 'Excellent mécanicien, très poli et professionnel.',
    createdAt: '2026-07-20T09:30:00Z',
  },
];

const mec002Reviews: Mechanic['reviews'] = [
  {
    id: 'rev-3',
    authorName: 'Mohamed El Fadel Badji',
    rating: 4.7,
    comment: 'Dépannage sur autoroute rapide et efficace.',
    createdAt: '2026-07-18T16:20:00Z',
  },
];

const mec003Reviews: Mechanic['reviews'] = [
  {
    id: 'rev-4',
    authorName: 'Sokhna Diop',
    rating: 4.8,
    comment: 'Diagnostic clair et dépannage rapide malgré une panne compliquée.',
    createdAt: '2026-07-28T10:15:00Z',
  },
];

const mec004Reviews: Mechanic['reviews'] = [
  {
    id: 'rev-5',
    authorName: 'Aminata Kane',
    rating: 5,
    comment: 'Service premium, voiture rendue propre et suspension réglée parfaitement.',
    createdAt: '2026-07-22T12:40:00Z',
  },
];

const mec005Reviews: Mechanic['reviews'] = [
  {
    id: 'rev-6',
    authorName: 'Moussa Sarr',
    rating: 4.6,
    comment: 'Vidange rapide, bon accueil et prix correct.',
    createdAt: '2026-07-26T08:10:00Z',
  },
];

const mec006Reviews: Mechanic['reviews'] = [
  {
    id: 'rev-7',
    authorName: 'Cheikh Mbaye',
    rating: 4.8,
    comment: 'Très bon diagnostic électronique, explications simples et honnêtes.',
    createdAt: '2026-07-30T17:25:00Z',
  },
];

const mec007Reviews: Mechanic['reviews'] = [
  {
    id: 'rev-8',
    authorName: 'Fatou Ba',
    rating: 4.7,
    comment: 'Freinage refait rapidement, rendez-vous bien respecté.',
    createdAt: '2026-07-24T11:05:00Z',
  },
];

export const MOCK_MECHANICS: Mechanic[] = [
  {
    id: 'mec-001',
    fullName: 'Boubacar Sidibe',
    workshopName: 'Garage Sidibe Auto',
    phone: '+221 77 300 44 55',
    email: 'boubacar.sidibe@garage-sidibe.sn',
    avatarUrl: 'assets/images/avatars/mec-1.png',
    specialties: ['Mécanique générale', 'Diagnostic électronique', 'Freinage'],
    ...computeStats(mec001Reviews),
    isAvailable: true,
    isVerified: true,
    address: 'Dakar Plateau, Avenue Lamine Guèye, Dakar',
    location: { latitude: 14.6708, longitude: -17.4373 },
    reviews: mec001Reviews,
  },
  {
    id: 'mec-002',
    fullName: 'Mame Goumba Amar',
    workshopName: 'Atelier Amar Dépannage',
    phone: '+221 77 400 55 66',
    email: 'goumba.amar@amar-depannage.sn',
    avatarUrl: 'assets/images/avatars/mec-2.png',
    specialties: ['Climatisation auto', 'Pneumatique', 'Électricité auto'],
    ...computeStats(mec002Reviews),
    isAvailable: true,
    isVerified: true,
    address: 'Keur Massar, Route de Rufisque, Dakar',
    location: { latitude: 14.7743, longitude: -17.3142 },
    reviews: mec002Reviews,
  },
  {
    id: 'mec-003',
    fullName: 'Awa Ndiaye',
    workshopName: 'Quick Fix Dakar',
    phone: '+221 77 500 66 77',
    email: 'awa.ndiaye@quickfix.sn',
    avatarUrl: 'assets/images/avatars/mec-3.png',
    specialties: ['Batterie', 'Diagnostic électronique', 'Dépannage rapide'],
    ...computeStats(mec003Reviews),
    isAvailable: false,
    isVerified: true,
    address: 'Point E, Rue de Thiès, Dakar',
    location: { latitude: 14.6962, longitude: -17.4591 },
    reviews: mec003Reviews,
  },
  {
    id: 'mec-004',
    fullName: 'Ibrahima Fall',
    workshopName: 'Elite Auto Care',
    phone: '+221 77 600 77 88',
    email: 'ibrahima.fall@eliteauto.sn',
    avatarUrl: 'assets/images/avatars/mec-4.png',
    specialties: ['Véhicules premium', 'Detailing', 'Suspension'],
    ...computeStats(mec004Reviews),
    isAvailable: true,
    isVerified: true,
    address: 'Almadies, Route du Méridien, Dakar',
    location: { latitude: 14.7409, longitude: -17.5124 },
    reviews: mec004Reviews,
  },
  {
    id: 'mec-005',
    fullName: 'Algassiomou Ba',
    workshopName: 'Garage Ba Services',
    phone: '+221 77 700 88 99',
    email: 'algassiomou.ba@garageba.sn',
    avatarUrl: 'assets/images/avatars/mec-5.png',
    specialties: ['Vidange', 'Mécanique générale', 'Contrôle moteur'],
    ...computeStats(mec005Reviews),
    isAvailable: true,
    isVerified: true,
    address: 'Médina, Rue 22, Dakar',
    location: { latitude: 14.6849, longitude: -17.4527 },
    reviews: mec005Reviews,
  },
  {
    id: 'mec-006',
    fullName: 'Mouhammad Boye',
    workshopName: 'Boye Auto Diagnostic',
    phone: '+221 77 800 99 10',
    email: 'mouhammad.boye@boyediag.sn',
    avatarUrl: 'assets/images/avatars/mec-6.png',
    specialties: ['Diagnostic électronique', 'Injection', 'Électricité auto'],
    ...computeStats(mec006Reviews),
    isAvailable: true,
    isVerified: false,
    address: "Grand Yoff, Route de l'Aéroport, Dakar",
    location: { latitude: 14.7385, longitude: -17.4628 },
    reviews: mec006Reviews,
  },
  {
    id: 'mec-007',
    fullName: 'Aissatou Badji',
    workshopName: 'Badji Auto Express',
    phone: '+221 77 900 10 11',
    email: 'aissatou.badji@badjiauto.sn',
    avatarUrl: 'assets/images/avatars/mec-7.png',
    specialties: ['Freinage', 'Pneumatique', 'Dépannage rapide'],
    ...computeStats(mec007Reviews),
    isAvailable: false,
    isVerified: true,
    address: 'Sacré-Cœur 3, VDN, Dakar',
    location: { latitude: 14.7218, longitude: -17.4742 },
    reviews: mec007Reviews,
  },
];
