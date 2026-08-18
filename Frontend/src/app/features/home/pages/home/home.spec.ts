import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { Page, PageRequest, ServiceCategory, ServiceCategoryRepository, emptyPage } from '@core';
import { HomePage } from './home';

/**
 * Dépôt de substitution : aucun `HttpTestingController`, aucune URL simulée.
 * C'est le bénéfice concret d'avoir fait dépendre l'écran d'une abstraction —
 * un objet de quelques lignes suffit à le mettre en situation.
 */
class DepotDeTest extends ServiceCategoryRepository {
  constructor(private readonly reponse: () => Observable<Page<ServiceCategory>>) {
    super();
  }

  findAll(_request?: PageRequest): Observable<Page<ServiceCategory>> {
    return this.reponse();
  }

  findById(): Observable<ServiceCategory> {
    return throwError(() => new Error('non utilisé par cet écran'));
  }

  findBySlug(): Observable<ServiceCategory | null> {
    return of(null);
  }
}

const CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-01',
    slug: 'batterie',
    label: 'Batterie',
    description: 'Démarrage impossible.',
    isEmergency: true,
  },
  {
    id: 'cat-02',
    slug: 'freinage',
    label: 'Freinage',
    description: 'Plaquettes et disques.',
    isEmergency: false,
  },
];

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;

  const page = (items: ServiceCategory[]): Page<ServiceCategory> => ({
    ...emptyPage<ServiceCategory>(),
    items,
    totalItems: items.length,
    totalPages: 1,
  });

  const rendre = async (reponse: () => Observable<Page<ServiceCategory>>): Promise<void> => {
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: ServiceCategoryRepository, useValue: new DepotDeTest(reponse) },
      ],
    });

    fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Ces trois tests visent les **liens produits**, jamais les classes ni les
   * balises. Ils avaient été écrits sur la structure d'origine et sont tombés
   * à la première refonte de l'écran, alors que le comportement, lui, n'avait
   * pas changé. Un test qui casse sans qu'aucune fonctionnalité ne bouge finit
   * par être désactivé plutôt que lu.
   */
  const lienSos = (): HTMLAnchorElement | null =>
    hote().querySelector('a[href^="/demandes/signaler"]');

  const liensCategories = (): HTMLAnchorElement[] => [
    ...hote().querySelectorAll<HTMLAnchorElement>('a[href^="/mecaniciens?categorie="]'),
  ];

  it('ouvre un lien par catégorie renvoyée par le dépôt', async () => {
    await rendre(() => of(page(CATEGORIES)));

    expect(liensCategories().map((a) => a.getAttribute('href'))).toEqual([
      '/mecaniciens?categorie=batterie',
      '/mecaniciens?categorie=freinage',
    ]);
    expect(hote().textContent).toContain('Batterie');
    expect(hote().textContent).toContain('Freinage');
  });

  it('propose le dépannage en urgence avant les catégories', async () => {
    await rendre(() => of(page(CATEGORIES)));

    const sos = lienSos();
    const premiereCategorie = liensCategories()[0];

    expect(sos).not.toBeNull();
    // `DOCUMENT_POSITION_FOLLOWING` : les catégories suivent le SOS dans le
    // document. L'ordre du balisage est aussi celui du lecteur d'écran.
    expect(sos?.compareDocumentPosition(premiereCategorie)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('dirige le bouton SOS vers le formulaire de signalement, marqué comme urgent', async () => {
    await rendre(() => of(page(CATEGORIES)));

    expect(lienSos()?.getAttribute('href')).toBe('/demandes/signaler?urgence=true');
  });

  it('explique la panne et propose de réessayer quand le chargement échoue', async () => {
    await rendre(() => throwError(() => new Error('réseau indisponible')));

    const alerte = hote().querySelector('[role="alert"]');

    expect(alerte).not.toBeNull();
    expect(alerte?.textContent).toContain('Réessayer');
    expect(liensCategories()).toEqual([]);
  });

  it('annonce une grille vide sans laisser la page muette', async () => {
    await rendre(() => of(page([])));

    expect(hote().textContent).toContain('Aucune catégorie');
  });

  it('renvoie la recherche vers les mécaniciens avec le terme saisi', async () => {
    await rendre(() => of(page(CATEGORIES)));

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const champ = hote().querySelector('app-search-bar input') as HTMLInputElement;
    champ.value = 'embrayage';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    (hote().querySelector('app-search-bar form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/mecaniciens'], {
      queryParams: { recherche: 'embrayage' },
    });
  });

  it('retire le filtre de recherche quand le terme est effacé', async () => {
    await rendre(() => of(page(CATEGORIES)));

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    (hote().querySelector('app-search-bar form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/mecaniciens'], { queryParams: {} });
  });
});
