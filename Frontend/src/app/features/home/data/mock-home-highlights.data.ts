import { NearbyMechanic, RecentRequest } from '../models/home-cards.model';

/**
 * Contenu de démonstration des deux bandeaux du bas de l'accueil.
 *
 * Il vivait auparavant dans `home.ts`, alimenté par un
 * `import { MOCK_MECHANICS } from '@features/mechanics/...'`. Deux problèmes :
 *
 *   - une feature en importait une autre, ce que la règle de dépendance
 *     interdit (CONVENTIONS.md §1) ;
 *   - l'écran lisait un tableau concret au lieu de passer par un dépôt, si
 *     bien que l'arrivée du backend l'aurait laissé sur des données figées.
 *
 * Ces valeurs sont donc **provisoires et assumées comme telles** : elles
 * disparaîtront au profit d'un `HomeHighlightsRepository` le jour où les
 * microservices « mechanics » et « requests » exposeront un résumé. En
 * attendant, elles restent chez l'accueil, qui est seul à s'en servir.
 */

export const MOCK_NEARBY_MECHANICS: readonly NearbyMechanic[] = [
  {
    id: 'mec-001',
    name: 'Boubacar Sidibe',
    district: 'Dakar Plateau',
    distance: '0.8 km',
    rating: 4.9,
    tags: ['Mécanique générale', 'Diagnostic électronique'],
  },
  {
    id: 'mec-002',
    name: 'Mame Goumba Amar',
    district: 'Keur Massar',
    distance: '2.4 km',
    rating: 4.8,
    tags: ['Climatisation auto', 'Pneumatique'],
  },
  {
    id: 'mec-003',
    name: 'Ousmane Diallo',
    district: 'Ouakam',
    distance: '3.1 km',
    rating: 4.7,
    tags: ['Freinage', 'Suspension'],
  },
];

export const MOCK_RECENT_REQUESTS: readonly RecentRequest[] = [
  {
    id: 'req-1',
    label: 'Inspection complète',
    date: 'Prévu le 24 oct. à 10h00',
    icon: 'build',
    color: 'primary',
    status: 'pending',
    statusLabel: 'Confirmé',
  },
  {
    id: 'req-2',
    label: 'Vidange moteur',
    date: 'Terminé le 12 oct.',
    icon: 'oil_barrel',
    color: 'warning',
    status: 'done',
    statusLabel: 'Terminé',
  },
];
