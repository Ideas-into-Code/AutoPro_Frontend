import { Observable } from 'rxjs';

import { NearbyMechanic, NearbyMechanicQuery } from '../models/nearby-mechanic.model';

/**
 * Recherche géospatiale de mécaniciens.
 *
 * Classe abstraite = contrat + jeton d'injection. Fournie dans `provideCore()`
 * et non par route : la carte interactive (`/carte`) et le bandeau de l'accueil
 * s'en servent toutes les deux, et une feature ne peut pas en importer une
 * autre.
 */
export abstract class NearbyMechanicRepository {
  abstract findNearby(query: NearbyMechanicQuery): Observable<readonly NearbyMechanic[]>;
}
