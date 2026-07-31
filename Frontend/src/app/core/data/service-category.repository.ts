import { Observable } from 'rxjs';

import { Page, PageRequest } from '../models/pagination';
import { ServiceCategory } from '../models/service-category';
import { ReadRepository } from './repository';

/**
 * Accès aux catégories de service.
 *
 * Déclaré en **classe abstraite** et non en interface : une interface
 * TypeScript disparaît à la compilation et ne peut donc pas servir de jeton
 * d'injection. La classe abstraite joue les deux rôles à la fois — contrat pour
 * le compilateur, jeton pour l'injecteur — sans imposer d'`InjectionToken`
 * séparé à déclarer et à maintenir en parallèle.
 *
 * Les écrans dépendent de cette abstraction, jamais d'une implémentation :
 *
 *   private readonly categories = inject(ServiceCategoryRepository);
 *
 * Ce que l'injecteur fournit derrière — données simulées aujourd'hui, appel
 * HTTP le jour où le backend existe — ne les concerne pas
 * (principe d'inversion des dépendances, CONVENTIONS.md §2).
 *
 * Lecture seule : les catégories sont une donnée de référence administrée par
 * le back-office, jamais créée depuis l'application cliente. Hériter d'un
 * contrat d'écriture obligerait à laisser des méthodes vides
 * (principe de ségrégation des interfaces).
 */
export abstract class ServiceCategoryRepository implements ReadRepository<ServiceCategory> {
  abstract findAll(request?: PageRequest): Observable<Page<ServiceCategory>>;

  abstract findById(id: string): Observable<ServiceCategory>;

  /**
   * Recherche par `slug`, la clé qui circule dans les URL.
   *
   * Ajoutée au contrat plutôt que laissée aux écrans : sans elle, chaque écran
   * qui lit `?categorie=batterie` rechargerait toute la collection pour la
   * filtrer lui-même, et le jour du backend il faudrait tous les réécrire.
   */
  abstract findBySlug(slug: string): Observable<ServiceCategory | null>;
}
