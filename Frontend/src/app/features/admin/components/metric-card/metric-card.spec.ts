import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemMetric } from '../../models/admin-dashboard.model';
import { MetricCard } from './metric-card';

const INDICATEUR: SystemMetric = {
  id: 'utilisateurs',
  label: 'Utilisateurs inscrits',
  value: 14284,
  icon: 'groupes',
  trendPercent: 12,
  direction: 'hausse',
};

describe('MetricCard', () => {
  let fixture: ComponentFixture<MetricCard>;

  const rendre = async (metric: SystemMetric): Promise<void> => {
    fixture = TestBed.createComponent(MetricCard);
    fixture.componentRef.setInput('metric', metric);
    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const texte = (selecteur: string): string =>
    hote().querySelector(selecteur)?.textContent?.trim() ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MetricCard] }).compileComponents();
  });

  it('sépare les milliers de la valeur', async () => {
    await rendre(INDICATEUR);

    expect(texte('.ap-metric__value')).toContain('14 284');
    expect(texte('.ap-metric__label')).toBe('Utilisateurs inscrits');
  });

  it('abrège les montants en millions et accole leur unité', async () => {
    await rendre({ ...INDICATEUR, value: 8400000, unit: 'FCFA' });

    expect(texte('.ap-metric__value').replace(/\s+/g, ' ')).toBe('8,4 M FCFA');
  });

  it('marque explicitement une hausse', async () => {
    await rendre(INDICATEUR);

    expect(texte('.ap-metric__trend')).toContain('+12 %');
    expect(hote().className).toContain('ap-metric--hausse');
  });

  it('marque une baisse sans double signe', async () => {
    // Le dépôt peut renvoyer -8 comme 8 : le signe vient du sens déclaré, pas
    // de celui du nombre, sinon une baisse s'afficherait « −−8 % ».
    await rendre({ ...INDICATEUR, trendPercent: -8, direction: 'baisse' });

    expect(texte('.ap-metric__trend')).toContain('−8 %');
    expect(hote().className).toContain('ap-metric--baisse');
  });

  it("n'affiche aucun chiffre pour un indicateur stable", async () => {
    // « 0 % » se lirait comme une mesure, alors qu'il s'agit d'une absence de
    // mouvement.
    await rendre({ ...INDICATEUR, trendPercent: 0, direction: 'stable' });

    expect(texte('.ap-metric__trend')).toContain('Stable');
    expect(texte('.ap-metric__trend')).not.toContain('%');
  });

  it('double la couleur et la flèche d’une phrase pour les lecteurs d’écran', async () => {
    await rendre(INDICATEUR);

    expect(texte('.ap-metric__sr')).toBe('en hausse de 12 % par rapport au mois précédent');
  });
});
