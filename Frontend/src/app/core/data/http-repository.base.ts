import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, MicroserviceName, buildServiceUrl } from '../config/api.config';
import { DEFAULT_PAGE_SIZE, Page, PageRequest } from '../models/pagination';
import { ReadRepository } from './repository';

/**
 * Base commune aux dépôts HTTP. Concentre la construction des URL et des
 * paramètres de pagination pour qu'aucun dépôt concret n'ait à les répéter
 * (principe de responsabilité unique : le dépôt concret ne décrit que sa
 * ressource, pas la mécanique de transport).
 *
 * Un dépôt de feature s'écrit alors en quelques lignes :
 *
 *   @Injectable({ providedIn: 'root' })
 *   export class MechanicRepository extends HttpRepository<Mechanic> {
 *     protected readonly service = 'mechanics' as const;
 *     protected readonly resource = 'profiles';
 *   }
 */
export abstract class HttpRepository<T, Id = string> implements ReadRepository<T, Id> {
  protected readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  /** Microservice qui héberge la ressource. */
  protected abstract readonly service: MicroserviceName;

  /** Segment de route de la ressource, sans slash. */
  protected abstract readonly resource: string;

  findAll(request?: PageRequest): Observable<Page<T>> {
    const { page, size } = request ?? { page: 0, size: DEFAULT_PAGE_SIZE };
    const params = new HttpParams().set('page', page).set('size', size);

    return this.http.get<Page<T>>(this.url(), { params });
  }

  findById(id: Id): Observable<T> {
    return this.http.get<T>(this.url(String(id)));
  }

  /** URL absolue de la ressource, éventuellement suffixée d'un sous-chemin. */
  protected url(path = ''): string {
    const resourcePath = path === '' ? this.resource : `${this.resource}/${path}`;

    return buildServiceUrl(this.config, this.service, resourcePath);
  }
}
