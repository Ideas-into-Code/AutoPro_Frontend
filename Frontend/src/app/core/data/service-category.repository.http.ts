import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { MicroserviceName } from '../config/api.config';
import { Page } from '../models/pagination';
import { ServiceCategory } from '../models/service-category';
import { HttpRepository } from './http-repository.base';

/**
 * Implémentation réelle du contrat, à brancher le jour où le microservice
 * « mechanics » expose ses catégories. Elle n'est encore fournie nulle part :
 * `provideMockRepositories()` sert les données simulées jusque-là.
 *
 * `findAll` et `findById` sont hérités de `HttpRepository` — la construction
 * d'URL et la pagination ne sont pas réécrites ici. Ce dépôt ne décrit que ce
 * qui lui est propre : sa ressource, et la recherche par `slug`.
 */
export class HttpServiceCategoryRepository extends HttpRepository<ServiceCategory> {
  protected readonly service: MicroserviceName = 'mechanics';
  protected readonly resource = 'service-categories';

  /**
   * Le serveur filtre, pas le client : rapatrier tout le catalogue pour n'en
   * garder qu'une entrée gaspillerait la bande passante que le cahier des
   * charges demande justement d'économiser.
   */
  findBySlug(slug: string): Observable<ServiceCategory | null> {
    const params = new HttpParams().set('slug', slug);

    return this.http
      .get<Page<ServiceCategory>>(this.url(), { params })
      .pipe(map((page) => page.items[0] ?? null));
  }
}
