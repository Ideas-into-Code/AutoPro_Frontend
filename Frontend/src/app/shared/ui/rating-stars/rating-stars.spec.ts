import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingStars } from './rating-stars';

const LIBELLES = ['Passable', 'Correct', 'Bien', 'Très bien', 'Excellent'];

describe('RatingStars', () => {
  let fixture: ComponentFixture<RatingStars>;
  let emises: number[];

  const rendre = async (value = 0, readOnly = false): Promise<void> => {
    fixture = TestBed.createComponent(RatingStars);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('readOnly', readOnly);
    fixture.componentRef.setInput('labels', LIBELLES);

    emises = [];
    fixture.componentInstance.valueChange.subscribe((n) => emises.push(n));

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const radios = (): HTMLInputElement[] => [
    ...hote().querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ];

  const allumees = (): number => hote().querySelectorAll('.ap-rating__choice--on').length;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RatingStars] }).compileComponents();
  });

  it('propose un vrai groupe de boutons radio', async () => {
    await rendre();

    // De vrais radios, pour hériter du parcours aux flèches et de l'annonce
    // « 4 sur 5 » sans les réécrire.
    expect(radios()).toHaveLength(5);
    expect(new Set(radios().map((r) => r.name)).size).toBe(1);
  });

  it('émet la note cliquée', async () => {
    await rendre();

    radios()[3].click();

    expect(emises).toEqual([4]);
  });

  it('allume toutes les étoiles jusqu’à la note', async () => {
    await rendre(3);

    // Et non la seule étoile cliquée : c'est ainsi qu'une échelle se lit.
    expect(allumees()).toBe(3);
  });

  it('affiche le libellé de l’échelon retenu', async () => {
    await rendre(4);

    expect(hote().querySelector('.ap-rating__label')?.textContent?.trim()).toBe('Très bien');
  });

  it('n’affiche aucun libellé tant que rien n’est noté', async () => {
    await rendre(0);

    expect(hote().querySelector('.ap-rating__label')?.textContent?.trim()).toBe('');
    expect(allumees()).toBe(0);
  });

  it('sort de l’ordre de tabulation en lecture seule', async () => {
    await rendre(4, true);

    // Une note qu'on ne peut pas changer n'a rien à faire au clavier.
    expect(radios()).toHaveLength(0);
  });

  it('annonce la note en toutes lettres en lecture seule', async () => {
    await rendre(4, true);

    // Une rangée d'étoiles ne dit rien à qui ne les voit pas.
    expect(hote().querySelector('.ap-rating__sr')?.textContent).toContain('4 sur 5');
  });

  it('rend visible une moyenne décimale', async () => {
    await rendre(4.7, true);

    // Arrondir afficherait la même chose pour 4,5 et pour 5 — précisément la
    // nuance qu'une moyenne apporte.
    const remplissages = [...hote().querySelectorAll<HTMLElement>('.ap-rating__star-fill')].map(
      (element) => element.style.width,
    );

    expect(remplissages[3]).toBe('100%');
    expect(remplissages[4]).toBe('70%');
  });
});
