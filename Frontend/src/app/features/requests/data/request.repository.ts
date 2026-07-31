import { Observable } from 'rxjs';

import { InterventionRequest } from '../models/request.model';
import { InterventionRequestDraft } from '../models/request-draft.model';

/**
 * Envoi et consultation des demandes d'intervention.
 *
 * N'expose **que** la création : consulter et annuler viendront avec les
 * tickets correspondants. Déclarer dès maintenant un `delete()` que personne
 * n'appelle obligerait chaque implémentation à le remplir ou à le laisser vide
 * (principe de ségrégation des interfaces).
 *
 * Le formulaire dépend de cette classe abstraite, jamais d'une implémentation :
 * il enverra sa demande au vrai backend sans qu'une seule de ses lignes change.
 */
export abstract class RequestRepository {
  /**
   * Crée une demande et renvoie celle enregistrée par le serveur — avec son
   * identifiant, son statut et son estimation tarifaire, que le client ne
   * fournit pas.
   */
  abstract create(draft: InterventionRequestDraft): Observable<InterventionRequest>;
}
