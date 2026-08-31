import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import {
  BookingSummary,
  PaymentMethod,
  PaymentMethodId,
  PaymentResult,
} from '../../models/booking.model';
import {
  BookingRepository,
  PaymentMethodRepository,
  PaymentRepository,
} from '../../data/booking.repository';
import { PaymentPage } from './payment';

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
    lines: [{ label: 'Diagnostic', amountXOF: 22500 }],
    totalXOF: 22500,
  },
};

const MOYENS: readonly PaymentMethod[] = [
  { id: 'wave', label: 'Wave', hint: 'Via Wave.', available: true },
  { id: 'carte', label: 'Carte bancaire', hint: 'Visa.', available: true },
];

class FauxBooking extends BookingRepository {
  current(): Observable<BookingSummary> {
    return of(RESERVATION);
  }
}

class FauxMoyens extends PaymentMethodRepository {
  available(): Observable<readonly PaymentMethod[]> {
    return of(MOYENS);
  }
}

class FauxPaiement extends PaymentRepository {
  appels: { bookingId: string; method: PaymentMethodId }[] = [];

  /** Réponse que le service est censé renvoyer, ou `null` pour simuler une panne. */
  reponse: PaymentResult | null = {
    status: 'reussi',
    reference: 'WV-2026-0412-7731',
    failureReason: null,
  };

  pay(bookingId: string, method: PaymentMethodId): Observable<PaymentResult> {
    this.appels.push({ bookingId, method });

    return this.reponse === null ? throwError(() => new Error('réseau')) : of(this.reponse);
  }
}

describe('PaymentPage', () => {
  let fixture: ComponentFixture<PaymentPage>;
  let paiement: FauxPaiement;

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const bouton = (libelle: string): HTMLButtonElement | undefined =>
    [...hote().querySelectorAll('button')].find((b) => b.textContent?.includes(libelle));

  const radio = (index: number): HTMLInputElement =>
    hote().querySelectorAll<HTMLInputElement>('input[type="radio"]')[index];

  const rendre = async (): Promise<void> => {
    fixture = TestBed.createComponent(PaymentPage);
    await fixture.whenStable();
  };

  const payerAvec = async (index: number): Promise<void> => {
    radio(index).click();
    fixture.detectChanges();
    bouton('Payer')?.click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    paiement = new FauxPaiement();

    await TestBed.configureTestingModule({
      imports: [PaymentPage],
      providers: [
        provideRouter([]),
        { provide: BookingRepository, useClass: FauxBooking },
        { provide: PaymentMethodRepository, useClass: FauxMoyens },
        { provide: PaymentRepository, useValue: paiement },
      ],
    }).compileComponents();
  });

  it('rappelle le montant à régler', async () => {
    await rendre();

    expect(hote().textContent).toContain('22 500 FCFA');
  });

  it('interdit de payer tant qu’aucun moyen n’est retenu', async () => {
    await rendre();

    // Proposer « Payer » sans savoir avec quoi mène à une erreur évitable.
    expect(bouton('Payer')?.disabled).toBe(true);
  });

  it('transmet la réservation et le moyen retenus', async () => {
    await rendre();

    await payerAvec(0);

    expect(paiement.appels).toEqual([{ bookingId: 'bk-2026-0412', method: 'wave' }]);
  });

  it('remplace le choix par l’issue une fois le paiement rendu', async () => {
    await rendre();

    await payerAvec(0);

    expect(hote().textContent).toContain('Paiement confirmé');
    // Le choix a disparu : il n'a plus d'objet.
    expect(hote().querySelector('app-payment-method-picker')).toBeNull();
  });

  it('affiche un refus comme une réponse, pas comme une panne', async () => {
    paiement.reponse = {
      status: 'echoue',
      reference: null,
      failureReason: 'Solde insuffisant.',
    };
    await rendre();

    await payerAvec(1);

    expect(hote().textContent).toContain("Le paiement n'a pas abouti");
    expect(hote().textContent).toContain('Solde insuffisant.');
  });

  it('distingue une panne réseau d’un refus', async () => {
    paiement.reponse = null;
    await rendre();

    await payerAvec(0);

    // Rien n'a été tenté : dire « paiement refusé » serait faux.
    expect(hote().querySelector('[role="alert"]')?.textContent).toContain("n'a pas pu être lancé");
    expect(hote().textContent).not.toContain("Le paiement n'a pas abouti");
    // Le choix reste à l'écran, le client réessaie sans repartir de zéro.
    expect(hote().querySelector('app-payment-method-picker')).not.toBeNull();
  });

  it('ramène au choix après un refus', async () => {
    paiement.reponse = { status: 'echoue', reference: null, failureReason: 'Refus.' };
    await rendre();
    await payerAvec(1);

    bouton('Choisir un autre moyen')?.click();
    await fixture.whenStable();

    expect(hote().querySelector('app-payment-method-picker')).not.toBeNull();
    // Le moyen refusé n'est plus présélectionné : le reproposer d'un clic
    // conduirait au même refus.
    expect(radio(1).checked).toBe(false);
  });
});
