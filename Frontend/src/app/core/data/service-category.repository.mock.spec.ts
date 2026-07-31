import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { Page } from '../models/pagination';
import { ServiceCategory } from '../models/service-category';
import { ServiceCategoryRepository } from './service-category.repository';
import { MockServiceCategoryRepository } from './service-category.repository.mock';

/**
 * Ces tests vérifient moins le contenu du catalogue que le **respect du
 * contrat** : c'est ce qui garantit que le jour de la bascule vers le backend,
 * les écrans ne verront pas la forme des données changer sous eux.
 */
describe('MockServiceCategoryRepository', () => {
  let depot: ServiceCategoryRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ServiceCategoryRepository, useClass: MockServiceCategoryRepository }],
    });

    depot = TestBed.inject(ServiceCategoryRepository);
  });

  const premierePage = (): Promise<Page<ServiceCategory>> => firstValueFrom(depot.findAll());

  it("s'obtient par le contrat abstrait, jamais par l'implémentation", () => {
    expect(depot).toBeInstanceOf(MockServiceCategoryRepository);
  });

  it('renvoie une page complète, et non un tableau nu', async () => {
    const page = await premierePage();

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.totalItems).toBe(page.items.length);
    expect(page.page).toBe(0);
    expect(page.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('découpe réellement la collection quand une pagination est demandée', async () => {
    const page = await firstValueFrom(depot.findAll({ page: 0, size: 3 }));
    const suivante = await firstValueFrom(depot.findAll({ page: 1, size: 3 }));

    expect(page.items.length).toBe(3);
    expect(page.size).toBe(3);
    expect(suivante.page).toBe(1);
    expect(suivante.items[0]?.id).not.toBe(page.items[0]?.id);
  });

  it("expose des slugs uniques, puisqu'ils servent de clé dans les URL", async () => {
    const page = await premierePage();
    const slugs = page.items.map((categorie) => categorie.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('retrouve une catégorie par son slug', async () => {
    const categorie = await firstValueFrom(depot.findBySlug('batterie'));

    expect(categorie?.label).toBe('Batterie');
  });

  it('renvoie null pour un slug inconnu plutôt que de lever une erreur', async () => {
    await expect(firstValueFrom(depot.findBySlug('slug-inexistant'))).resolves.toBeNull();
  });

  it('retrouve une catégorie par son identifiant technique', async () => {
    const page = await premierePage();
    const attendue = page.items[0];

    const categorie = await firstValueFrom(depot.findById(attendue.id));

    expect(categorie).toEqual(attendue);
  });

  it('signale au moins une catégorie traitée en urgence', async () => {
    const page = await premierePage();

    expect(page.items.some((categorie) => categorie.isEmergency)).toBe(true);
  });
});
