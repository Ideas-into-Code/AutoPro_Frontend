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

  const initiales = (): string =>
    hote().querySelector('.ap-avatar__initials')?.textContent?.trim() ?? '';

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

  it('affiche une pastille de profil à côté des initiales', async () => {
    await rendre('Boubacar Sidibe');

    expect(hote().querySelector('.ap-avatar__photo app-icon')).not.toBeNull();
    expect(initiales()).toBe('BS');
  });

  it('annonce le nom complet aux lecteurs d’écran sans l’afficher', async () => {
    await rendre('Boubacar Sidibe');

    // « B, S » épelé n'apprendrait rien : le nom entier reste disponible,
    // mais visuellement masqué pour ne pas encombrer la barre.
    expect(hote().querySelector('.ap-avatar__name')?.textContent).toBe('Boubacar Sidibe');
  });
});
