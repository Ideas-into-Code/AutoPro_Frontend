import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { separerMilliers } from '@shared/utils/format-number';
import { Observable, concat, delay, of } from 'rxjs';

import {
  BookingSummary,
  PaymentMethod,
  PaymentMethodId,
  PaymentResult,
} from '../models/booking.model';
import {
  BookingRepository,
  InvoiceRepository,
  PaymentMethodRepository,
  PaymentRepository,
} from './booking.repository';
import { composerPdf } from './invoice-pdf';

/** Réservation de démonstration, telle qu'elle attend la réponse du mécanicien. */
const RESERVATION: BookingSummary = {
  id: 'bk-2026-0412',
  status: 'en_attente',
  mechanic: {
    id: 'mec-014',
    fullName: 'Samba Fall',
    specialty: 'Diagnostic électronique',
    ratingAverage: 4.7,
  },
  vehicle: 'Toyota Corolla 2015',
  problemLabel: 'Batterie déchargée',
  serviceLabel: 'Diagnostic et remplacement de batterie',
  durationLabel: '1 h 45',
  address: 'Rue 10 x Corniche, Dakar Plateau',
  scheduledAt: '2026-09-02T09:30:00',
  price: {
    lines: [
      { label: 'Diagnostic et remplacement', amountXOF: 18000 },
      { label: 'Déplacement (4,2 km)', amountXOF: 3500 },
      { label: 'Frais de service', amountXOF: 1000 },
      { label: 'TVA (18 %)', amountXOF: 4050 },
    ],
    totalXOF: 26550,
  },
};

const MOYENS: readonly PaymentMethod[] = [
  {
    id: 'wave',
    label: 'Wave',
    hint: "Vous serez redirigé vers l'application Wave.",
    logoUrl: '/images/paiement/wave.png',
    available: true,
  },
  {
    id: 'max-it',
    label: 'Max it',
    hint: "L'application Orange. Un code de confirmation vous sera envoyé par SMS.",
    logoUrl: '/images/paiement/max-it.png',
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

/** Délai au bout duquel le mécanicien simulé accepte la demande. */
const DELAI_ACCEPTATION = 6000;

export class MockBookingRepository extends BookingRepository {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Émet **deux fois** : la demande en attente, puis la même une fois acceptée.
   *
   * C'est le comportement du vrai service, qui poussera l'acceptation au fil de
   * l'eau. Un unique état figé aurait laissé croire que l'écran doit être
   * rechargé à la main, et l'attente — le moment où le client ne sait pas
   * encore s'il sera dépanné — n'aurait jamais été éprouvée.
   */
  current(): Observable<BookingSummary> {
    const enAttente = of(RESERVATION);

    if (!isPlatformBrowser(this.platformId)) {
      // Le rendu serveur ne reçoit que le premier état : attendre la suite
      // figerait la génération de la page pendant six secondes.
      return enAttente;
    }

    return concat(
      enAttente.pipe(delay(400)),
      of({ ...RESERVATION, status: 'acceptee' as const }).pipe(delay(DELAI_ACCEPTATION)),
    );
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
      paidAt: null,
      failureReason: "Votre banque a refusé l'opération. Essayez Wave ou Orange Money.",
    };

    const succes: PaymentResult = {
      status: 'reussi',
      reference: 'AP-2026-0412-7731',
      paidAt: RESERVATION.scheduledAt,
      failureReason: null,
    };

    // 1,2 s : un paiement instantané n'inspire pas confiance, et l'attente
    // rend l'état de chargement visible au lieu de le faire clignoter.
    return simuler(method === 'carte' ? echec : succes, this.platformId, 1200);
  }
}

/**
 * Facture simulée.
 *
 * Compose un vrai PDF, et non un texte renommé : le fichier doit s'ouvrir
 * dans un lecteur, sans quoi le bouton de téléchargement n'est pas vraiment
 * éprouvé. Voir `invoice-pdf.ts` pour la raison du format écrit à la main.
 */
export class MockInvoiceRepository extends InvoiceRepository {
  private readonly platformId = inject(PLATFORM_ID);

  download(bookingId: string): Observable<Blob> {
    const lignes = [
      'AutoPro - Facture',
      '',
      `Reference : ${bookingId}`,
      `Mecanicien : ${RESERVATION.mechanic.fullName}`,
      `Prestation : ${RESERVATION.serviceLabel}`,
      `Vehicule : ${RESERVATION.vehicle}`,
      `Duree : ${RESERVATION.durationLabel}`,
      '',
      'Detail du prix',
      ...RESERVATION.price.lines.map(
        (ligne) => `  ${ligne.label} : ${separerMilliers(ligne.amountXOF)} FCFA`,
      ),
      '',
      `Total paye : ${separerMilliers(RESERVATION.price.totalXOF)} FCFA`,
    ];

    return simuler(composerPdf(lignes), this.platformId, 600);
  }
}
