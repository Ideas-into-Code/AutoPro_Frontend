import { Observable } from 'rxjs';

import { Page, PageRequest, ReadRepository } from '@core';
import { Mechanic } from '../models/mechanic.model';

/**
 * Critères de recherche d'un mécanicien. Les deux champs se combinent : une
 * catégorie choisie sur l'accueil peut être affinée par un terme libre.
 */
export interface MechanicQuery {
  /** `slug` d'une catégorie de service, tel qu'il circule dans l'URL. */
  readonly categorySlug?: string;

  /** Terme libre : nom, atelier, spécialité ou quartier. */
  readonly search?: string;
}

/**
 * Accès aux profils de mécaniciens.
 *
 * Classe abstraite pour la même raison que `ServiceCategoryRepository` : servir
 * à la fois de contrat et de jeton d'injection.
 *
 * Contrairement aux catégories, ce dépôt reste **cantonné à sa feature** : seul
 * le domaine « mécaniciens » le consomme. Il est donc fourni au niveau de la
 * route de la feature, ce qui garde les données simulées hors du bundle
 * initial — un client qui ne consulte jamais la liste ne les téléchargera pas.
 */
export abstract class MechanicRepository implements ReadRepository<Mechanic> {
  abstract findAll(request?: PageRequest): Observable<Page<Mechanic>>;

  abstract findById(id: string): Observable<Mechanic>;

  abstract search(query: MechanicQuery, request?: PageRequest): Observable<Page<Mechanic>>;
}
