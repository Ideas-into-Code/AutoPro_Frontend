import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { Page, PageRequest, ServiceCategory, ServiceCategoryRepository, emptyPage } from '@core';
import { Mechanic } from '../../models/mechanic.model';
import { MechanicQuery, MechanicRepository } from '../../data/mechanic.repository';
import { MechanicListPage } from './mechanic-list';

class DepotMecaniciensDeTest extends MechanicRepository {
  /** Dernier jeu de critères reçu, pour vérifier ce que l'écran demande. */
  derniersCriteres: MechanicQuery | null = null;

  constructor(private readonly reponse: () => Observable<Page<Mechanic>>) {
    super();
  }

  findAll(): Observable<Page<Mechanic>> {
    return this.reponse();
  }

  findById(): Observable<Mechanic> {
    return throwError(() => new Error('non utilisé par cet écran'));
  }

  search(query: MechanicQuery, _request?: PageRequest): Observable<Page<Mechanic>> {
    this.derniersCriteres = query;

    return this.reponse();
  }
}

class DepotCategoriesDeTest extends ServiceCategoryRepository {
  findAll(): Observable<Page<ServiceCategory>> {
    return of(emptyPage<ServiceCategory>());
  }

  findById(): Observable<ServiceCategory> {
    return throwError(() => new Error('non utilisé par cet écran'));
  }

  findBySlug(slug: string): Observable<ServiceCategory | null> {
    return of(
      slug === 'freinage'
        ? {
            id: 'cat-04',
            slug: 'freinage',
            label: 'Freinage',
            description: 'Plaquettes et disques.',
            isEmergency: false,
          }
        : null,
    );
  }
}

const MECANICIEN: Mechanic = {
  id: 'mec-001',
  userId: 'usr-001',
  fullName: 'Boubacar Sidibe',
  workshopName: 'Garage Sidibe Auto',
  phone: '+221 77 300 44 55',
  email: 'boubacar@example.sn',
  avatarUrl: '',
  specialties: ['Freinage'],
  experienceYears: 8,
  rating: 4.9,
  reviewCount: 42,
  isAvailable: true,
  isVerified: true,
  address: 'Dakar Plateau',
  location: { latitude: 14.67, longitude: -17.43 },
  reviews: [],
};

describe('MechanicListPage', () => {
  let fixture: ComponentFixture<MechanicListPage>;
  let depot: DepotMecaniciensDeTest;

  const page = (items: Mechanic[]): Page<Mechanic> => ({
    ...emptyPage<Mechanic>(),
    items,
    totalItems: items.length,
    totalPages: 1,
  });

  const rendre = async (
    entrees: Record<string, string | undefined>,
    reponse: () => Observable<Page<Mechanic>> = () => of(page([MECANICIEN])),
  ): Promise<void> => {
    depot = new DepotMecaniciensDeTest(reponse);

    TestBed.configureTestingModule({
      imports: [MechanicListPage],
      providers: [
        provideRouter([]),
        { provide: MechanicRepository, useValue: depot },
        { provide: ServiceCategoryRepository, useClass: DepotCategoriesDeTest },
      ],
    });

    fixture = TestBed.createComponent(MechanicListPage);

    for (const [nom, valeur] of Object.entries(entrees)) {
      fixture.componentRef.setInput(nom, valeur);
    }

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const titre = (): string => hote().querySelector('h1')?.textContent?.trim() ?? '';

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("s'intitule « Tous les mécaniciens » quand aucun paramètre n'est présent dans l'URL", async () => {
    // Régression : le routeur écrit `undefined` dans les entrées non liées, ce
    // qui affichait « Résultats pour « undefined » » sur `/mecaniciens` nu.
    await rendre({ categorie: undefined, recherche: undefined });

    expect(titre()).toBe('Tous les mécaniciens');
  });

  it("ne transmet aucun filtre au dépôt quand l'URL n'en porte pas", async () => {
    await rendre({ categorie: undefined, recherche: undefined });

    expect(depot.derniersCriteres).toEqual({ categorySlug: undefined, search: undefined });
  });

  it("reprend l'intitulé de la catégorie filtrée comme titre de page", async () => {
    await rendre({ categorie: 'freinage' });

    expect(titre()).toBe('Freinage');
  });

  it('affiche le terme recherché quand aucune catégorie ne filtre', async () => {
    await rendre({ recherche: 'batterie' });

    expect(titre()).toContain('batterie');
  });

  it('transmet les deux critères au dépôt', async () => {
    await rendre({ categorie: 'freinage', recherche: 'dakar' });

    expect(depot.derniersCriteres).toEqual({ categorySlug: 'freinage', search: 'dakar' });
  });

  it('liste les mécaniciens renvoyés et annonce leur nombre', async () => {
    await rendre({});

    expect(hote().textContent).toContain('Boubacar Sidibe');
    expect(hote().textContent).toContain('Garage Sidibe Auto');
    expect(hote().querySelector('[aria-live="polite"]')?.textContent).toContain('1 mécanicien');
  });

  it('propose de lever le filtre quand une recherche ne donne rien', async () => {
    await rendre({ categorie: 'freinage' }, () => of(page([])));

    expect(hote().textContent).toContain('Aucun mécanicien');
    expect(hote().textContent).toContain('Voir tous les mécaniciens');
  });

  it('ne propose pas de lever un filtre inexistant sur une liste vide', async () => {
    await rendre({}, () => of(page([])));

    expect(hote().textContent).toContain('Aucun mécanicien');
    expect(hote().textContent).not.toContain('Voir tous les mécaniciens');
  });

  it('explique la panne et propose de réessayer quand le chargement échoue', async () => {
    await rendre({}, () => throwError(() => new Error('réseau indisponible')));

    expect(hote().querySelector('[role="alert"]')?.textContent).toContain('Réessayer');
  });

  it('relance la recherche sur cet écran, et non à la racine du site', async () => {
    await rendre({});

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const champ = hote().querySelector('app-search-bar input') as HTMLInputElement;
    champ.value = 'freinage';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    (hote().querySelector('app-search-bar form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    await fixture.whenStable();

    // Régression : un `navigate([])` sans `relativeTo` se résout depuis la
    // racine. La recherche renvoyait donc à `/`, c'est-à-dire à l'onboarding.
    expect(navigate).toHaveBeenCalledWith(['/mecaniciens'], {
      queryParams: { categorie: null, recherche: 'freinage' },
    });
  });

  it('conserve la catégorie filtrée quand on affine par mot-clé', async () => {
    await rendre({ categorie: 'freinage' });

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const champ = hote().querySelector('app-search-bar input') as HTMLInputElement;
    champ.value = 'dakar';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    (hote().querySelector('app-search-bar form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/mecaniciens'], {
      queryParams: { categorie: 'freinage', recherche: 'dakar' },
    });
  });

  it('renvoie vers le profil détaillé de chaque mécanicien', async () => {
    await rendre({});

    const lien = [...hote().querySelectorAll('a')].find((a) =>
      a.textContent?.includes('Voir le profil'),
    );

    expect(lien?.getAttribute('href')).toBe('/mecaniciens/mec-001');
  });
});
