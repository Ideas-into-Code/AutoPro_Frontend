import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarningsSummary } from '../../models/mechanic-dashboard.model';
import { EarningsCard } from './earnings-card';

describe('EarningsCard', () => {
  let fixture: ComponentFixture<EarningsCard>;

  const gains = (surcharges: Partial<EarningsSummary> = {}): EarningsSummary => ({
    todayXOF: 145500,
    trendPercent: 12,
    points: [
      { label: 'Lun', amountXOF: 50000 },
      { label: 'Mar', amountXOF: 100000 },
      { label: 'Mer', amountXOF: 145500 },
    ],
    ...surcharges,
  });

  const rendre = async (valeur: EarningsSummary): Promise<void> => {
    fixture = TestBed.createComponent(EarningsCard);
    fixture.componentRef.setInput('earnings', valeur);
    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const barres = (): HTMLElement[] => [
    ...hote().querySelectorAll<HTMLElement>('.ap-earnings__bar'),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EarningsCard] }).compileComponents();
  });

  it('affiche le total du jour avec des milliers séparés', async () => {
    await rendre(gains());

    // Espace insécable attendu : « 145 500 » et non « 145500 ».
    expect(hote().textContent?.replace(/[\u00A0\u202F\u2009]/g, ' ')).toContain('145 500');
  });

  it('dessine une barre par jour de la période', async () => {
    await rendre(gains());

    expect(barres().length).toBe(3);
  });

  it('met les barres à l’échelle du meilleur jour', async () => {
    await rendre(gains());

    const hauteurs = barres().map((b) => Number.parseFloat(b.style.height));

    // Le meilleur jour occupe toute la hauteur ; les autres sont
    // proportionnels, pas alignés sur une échelle arbitraire.
    expect(hauteurs[2]).toBe(100);
    expect(hauteurs[1]).toBeCloseTo((100000 / 145500) * 100, 1);
    expect(hauteurs[0]).toBeLessThan(hauteurs[1]);
  });

  it('garde une barre visible pour un jour sans gain', async () => {
    await rendre(
      gains({
        points: [
          { label: 'Lun', amountXOF: 0 },
          { label: 'Mar', amountXOF: 90000 },
        ],
      }),
    );

    // Une barre de hauteur nulle disparaîtrait, laissant croire à un trou
    // dans la série plutôt qu'à une journée creuse.
    expect(Number.parseFloat(barres()[0].style.height)).toBeGreaterThan(0);
  });

  it('distingue visuellement le jour en cours', async () => {
    await rendre(gains());

    expect(barres()[2].classList).toContain('ap-earnings__bar--current');
    expect(barres()[0].classList).not.toContain('ap-earnings__bar--current');
  });

  it('annonce une hausse avec le signe plus', async () => {
    await rendre(gains({ trendPercent: 12 }));

    expect(hote().querySelector('.ap-earnings__trend')?.textContent).toContain('+12');
  });

  it('signale une baisse autrement que par la seule couleur', async () => {
    await rendre(gains({ trendPercent: -8 }));

    const tendance = hote().querySelector('.ap-earnings__trend');

    expect(tendance?.classList).toContain('ap-earnings__trend--down');
    expect(tendance?.getAttribute('aria-label')).toContain('baisse');
  });

  it('résume le graphique en texte pour les lecteurs d’écran', async () => {
    await rendre(gains());

    const resume = hote().querySelector('.ap-earnings__chart-summary')?.textContent ?? '';

    // Le graphique lui-même est masqué aux lecteurs d'écran : sans ce
    // résumé, la carte n'annoncerait que le total du jour.
    expect(hote().querySelector('.ap-earnings__chart')?.getAttribute('aria-hidden')).toBe('true');
    expect(resume).toContain('Lun');
    expect(resume).toContain('francs CFA');
  });
});
