import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BookingSummary, PaymentResult } from '../../models/booking.model';
import { PaymentResultCard } from './payment-result';

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
  serviceLabel: 'Diagnostic et remplacement de batterie',
  durationLabel: '1 h 45',
  address: 'Rue 10 x Corniche, Dakar Plateau',
  scheduledAt: '2026-09-02T09:30:00',
  price: {
    lines: [{ label: 'Diagnostic', amountXOF: 22500 }],
    totalXOF: 22500,
  },
};

const REUSSI: PaymentResult = {
  status: 'reussi',
  reference: 'AP-2026-0412-7731',
  paidAt: '2026-09-02T09:30:00',
  failureReason: null,
};

const ECHOUE: PaymentResult = {
  status: 'echoue',
  reference: null,
  paidAt: null,
  failureReason: "Votre banque a refusé l'opération.",
};

describe('PaymentResultCard', () => {
  let fixture: ComponentFixture<PaymentResultCard>;
  let reessais: number;
  let factures: number;

  const rendre = async (result: PaymentResult): Promise<void> => {
    fixture = TestBed.createComponent(PaymentResultCard);
    fixture.componentRef.setInput('result', result);
    fixture.componentRef.setInput('booking', RESERVATION);

    reessais = 0;
    factures = 0;
    fixture.componentInstance.retryRequested.subscribe(() => (reessais += 1));
    fixture.componentInstance.invoiceRequested.subscribe(() => (factures += 1));

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentResultCard],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('annonce le succès en toutes lettres, pas seulement par la couleur', async () => {
    await rendre(REUSSI);

    expect(hote().textContent).toContain('Paiement réussi');
    expect(hote().className).toContain('ap-result--ok');
  });

  it('compose un reçu complet', async () => {
    await rendre(REUSSI);

    const texte = hote().textContent ?? '';

    expect(texte).toContain('AP-2026-0412-7731');
    expect(texte).toContain('Samba Fall');
    expect(texte).toContain('Diagnostic et remplacement de batterie');
    expect(texte).toContain('1 h 45');
    expect(texte).toContain('Toyota Corolla 2015');
    expect(texte).toContain('22 500 FCFA');
  });

  it('date le reçu avec l’horodatage du serveur', async () => {
    await rendre(REUSSI);

    // Et non l'horloge du navigateur, qui peut être fausse.
    expect(hote().textContent).toContain('2 septembre 2026');
  });

  it('propose de télécharger la facture', async () => {
    await rendre(REUSSI);

    (hote().querySelector('button') as HTMLButtonElement).click();

    expect(factures).toBe(1);
  });

  it('donne le MOTIF du refus', async () => {
    await rendre(ECHOUE);

    // « Le paiement a échoué » sans explication laisse le client sans recours.
    expect(hote().textContent).toContain("Votre banque a refusé l'opération.");
    expect(hote().textContent).toContain("Aucun montant n'a été débité");
  });

  it('ne compose aucun reçu sur un échec', async () => {
    await rendre(ECHOUE);

    // Un reçu atteste d'un paiement : il n'a pas lieu d'être ici.
    expect(hote().querySelector('.ap-result__receipt')).toBeNull();
    expect(hote().textContent).not.toContain('AP-2026-0412-7731');
  });

  it('propose de choisir un autre moyen après un refus', async () => {
    await rendre(ECHOUE);

    (hote().querySelector('button') as HTMLButtonElement).click();

    expect(reessais).toBe(1);
  });

  it('ne propose pas de réessayer après un succès', async () => {
    await rendre(REUSSI);

    expect(reessais).toBe(0);
    expect(hote().textContent).not.toContain('Choisir un autre moyen');
  });
});
