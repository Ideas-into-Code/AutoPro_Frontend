import { Observable } from 'rxjs';

import { NearbyMechanic, RecentRequest } from '../models/home-cards.model';

/**
 * Résumés affichés en bas de l'accueil : mécaniciens disponibles à proximité et
 * dernières demandes de l'utilisateur.
 *
 * L'accueil est un écran d'**agrégation** — il ne relève d'aucun microservice
 * et n'importe aucune autre feature. Ce dépôt fait donc lui-même les deux
 * appels (`/api/mechanics/nearby`, `/api/service-requests`) et les réduit aux
 * vignettes de la page.
 *
 * Classe abstraite = contrat + jeton d'injection.
 */
export abstract class HomeHighlightsRepository {
  /** Mécaniciens disponibles autour de Dakar, limités à quelques cartes. */
  abstract nearbyMechanics(): Observable<readonly NearbyMechanic[]>;

  /**
   * Dernières demandes du client connecté. Liste vide s'il n'est pas connecté —
   * l'accueil est public et souvent prérendu.
   */
  abstract recentRequests(): Observable<readonly RecentRequest[]>;
}
