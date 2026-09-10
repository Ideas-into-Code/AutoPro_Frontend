import { Observable } from 'rxjs';

import { ReviewDraft, ReviewTarget } from '../models/review.model';

/**
 * Dépôts du domaine « Avis ».
 *
 * Deux contrats : l'un identifie le mécanicien à noter, l'autre envoie l'avis.
 * Les réunir obligerait un futur écran en lecture seule — la liste des avis
 * reçus — à hériter d'une méthode d'écriture dont il n'a que faire (ségrégation
 * des interfaces).
 */

/** Le mécanicien visé par l'avis, résolu depuis son id. */
export abstract class ReviewTargetRepository {
  abstract forMechanic(mechanicId: string): Observable<ReviewTarget>;
}

/** Envoi de l'avis. */
export abstract class ReviewSubmissionRepository {
  abstract submit(draft: ReviewDraft): Observable<void>;
}
