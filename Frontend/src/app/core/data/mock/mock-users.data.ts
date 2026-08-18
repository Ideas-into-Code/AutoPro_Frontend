import { User } from '../../models/user.model';

export const MOCK_USERS: User[] = [
  // --- CLIENTS ---
  {
    id: 'usr-client-01',
    fullName: 'Mohamed El Fadel Badji',
    email: 'mohamed.badji@example.sn',
    phone: '+221 77 100 22 33',
    role: 'client',
    avatarUrl: 'assets/images/avatars/client-1.png',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'usr-client-02',
    fullName: 'Halima Lena Camara',
    email: 'halima.camara@example.sn',
    phone: '+221 77 200 33 44',
    role: 'client',
    avatarUrl: 'assets/images/avatars/client-2.png',
    createdAt: '2026-02-10T11:20:00Z',
  },

  // --- MÉCANICIENS ---
  {
    id: 'usr-mec-01',
    fullName: 'Boubacar Sidibe',
    email: 'boubacar.sidibe@garage-sidibe.sn',
    phone: '+221 77 300 44 55',
    role: 'mecanicien',
    workshopName: 'Garage Sidibe Auto',
    avatarUrl: 'assets/images/avatars/mec-1.png',
    createdAt: '2026-01-20T14:30:00Z',
  },
  {
    id: 'usr-mec-02',
    fullName: 'Mame Goumba Amar',
    email: 'goumba.amar@amar-depannage.sn',
    phone: '+221 77 400 55 66',
    role: 'mecanicien',
    workshopName: 'Atelier Amar Dépannage',
    avatarUrl: 'assets/images/avatars/mec-2.png',
    createdAt: '2026-02-01T09:00:00Z',
  },
];
