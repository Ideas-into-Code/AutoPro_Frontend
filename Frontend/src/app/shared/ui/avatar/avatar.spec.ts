import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Avatar } from './avatar';

describe('Avatar', () => {
  let fixture: ComponentFixture<Avatar>;

  const rendre = async (name: string): Promise<void> => {
    fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('name', name);
    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const initiales = (): string => hote().textContent?.trim() ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Avatar] }).compileComponents();
  });

  it('prend la première lettre du prénom et du nom', async () => {
    await rendre('Boubacar Sidibe');

    expect(initiales()).toBe('BS');
  });

  it('prend le premier et le DERNIER mot, pas les deux premiers', async () => {
    // Les deux premiers donneraient « ME », alors que l'usage attend « MB ».
    await rendre('Mohamed El Fadel Badji');

    expect(initiales()).toBe('MB');
  });

  it('absorbe un prénom composé', async () => {
    await rendre('Jean-Pierre Diop');

    expect(initiales()).toBe('JD');
  });

  it('se contente d’une lettre pour un nom unique', async () => {
    await rendre('Fatou');

    expect(initiales()).toBe('F');
  });

  it('met les initiales en majuscules', async () => {
    await rendre('fatou gueye');

    expect(initiales()).toBe('FG');
  });

  it('reste lisible face à un nom vide', async () => {
    await rendre('   ');

    expect(initiales()).toBe('?');
  });

  it('annonce le nom complet aux lecteurs d’écran', async () => {
    await rendre('Boubacar Sidibe');

    // Deux lettres épelées n'apprendraient rien : le libellé porte le nom.
    const pastille = hote().querySelector('[role="img"]');

    expect(pastille?.getAttribute('aria-label')).toBe('Boubacar Sidibe');
    expect(pastille?.querySelector('[aria-hidden="true"]')?.textContent).toBe('BS');
  });
});
