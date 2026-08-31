import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PaymentResult } from '../../models/booking.model';
import { PaymentResultCard } from './payment-result';

const REUSSI: PaymentResult = {
  status: 'reussi',
  reference: 'WV-2026-0412-7731',
  failureReason: null,
};

const ECHOUE: PaymentResult = {
  status: 'echoue',
  reference: null,
  failureReason: "Votre banque a refusé l'opération.",
};

describe('PaymentResultCard', () => {
  let fixture: ComponentFixture<PaymentResultCard>;
  let reessais: number;

  const rendre = async (result: PaymentResult): Promise<void> => {
    fixture = TestBed.createComponent(PaymentResultCard);
    fixture.componentRef.setInput('result', result);
    fixture.componentRef.setInput('amountXOF', 22500);

    reessais = 0;
    fixture.componentInstance.retryRequested.subscribe(() => (reessais += 1));

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

    expect(hote().textContent).toContain('Paiement confirmé');
    expect(hote().className).toContain('ap-result--ok');
  });

  it('affiche la référence de transaction et le montant', async () => {
    await rendre(REUSSI);

    expect(hote().textContent).toContain('WV-2026-0412-7731');
    expect(hote().textContent).toContain('22 500 FCFA');
  });

  it('donne le MOTIF du refus', async () => {
    await rendre(ECHOUE);

    // « Le paiement a échoué » sans explication laisse le client sans recours.
    expect(hote().textContent).toContain("Votre banque a refusé l'opération.");
    expect(hote().textContent).toContain("Aucun montant n'a été débité");
  });

  it('ne montre aucune référence sur un échec', async () => {
    await rendre(ECHOUE);

    expect(hote().querySelector('.ap-result__reference')).toBeNull();
  });

  it('propose de choisir un autre moyen après un refus', async () => {
    await rendre(ECHOUE);

    (hote().querySelector('button') as HTMLButtonElement).click();

    expect(reessais).toBe(1);
  });

  it('ne propose pas de réessayer après un succès', async () => {
    await rendre(REUSSI);

    expect(hote().querySelector('button')).toBeNull();
  });
});
