import { Observable } from 'rxjs';

import {
  BookingSummary,
  PaymentMethod,
  PaymentMethodId,
  PaymentResult,
} from '../models/booking.model';

/**
 * Dépôts du tunnel de réservation.
 *
 * Trois contrats et non un seul, parce qu'un seul des trois **écrit**. Le
 * récapitulatif et la liste des moyens de paiement sont de la lecture pure ;
 * seul `PaymentRepository` engage de l'argent. Les réunir obligerait un futur
 * écran en lecture seule — un justificatif, un historique — à hériter d'une
 * méthode qui débite (ségrégation des interfaces).
 *
 * Chaque dépôt est une classe abstraite, donc contrat **et** jeton d'injection
 * à la fois, comme partout ailleurs dans le projet.
 */

/** Lecture de la réservation en cours. */
export abstract class BookingRepository {
  abstract current(): Observable<BookingSummary>;
}

/** Moyens de paiement proposés pour cette réservation. */
export abstract class PaymentMethodRepository {
  abstract available(): Observable<readonly PaymentMethod[]>;
}

/**
 * Déclenchement du paiement.
 *
 * Renvoie un `PaymentResult` plutôt que de lever une erreur sur un refus : un
 * solde insuffisant n'est pas une panne, c'est une **réponse** du service, et
 * l'écran doit pouvoir l'afficher sans passer par son traitement d'exception.
 * Les vraies pannes — réseau coupé, service injoignable — restent des erreurs.
 */
export abstract class PaymentRepository {
  abstract pay(bookingId: string, method: PaymentMethodId): Observable<PaymentResult>;
}
