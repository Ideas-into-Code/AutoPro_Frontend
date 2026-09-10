import { Observable } from 'rxjs';

import { Vehicle, VehicleDraft } from '../models/vehicle.model';

/**
 * Accès au parc de véhicules de l'utilisateur connecté.
 *
 * Classe abstraite = contrat + jeton d'injection. Fournie dans `provideCore()`
 * plutôt qu'au niveau d'une route : deux zones de l'application en dépendent
 * (l'écran « Mes véhicules » et le formulaire de signalement).
 */
export abstract class VehicleRepository {
  abstract list(): Observable<readonly Vehicle[]>;
  abstract create(draft: VehicleDraft): Observable<Vehicle>;
  abstract update(id: string, draft: VehicleDraft): Observable<Vehicle>;
  abstract remove(id: string): Observable<void>;
}
