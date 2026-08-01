import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchBar } from './search-bar';

describe('SearchBar', () => {
  let fixture: ComponentFixture<SearchBar>;
  let emis: string[];

  /** Rend le composant avec un terme initial et collecte ce qu'il émet. */
  const rendre = async (value = ''): Promise<void> => {
    fixture = TestBed.createComponent(SearchBar);
    fixture.componentRef.setInput('label', 'Rechercher un mécanicien');
    fixture.componentRef.setInput('value', value);

    emis = [];
    fixture.componentInstance.searchSubmit.subscribe((terme) => emis.push(terme));

    await fixture.whenStable();
  };

  /** Racine du composant, typée une seule fois pour tout le fichier. */
  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const champ = (): HTMLInputElement => hote().querySelector('input') as HTMLInputElement;

  const saisir = async (valeur: string): Promise<void> => {
    champ().value = valeur;
    champ().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  const valider = async (): Promise<void> => {
    const formulaire = hote().querySelector('form') as HTMLFormElement;
    formulaire.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchBar] }).compileComponents();
  });

  it('affiche le terme initial reçu en entrée', async () => {
    await rendre('batterie');

    expect(champ().value).toBe('batterie');
  });

  it('émet le terme saisi à la validation', async () => {
    await rendre();
    await saisir('freinage');
    await valider();

    expect(emis).toEqual(['freinage']);
  });

  it('émet un terme débarrassé de ses espaces superflus', async () => {
    await rendre();
    await saisir('  pneu  ');
    await valider();

    expect(emis).toEqual(['pneu']);
  });

  it("n'émet rien tant que l'utilisateur se contente de saisir", async () => {
    await rendre();
    await saisir('remorquage');

    expect(emis).toEqual([]);
  });

  it("expose le bouton d'effacement uniquement quand le champ est rempli", async () => {
    await rendre();

    expect(hote().querySelector('.ap-search-bar__clear')).toBeNull();

    await saisir('batterie');

    expect(hote().querySelector('.ap-search-bar__clear')).not.toBeNull();
  });

  it("vide le champ et relance une recherche vide à l'effacement", async () => {
    await rendre('batterie');

    const effacer = hote().querySelector('.ap-search-bar__clear') as HTMLButtonElement;
    effacer.click();
    await fixture.whenStable();

    expect(champ().value).toBe('');
    expect(emis).toEqual(['']);
  });

  it("réinitialise la saisie quand l'écran parent change le terme", async () => {
    await rendre('batterie');
    await saisir('pneu');

    fixture.componentRef.setInput('value', 'freinage');
    await fixture.whenStable();

    expect(champ().value).toBe('freinage');
  });
});
