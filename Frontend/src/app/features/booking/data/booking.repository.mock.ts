import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, delay, of } from 'rxjs';

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

/** Réservation de démonstration. */
const RESERVATION: BookingSummary = {
  id: 'bk-2026-0412',
  mechanic: {
    id: 'mec-014',
    fullName: 'Samba Fall',
    specialty: 'Diagnostic électronique',
    ratingAverage: 4.7,
  },
  vehicle: 'Toyota Corolla 2015',
  problemLabel: 'Batterie déchargée',
  address: 'Rue 10 x Corniche, Dakar Plateau',
  scheduledAt: '2026-09-02T09:30:00',
  price: {
    lines: [
      { label: 'Diagnostic et remplacement', amountXOF: 18000 },
      { label: 'Déplacement (4,2 km)', amountXOF: 3500 },
      { label: 'Frais de service', amountXOF: 1000 },
    ],
    totalXOF: 22500,
  },
};

const MOYENS: readonly PaymentMethod[] = [
  {
    id: 'wave',
    label: 'Wave',
    hint: "Vous serez redirigé vers l'application Wave.",
    available: true,
  },
  {
    id: 'orange-money',
    label: 'Orange Money',
    hint: 'Un code de confirmation vous sera envoyé par SMS.',
    available: true,
  },
  {
    id: 'carte',
    label: 'Carte bancaire',
    hint: 'Visa et Mastercard acceptées.',
    available: false,
  },
];

/**
 * Latence artificielle, dans le navigateur seulement.
 * L'appliquer au rendu serveur figerait la page prérendue sur son état de
 * chargement — même règle que les autres dépôts simulés du projet.
 */
function simuler<T>(valeur: T, platformId: object, ms = 400): Observable<T> {
  const reponse = of(valeur);

  return isPlatformBrowser(platformId) ? reponse.pipe(delay(ms)) : reponse;
}

export class MockBookingRepository extends BookingRepository {
  private readonly platformId = inject(PLATFORM_ID);

  current(): Observable<BookingSummary> {
    return simuler(RESERVATION, this.platformId);
  }
}

export class MockPaymentMethodRepository extends PaymentMethodRepository {
  private readonly platformId = inject(PLATFORM_ID);

  available(): Observable<readonly PaymentMethod[]> {
    return simuler(MOYENS, this.platformId, 300);
  }
}

/**
 * Paiement simulé.
 *
 * La carte bancaire échoue volontairement : sans un chemin d'échec accessible,
 * l'écran de refus ne serait jamais vu avant la mise en production, et c'est
 * précisément celui qu'il faut avoir éprouvé.
 */
export class MockPaymentRepository extends PaymentRepository {
  private readonly platformId = inject(PLATFORM_ID);

  pay(_bookingId: string, method: PaymentMethodId): Observable<PaymentResult> {
    const echec: PaymentResult = {
      status: 'echoue',
      reference: null,
      failureReason: "Votre banque a refusé l'opération. Essayez Wave ou Orange Money.",
    };

    const succes: PaymentResult = {
      status: 'reussi',
      reference: 'WV-2026-0412-7731',
      failureReason: null,
    };

    // 1,2 s : un paiement instantané n'inspire pas confiance, et l'attente
    // rend l'état de chargement visible au lieu de le faire clignoter.
    return simuler(method === 'carte' ? echec : succes, this.platformId, 1200);
  }
}
