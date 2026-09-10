import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { API_CONFIG, Page, PageRequest, buildServiceUrl } from '@core';
import { Mechanic } from '../models/mechanic.model';
import {
  BackendMechanic,
  BackendReview,
  specializationFilter,
  toMechanic,
  toMechanicReview,
} from './mechanic.mapper';
import { MechanicQuery, MechanicRepository } from './mechanic.repository';

/**
 * Mécaniciens contre le backend AutoPro (`/api/mechanics`).
 *
 * Le monolithe renvoie une liste simple (non paginée) et une seule spécialité
 * en texte libre. On enveloppe donc la liste dans une `Page` unique et on
 * filtre par sous-chaîne de spécialité — la mécanique d'adaptation vit dans
 * `mechanic.mapper.ts`, jamais dans les écrans.
 */
export class HttpMechanicRepository extends MechanicRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  findAll(request?: PageRequest): Observable<Page<Mechanic>> {
    return this.search({}, request);
  }

  search(query: MechanicQuery, request?: PageRequest): Observable<Page<Mechanic>> {
    let params = new HttpParams();
    const specialization = specializationFilter(query.categorySlug, query.search);
    if (specialization) {
      params = params.set('specialization', specialization);
    }

    return this.http
      .get<BackendMechanic[]>(this.url(), { params })
      .pipe(map((rows) => this.toPage(rows.map((m) => toMechanic(m)), request)));
  }

  findById(id: string): Observable<Mechanic> {
    return forkJoin({
      profile: this.http.get<BackendMechanic>(this.url(id)),
      reviews: this.http
        .get<BackendReview[]>(this.url(`${id}/reviews`))
        .pipe(map((rows) => rows.map(toMechanicReview))),
    }).pipe(map(({ profile, reviews }) => toMechanic(profile, reviews)));
  }

  private url(path = ''): string {
    return buildServiceUrl(this.config, 'mechanics', path);
  }

  private toPage(items: readonly Mechanic[], request?: PageRequest): Page<Mechanic> {
    const size = request?.size && request.size > 0 ? request.size : items.length || 20;
    return {
      items,
      page: request?.page ?? 0,
      size,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / size)),
    };
  }
}
