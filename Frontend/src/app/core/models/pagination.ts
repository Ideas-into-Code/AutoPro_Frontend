/**
 * Types transverses de pagination, partagés par tous les domaines métier.
 * Évite que chaque feature réinvente sa propre forme de réponse paginée.
 */

/** Paramètres d'une requête paginée. */
export interface PageRequest {
  readonly page: number;
  readonly size: number;
}

/** Tranche de résultats renvoyée par un microservice. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 20;

export const FIRST_PAGE: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE };

/** Page vide, utile comme valeur initiale d'un signal avant chargement. */
export function emptyPage<T>(size = DEFAULT_PAGE_SIZE): Page<T> {
  return { items: [], page: 0, size, totalItems: 0, totalPages: 0 };
}
