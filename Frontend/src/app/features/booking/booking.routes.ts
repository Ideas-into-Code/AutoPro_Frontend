import { Routes } from '@angular/router';

import {
  BookingRepository,
  InvoiceRepository,
  PaymentMethodRepository,
  PaymentRepository,
} from './data/booking.repository';
import {
  MockBookingRepository,
  MockInvoiceRepository,
  MockPaymentMethodRepository,
  MockPaymentRepository,
} from './data/booking.repository.mock';

/**
 * Routes du tunnel de réservation : récapitulatif puis paiement.
 *
 * Deux routes et non une seule avec un état interne : revenir en arrière depuis
 * le paiement doit ramener au récapitulatif, ce que seul le routeur sait faire.
 */
export const bookingRoutes: Routes = [
  {
    path: '',

    /**
     * POINT DE BASCULE DU TUNNEL DE RÉSERVATION.
     *
     * Le jour où les microservices répondent, ces quatre lignes deviennent leurs
     * équivalents `Http…`, déjà écrits dans `data/booking.repository.http.ts` :
     *
     *   { provide: BookingRepository, useClass: HttpBookingRepository },
     *   { provide: PaymentMethodRepository, useClass: HttpPaymentMethodRepository },
     *   { provide: PaymentRepository, useClass: HttpPaymentRepository },
     *   { provide: InvoiceRepository, useClass: HttpInvoiceRepository },
     *
     * Aucun composant ne bouge.
     *
     * Fournis sur la route et non globalement : seul ce domaine s'en sert, et
     * les données simulées restent ainsi hors du bundle initial.
     */
    providers: [
      { provide: BookingRepository, useClass: MockBookingRepository },
      { provide: PaymentMethodRepository, useClass: MockPaymentMethodRepository },
      { provide: PaymentRepository, useClass: MockPaymentRepository },
      { provide: InvoiceRepository, useClass: MockInvoiceRepository },
    ],

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/booking-recap/booking-recap').then((m) => m.BookingRecapPage),
        title: 'Récapitulatif de réservation — AutoPro',
      },
      {
        path: 'paiement',
        loadComponent: () => import('./pages/payment/payment').then((m) => m.PaymentPage),
        title: 'Paiement — AutoPro',
      },
    ],
  },
];
