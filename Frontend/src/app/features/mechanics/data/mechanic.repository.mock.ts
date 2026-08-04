import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, delay, of } from 'rxjs';

import { DEFAULT_PAGE_SIZE, Page, PageRequest } from '@core';
import { Mechanic } from '../models/mechanic.model';
import { MOCK_MECHANICS } from './mock-mechanics.data';
import { MechanicQuery, MechanicRepository } from './mechanic.repository';

/**
 * Mots-clés rattachant une catégorie de service aux spécialités déclarées par
 * les mécaniciens.
 *
 * Cette table n'existe **que** dans l'implémentation simulée. Le vrai backend
 * rattachera les mécaniciens aux catégories par une relation en base, et
 * `HttpMechanicRepository` se contentera de transmettre le `slug` au serveur.
 * La faire remonter dans le contrat imposerait donc au serveur une mécanique
 * de correspondance textuelle dont il n'a que faire.
 */
const MOTS_CLES_PAR_CATEGORIE: Readonly<Record<string, readonly string[]>> = {
  batterie: ['batterie', 'electricite', 'electrique', 'diagnostic', 'demarrage'],
  pneu: ['pneu', 'pneumatique', 'roue'],
  'panne-moteur': ['moteur', 'mecanique', 'diagnostic', 'distribution'],
  freinage: ['frein', 'freinage', 'plaquette', 'disque'],
  remorquage: ['remorquage', 'depannage', 'assistance'],
  climatisation: ['climatisation', 'clim'],
  electricite: ['electricite', 'electrique', 'alternateur', 'demarreur'],
};

/**
 * Réduit une chaîne à sa forme comparable : minuscules, sans accents.
 * « Électricité auto » et « electricite » doivent se reconnaître, sans quoi la
 * recherche échouerait sur la moitié du vocabulaire français.
 */
function normaliser(valeur: string): string {
  return valeur
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/** Texte dans lequel une recherche libre va chercher. */
function indexer(mecanicien: Mechanic): string {
  return normaliser(
    [
      mecanicien.fullName,
      mecanicien.workshopName,
      mecanicien.address,
      ...mecanicien.specialties,
    ].join(' '),
  );
}

function correspondALaCategorie(mecanicien: Mechanic, slug: string): boolean {
  const motsCles = MOTS_CLES_PAR_CATEGORIE[slug];

  // Catégorie inconnue de cette table : ne rien filtrer plutôt que de renvoyer
  // une liste vide qui laisserait croire qu'aucun mécanicien n'existe.
  if (motsCles === undefined) {
    return true;
  }

  const specialites = normaliser(mecanicien.specialties.join(' '));

  return motsCles.some((motCle) => specialites.includes(motCle));
}

function toPage(items: readonly Mechanic[], request?: PageRequest): Page<Mechanic> {
  const { page, size } = request ?? { page: 0, size: DEFAULT_PAGE_SIZE };
  const debut = page * size;

  return {
    items: items.slice(debut, debut + size),
    page,
    size,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  };
}

/**
 * Implémentation simulée, branchée par la route de la feature.
 *
 * Le filtrage est fait ici, côté client, uniquement parce qu'il n'y a pas de
 * serveur pour le faire. `HttpMechanicRepository` transmettra les critères et
 * ne rapatriera que les résultats.
 */
export class MockMechanicRepository extends MechanicRepository {
  private readonly platformId = inject(PLATFORM_ID);

  findAll(request?: PageRequest): Observable<Page<Mechanic>> {
    return this.simuler(toPage(MOCK_MECHANICS, request));
  }

  findById(id: string): Observable<Mechanic> {
    const trouve = MOCK_MECHANICS.find((mecanicien) => mecanicien.id === id);

    if (trouve === undefined) {
      throw new Error(`Mécanicien inconnu : ${id}`);
    }

    return this.simuler(trouve);
  }

  search(query: MechanicQuery, request?: PageRequest): Observable<Page<Mechanic>> {
    const terme = normaliser(query.search?.trim() ?? '');

    const resultats = MOCK_MECHANICS.filter((mecanicien) => {
      const categorieOk =
        query.categorySlug === undefined || correspondALaCategorie(mecanicien, query.categorySlug);

      const termeOk = terme === '' || indexer(mecanicien).includes(terme);

      return categorieOk && termeOk;
    });

    return this.simuler(toPage(resultats, request));
  }

  /** Latence artificielle côté navigateur seulement — voir le dépôt des catégories. */
  private simuler<T>(valeur: T): Observable<T> {
    const reponse = of(valeur);

    return isPlatformBrowser(this.platformId) ? reponse.pipe(delay(250)) : reponse;
  }
}
