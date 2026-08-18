import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailabilityToggle } from './availability-toggle';

describe('AvailabilityToggle', () => {
  let fixture: ComponentFixture<AvailabilityToggle>;
  let emis: boolean[];

  const rendre = async (isOnline: boolean, pending = false): Promise<void> => {
    fixture = TestBed.createComponent(AvailabilityToggle);
    fixture.componentRef.setInput('isOnline', isOnline);
    fixture.componentRef.setInput('pending', pending);

    emis = [];
    fixture.componentInstance.toggled.subscribe((v) => emis.push(v));

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const champ = (): HTMLInputElement =>
    hote().querySelector('input[type="checkbox"]') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvailabilityToggle] }).compileComponents();
  });

  it("s'appuie sur une case native, pas sur un div cliquable", async () => {
    await rendre(true);

    // C'est ce qui apporte gratuitement le clavier, la barre d'espace et
    // l'annonce de l'état.
    expect(champ()).not.toBeNull();
    expect(champ().getAttribute('role')).toBe('switch');
  });

  it("reflète l'état reçu en entrée", async () => {
    await rendre(true);
    expect(champ().checked).toBe(true);

    await rendre(false);
    expect(champ().checked).toBe(false);
  });

  it("annonce l'action à venir plutôt que l'état courant", async () => {
    await rendre(true);
    expect(hote().textContent).toContain('Passer hors ligne');

    await rendre(false);
    expect(hote().textContent).toContain('Repasser en ligne');
  });

  it("affiche l'état en toutes lettres à côté de l'interrupteur", async () => {
    await rendre(true);
    expect(hote().querySelector('.ap-availability__state')?.textContent?.trim()).toBe('En ligne');

    await rendre(false);
    expect(hote().querySelector('.ap-availability__state')?.textContent?.trim()).toBe('Hors ligne');
  });

  it('émet la nouvelle valeur au changement', async () => {
    await rendre(true);

    champ().checked = false;
    champ().dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(emis).toEqual([false]);
  });

  it("se neutralise pendant l'enregistrement, pour éviter les doubles clics", async () => {
    await rendre(true, true);

    expect(champ().disabled).toBe(true);
  });

  it("ne décide de rien lui-même : il se contente d'émettre", async () => {
    await rendre(true);

    champ().checked = false;
    champ().dispatchEvent(new Event('change'));
    await fixture.whenStable();

    // L'entrée n'a pas changé, donc l'affichage non plus : c'est l'écran
    // appelant qui reste maître de l'état.
    expect(champ().checked).toBe(false);
    expect(hote().querySelector('.ap-availability__state')?.textContent?.trim()).toBe('En ligne');
  });
});
