import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '../config/api.config';
import { NearbyMechanic, NearbyMechanicQuery } from '../models/nearby-mechanic.model';
import { NearbyMechanicRepository } from './nearby-mechanic.repository';

interface BackendMechanicResponse {
  id: number;
  userId: number;
  fullName: string | null;
  firstName: string;
  lastName: string;
  specialization: string | null;
  bio: string | null;
  isAvailable: boolean;
  validationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  averageRating: number | string | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
}

/** « Pneu et freinage » → ['Pneu', 'freinage']. */
function splitSpecialties(specialization: string | null): string[] {
  if (!specialization) {
    return [];
  }
  return specialization
    .split(/\s*(?:,|;|\/|\bet\b|\+)\s*/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function toNearbyMechanic(b: BackendMechanicResponse): NearbyMechanic {
  return {
    id: String(b.id),
    userId: String(b.userId),
    fullName: b.fullName || `${b.firstName} ${b.lastName}`.trim(),
    specialties: splitSpecialties(b.specialization),
    bio: b.bio ?? '',
    rating: Number(b.averageRating ?? 0),
    reviewCount: b.reviewCount ?? 0,
    isAvailable: b.isAvailable,
    isVerified: b.validationStatus === 'APPROVED',
    latitude: b.latitude ?? 0,
    longitude: b.longitude ?? 0,
    distanceKm: b.distanceKm != null ? Math.round(b.distanceKm * 10) / 10 : 0,
  };
}

@Injectable()
export class HttpNearbyMechanicRepository extends NearbyMechanicRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  findNearby(query: NearbyMechanicQuery): Observable<readonly NearbyMechanic[]> {
    let params = new HttpParams()
      .set('latitude', query.latitude)
      .set('longitude', query.longitude);

    if (query.radiusKm != null) {
      params = params.set('radiusKm', query.radiusKm);
    }
    if (query.specialization) {
      params = params.set('specialization', query.specialization);
    }
    if (query.onlyAvailable != null) {
      params = params.set('onlyAvailable', query.onlyAvailable);
    }

    return this.http
      .get<BackendMechanicResponse[]>(buildServiceUrl(this.config, 'mechanics', 'nearby'), { params })
      .pipe(map((rows) => rows.map(toNearbyMechanic)));
  }
}
