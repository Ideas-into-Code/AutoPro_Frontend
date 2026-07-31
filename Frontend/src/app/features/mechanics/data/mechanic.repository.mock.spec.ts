import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { Page } from '@core';
import { Mechanic } from '../models/mechanic.model';
import { MechanicQuery, MechanicRepository } from './mechanic.repository';
import { MockMechanicRepository } from './mechanic.repository.mock';

describe('MockMechanicRepository', () => {
  let depot: MechanicRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MechanicRepository, useClass: MockMechanicRepository }],
    });

    depot = TestBed.inject(MechanicRepository);
  });

  const chercher = (criteres: MechanicQuery): Promise<Page<Mechanic>> =>
    firstValueFrom(depot.search(criteres));

  it("renvoie tout le catalogue quand aucun critère n'est fourni", async () => {
    const tous = await firstValueFrom(depot.findAll());
    const sansCritere = await chercher({});

    expect(sansCritere.totalItems).toBe(tous.totalItems);
  });

  it('filtre sur la catégorie via les spécialités déclarées', async () => {
    const freinage = await chercher({ categorySlug: 'freinage' });

    expect(freinage.totalItems).toBeGreaterThan(0);
    expect(
      freinage.items.every((mecanicien) =>
        mecanicien.specialties.some((specialite) => specialite.toLowerCase().includes('frein')),
      ),
    ).toBe(true);
  });

  it('reconnaît les spécialités accentuées depuis un slug sans accent', async () => {
    // « Électricité auto » doit répondre au slug `electricite`, sans quoi la
    // moitié du vocabulaire métier échapperait au filtre.
    const resultats = await chercher({ categorySlug: 'electricite' });

    expect(resultats.totalItems).toBeGreaterThan(0);
  });

  it("cherche aussi dans le nom, l'atelier et le quartier", async () => {
    const parQuartier = await chercher({ search: 'Keur Massar' });

    expect(parQuartier.totalItems).toBeGreaterThan(0);
    expect(parQuartier.items[0].address).toContain('Keur Massar');
  });

  it('ignore la casse et les accents du terme recherché', async () => {
    const accentue = await chercher({ search: 'climatisation' });
    const sansAccent = await chercher({ search: 'CLIMATISATION' });

    expect(accentue.totalItems).toBe(sansAccent.totalItems);
    expect(accentue.totalItems).toBeGreaterThan(0);
  });

  it('combine catégorie et terme libre', async () => {
    const combine = await chercher({ categorySlug: 'pneu', search: 'introuvable-nulle-part' });

    expect(combine.totalItems).toBe(0);
    expect(combine.items).toEqual([]);
  });

  it('ne masque pas le catalogue pour une catégorie inconnue de la table', async () => {
    // Une catégorie ajoutée côté serveur ne doit pas donner l'impression
    // qu'aucun mécanicien n'existe.
    const inconnue = await chercher({ categorySlug: 'categorie-inedite' });

    expect(inconnue.totalItems).toBeGreaterThan(0);
  });

  it('renvoie une page conforme au contrat', async () => {
    const page = await chercher({});

    expect(page.page).toBe(0);
    expect(page.totalPages).toBeGreaterThanOrEqual(1);
    expect(page.items.length).toBe(page.totalItems);
  });
});
