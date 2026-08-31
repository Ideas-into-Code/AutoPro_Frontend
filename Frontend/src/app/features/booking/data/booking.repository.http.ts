import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '@core';
import {
  BookingSummary,
  PaymentMethod,
  PaymentMethodId,
  PaymentResult,
} from '../models/booking.model';
import {
  BookingRepository,
  PaymentMethodRepository,
  PaymentRepository,
} from './booking.repository';

/**
 * Implémentations réelles, à fournir à la place des versions simulées lorsque
 * les microservices répondront — trois lignes à changer dans `booking.routes.ts`,
 * et rien d'autre dans les écrans.
 *
 * Les adresses suivent le découpage du **backend** et non celui du tunnel : la
 * réservation relève de `requests`, le paiement de `payments`. C'est bien
 * pourquoi les écrans ne les connaissent pas.
 *
 * Le nom du service de paiement est la seule inconnue à confirmer avec
 * l'équipe backend ; il se change en un endroit, `api.config.ts`.
 */
export class HttpBookingRepository extends BookingRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  current(): Observable<BookingSummary> {
    return this.http.get<BookingSummary>(
      buildServiceUrl(this.config, 'requests', 'bookings/current'),
    );
  }
}

export class HttpPaymentMethodRepository extends PaymentMethodRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  available(): Observable<readonly PaymentMethod[]> {
    return this.http.get<readonly PaymentMethod[]>(
      buildServiceUrl(this.config, 'payments', 'methods'),
    );
  }
}

export class HttpPaymentRepository extends PaymentRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  pay(bookingId: string, method: PaymentMethodId): Observable<PaymentResult> {
    return this.http.post<PaymentResult>(buildServiceUrl(this.config, 'payments', 'charges'), {
      bookingId,
      method,
    });
  }
}
