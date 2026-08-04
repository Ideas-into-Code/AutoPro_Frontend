import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DEFAULT_PAGE_SIZE, HttpRepository, MicroserviceName, Page, PageRequest } from '@core';
import { Mechanic } from '../models/mechanic.model';
import { MechanicQuery, MechanicRepository } from './mechanic.repository';

/**
 * Implémentation réelle, à fournir en lieu et place de la version simulée
 * lorsque le microservice « mechanics » sera en ligne — une ligne à changer
 * dans `mechanics.routes.ts`.
 *
 * Aucune correspondance textuelle entre catégories et spécialités ici,
 * contrairement au dépôt simulé : les critères partent au serveur, qui possède
 * la relation et sait l'interroger.
 */
export class HttpMechanicRepository extends HttpRepository<Mechanic> implements MechanicRepository {
  protected readonly service: MicroserviceName = 'mechanics';
  protected readonly resource = 'profiles';

  search(query: MechanicQuery, request?: PageRequest): Observable<Page<Mechanic>> {
    const { page, size } = request ?? { page: 0, size: DEFAULT_PAGE_SIZE };

    let params = new HttpParams().set('page', page).set('size', size);

    // Un paramètre vide n'est pas envoyé : `?categorie=` signifierait
    // « catégorie vide » pour le serveur, pas « pas de filtre ».
    if (query.categorySlug !== undefined && query.categorySlug !== '') {
      params = params.set('categorie', query.categorySlug);
    }

    if (query.search !== undefined && query.search !== '') {
      params = params.set('recherche', query.search);
    }

    return this.http.get<Page<Mechanic>>(this.url(), { params });
  }
}
