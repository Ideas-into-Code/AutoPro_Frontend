import { Observable } from 'rxjs';

import { ReviewDraft, ReviewTarget } from '../models/review.model';

/**
 * Dépôts du domaine « Avis ».
 *
 * Deux contrats : l'un lit l'intervention à noter, l'autre envoie l'avis. Les
 * réunir obligerait un futur écran de consultation — la liste des avis d'un
 * mécanicien — à hériter d'une méthode d'écriture dont il n'a que faire
 * (ségrégation des interfaces).
 */

/** Intervention terminée en attente d'un avis. */
export abstract class ReviewTargetRepository {
  abstract pending(): Observable<ReviewTarget>;
}

/** Envoi de l'avis, photos comprises. */
export abstract class ReviewSubmissionRepository {
  abstract submit(draft: ReviewDraft): Observable<void>;
}
