import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, delay, of } from 'rxjs';

import { DEFAULT_PAGE_SIZE, Page, PageRequest } from '../models/pagination';
import { ServiceCategory } from '../models/service-category';
import { ServiceCategoryRepository } from './service-category.repository';

/**
 * Catalogue de démonstration, en attendant le microservice « mechanics ».
 *
 * Les `slug` reprennent la nomenclature des types de panne déjà utilisée par le
 * domaine « demandes » : une catégorie choisie sur l'accueil pourra préremplir
 * le formulaire de signalement sans table de correspondance.
 */
const CATEGORIES: readonly ServiceCategory[] = [
  {
    id: 'cat-01',
    slug: 'batterie',
    label: 'Batterie',
    description: 'Démarrage impossible, batterie déchargée ou à remplacer.',
    isEmergency: true,
  },
  {
    id: 'cat-02',
    slug: 'pneu',
    label: 'Pneumatique',
    description: 'Crevaison, usure, équilibrage et changement de pneus.',
    isEmergency: true,
  },
  {
    id: 'cat-03',
    slug: 'panne-moteur',
    label: 'Panne moteur',
    description: 'Diagnostic électronique, surchauffe, perte de puissance.',
    isEmergency: false,
  },
  {
    id: 'cat-04',
    slug: 'freinage',
    label: 'Freinage',
    description: 'Plaquettes, disques, liquide de frein et bruits au freinage.',
    isEmergency: false,
  },
  {
    id: 'cat-05',
    slug: 'remorquage',
    label: 'Remorquage',
    description: 'Véhicule immobilisé à évacuer vers un atelier.',
    isEmergency: true,
  },
  {
    id: 'cat-06',
    slug: 'climatisation',
    label: 'Climatisation',
    description: 'Recharge de gaz, filtre habitacle, air insuffisamment froid.',
    isEmergency: false,
  },
  {
    id: 'cat-07',
    slug: 'electricite',
    label: 'Électricité auto',
    description: 'Alternateur, démarreur, éclairage et faisceau électrique.',
    isEmergency: false,
  },
];

/** Emballe une tranche de la collection dans la même forme que l'API. */
function toPage(items: readonly ServiceCategory[], request?: PageRequest): Page<ServiceCategory> {
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
 * Implémentation simulée du contrat, branchée par `provideMockRepositories()`.
 *
 * Elle renvoie exactement la forme que renverra le serveur — un `Page<T>` dans
 * un `Observable`, pas un tableau nu. Sans cette discipline, les écrans
 * s'habitueraient à une forme de données qui n'existera jamais en production,
 * et la bascule vers le backend les casserait tous.
 */
export class MockServiceCategoryRepository extends ServiceCategoryRepository {
  private readonly platformId = inject(PLATFORM_ID);

  findAll(request?: PageRequest): Observable<Page<ServiceCategory>> {
    return this.simuler(toPage(CATEGORIES, request));
  }

  findById(id: string): Observable<ServiceCategory> {
    const trouvee = CATEGORIES.find((categorie) => categorie.id === id);

    if (trouvee === undefined) {
      throw new Error(`Catégorie de service inconnue : ${id}`);
    }

    return this.simuler(trouvee);
  }

  findBySlug(slug: string): Observable<ServiceCategory | null> {
    return this.simuler(CATEGORIES.find((categorie) => categorie.slug === slug) ?? null);
  }

  /**
   * Latence artificielle, dans le navigateur uniquement.
   *
   * Elle sert à vérifier que les écrans affichent bien leur état de chargement.
   * L'appliquer aussi au rendu serveur figerait la page prérendue sur cet état
   * de chargement : le rendu se termine avant l'échéance du minuteur.
   */
  private simuler<T>(valeur: T): Observable<T> {
    const reponse = of(valeur);

    return isPlatformBrowser(this.platformId) ? reponse.pipe(delay(250)) : reponse;
  }
}
