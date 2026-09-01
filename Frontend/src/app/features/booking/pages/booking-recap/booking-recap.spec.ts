import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';

import { BookingRepository } from '../../data/booking.repository';
import { BookingStatus, BookingSummary } from '../../models/booking.model';
import { BookingRecapPage } from './booking-recap';

const RESERVATION: BookingSummary = {
  id: 'bk-2026-0412',
  status: 'acceptee',
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

class FauxBooking extends BookingRepository {
  reservation: BookingSummary = RESERVATION;

  current(): Observable<BookingSummary> {
    return of(this.reservation);
  }
}

describe('BookingRecapPage', () => {
  let fixture: ComponentFixture<BookingRecapPage>;
  let reservations: FauxBooking;

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const lienPaiement = (): HTMLAnchorElement | undefined =>
    [...hote().querySelectorAll('a')].find(
      (a) => a.getAttribute('href') === '/reservation/paiement',
    );

  const rendre = async (status: BookingStatus): Promise<void> => {
    reservations.reservation = { ...RESERVATION, status };
    fixture = TestBed.createComponent(BookingRecapPage);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    reservations = new FauxBooking();

    await TestBed.configureTestingModule({
      imports: [BookingRecapPage],
      providers: [provideRouter([]), { provide: BookingRepository, useValue: reservations }],
    }).compileComponents();
  });

  it('récapitule la réservation', async () => {
    await rendre('acceptee');

    const texte = hote().textContent ?? '';

    expect(texte).toContain('Samba Fall');
    expect(texte).toContain('Toyota Corolla 2015');
    expect(texte).toContain('Batterie déchargée');
    expect(texte).toContain('Rue 10 x Corniche, Dakar Plateau');
  });

  it('ouvre le paiement une fois la demande acceptée', async () => {
    await rendre('acceptee');

    expect(lienPaiement()).toBeDefined();
    expect(hote().textContent).toContain('Total à payer');
  });

  it('ne propose pas de payer tant que le mécanicien n’a pas répondu', async () => {
    await rendre('en_attente');

    // Encaisser avant l'accord obligerait à rembourser chaque refus.
    expect(lienPaiement()).toBeUndefined();
    expect(hote().textContent).toContain('En attente de Samba Fall');
  });

  it('présente le prix comme une estimation tant que rien n’est accepté', async () => {
    await rendre('en_attente');

    // « Total à payer » annoncerait un engagement qui n'existe pas encore.
    expect(hote().textContent).toContain('Estimation');
    expect(hote().textContent).not.toContain('Total à payer');
  });

  it('oriente vers un autre mécanicien après un refus', async () => {
    await rendre('refusee');

    expect(hote().textContent).toContain("n'est pas disponible");
    expect(lienPaiement()).toBeUndefined();
    expect(
      [...hote().querySelectorAll('a')].some((a) => a.getAttribute('href') === '/mecaniciens'),
    ).toBe(true);
  });
});
