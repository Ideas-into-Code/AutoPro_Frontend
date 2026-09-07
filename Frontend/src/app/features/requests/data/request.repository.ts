import { Observable } from 'rxjs';

import { InterventionRequest } from '../models/request.model';
import { InterventionRequestDraft } from '../models/request-draft.model';

/**
 * Envoi et consultation des demandes d'intervention du client.
 *
 * Le formulaire et les écrans dépendent de cette classe abstraite, jamais d'une
 * implémentation : ils s'adressent au vrai backend sans qu'une seule de leurs
 * lignes change.
 */
export abstract class RequestRepository {
  /**
   * Crée une demande et renvoie celle enregistrée par le serveur — avec son
   * identifiant et son statut, que le client ne fournit pas.
   */
  abstract create(draft: InterventionRequestDraft): Observable<InterventionRequest>;

  /** Les demandes du client courant, la plus récente d'abord. */
  abstract list(): Observable<readonly InterventionRequest[]>;

  /** Une demande par son identifiant. */
  abstract findById(id: string): Observable<InterventionRequest>;

  /** Annule une demande. Seul le client propriétaire peut le faire. */
  abstract cancel(id: string): Observable<InterventionRequest>;
}
