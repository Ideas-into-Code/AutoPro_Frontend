import { Observable } from 'rxjs';

import { Page, PageRequest } from '../models/pagination';

/**
 * Contrats d'accès aux données, découpés volontairement en interfaces étroites
 * (principe de ségrégation des interfaces) : un dépôt en lecture seule
 * n'implémente pas de méthodes d'écriture qu'il devrait laisser vides.
 *
 * Les composants dépendent de ces abstractions, pas de HttpClient
 * (principe d'inversion des dépendances) — ce qui les rend testables avec un
 * simple objet factice, sans HttpTestingController.
 */

/** Lecture d'une collection et d'un élément unique. */
export interface ReadRepository<T, Id = string> {
  findAll(request?: PageRequest): Observable<Page<T>>;
  findById(id: Id): Observable<T>;
}

/** Création et mise à jour. `Draft` décrit la charge utile envoyée au serveur. */
export interface WriteRepository<T, Draft = Partial<T>, Id = string> {
  create(draft: Draft): Observable<T>;
  update(id: Id, changes: Draft): Observable<T>;
}

/** Suppression, isolée car rarement autorisée à tous les rôles. */
export interface DeleteRepository<Id = string> {
  delete(id: Id): Observable<void>;
}

/** Composition des trois contrats, pour les dépôts qui ont besoin de tout. */
export type CrudRepository<T, Draft = Partial<T>, Id = string> = ReadRepository<T, Id> &
  WriteRepository<T, Draft, Id> &
  DeleteRepository<Id>;
