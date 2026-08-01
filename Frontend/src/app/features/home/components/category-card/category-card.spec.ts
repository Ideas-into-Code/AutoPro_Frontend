import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ServiceCategory } from '@core';
import { CategoryCard } from './category-card';

describe('CategoryCard', () => {
  let fixture: ComponentFixture<CategoryCard>;

  const categorie = (surcharges: Partial<ServiceCategory> = {}): ServiceCategory => ({
    id: 'cat-01',
    slug: 'batterie',
    label: 'Batterie',
    description: 'Démarrage impossible.',
    isEmergency: false,
    ...surcharges,
  });

  const rendre = async (valeur: ServiceCategory): Promise<void> => {
    fixture = TestBed.createComponent(CategoryCard);
    fixture.componentRef.setInput('category', valeur);
    fixture.componentRef.setInput('link', '/mecaniciens');
    fixture.componentRef.setInput('linkParams', { categorie: valeur.slug });

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const lien = (): HTMLAnchorElement => hote().querySelector('a') as HTMLAnchorElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryCard],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it("affiche l'intitulé et la description de la catégorie", async () => {
    await rendre(categorie());

    expect(hote().textContent).toContain('Batterie');
    expect(hote().textContent).toContain('Démarrage impossible.');
  });

  it('mène à la destination fournie, paramètre de catégorie compris', async () => {
    await rendre(categorie({ slug: 'freinage' }));

    expect(lien().getAttribute('href')).toBe('/mecaniciens?categorie=freinage');
  });

  it("ne signale l'urgence que lorsque la catégorie la porte", async () => {
    await rendre(categorie({ isEmergency: false }));

    expect(hote().querySelector('.ap-category-card__badge')).toBeNull();

    await rendre(categorie({ isEmergency: true }));

    expect(hote().querySelector('.ap-category-card__badge')?.textContent).toContain('Urgence');
  });

  it('rend toute la carte cliquable, et non le seul intitulé', async () => {
    await rendre(categorie());

    expect(lien().querySelector('app-card')).not.toBeNull();
  });

  it('retombe sur un pictogramme générique pour une catégorie inconnue du frontend', async () => {
    await rendre(categorie({ slug: 'categorie-ajoutee-par-le-backend' }));

    // Le repli garantit qu'une catégorie ajoutée côté serveur s'affiche quand
    // même, au lieu de laisser un vide à la place de l'icône.
    expect(hote().querySelector('.ap-category-card__icon svg')).not.toBeNull();
  });
});
