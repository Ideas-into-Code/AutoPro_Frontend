import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '../config/api.config';
import { Vehicle, VehicleDraft } from '../models/vehicle.model';
import { VehicleRepository } from './vehicle.repository';

interface BackendVehicle {
  id: number;
  ownerId: number;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  createdAt: string;
}

function toVehicle(b: BackendVehicle): Vehicle {
  return {
    id: String(b.id),
    brand: b.brand,
    model: b.model,
    year: b.year,
    licensePlate: b.licensePlate,
    vin: b.vin,
    color: b.color,
    mileage: b.mileage,
    createdAt: b.createdAt,
  };
}

function toPayload(d: VehicleDraft): Record<string, unknown> {
  return {
    brand: d.brand,
    model: d.model,
    year: d.year,
    licensePlate: d.licensePlate,
    ...(d.vin ? { vin: d.vin } : {}),
    ...(d.color ? { color: d.color } : {}),
    ...(d.mileage != null ? { mileage: d.mileage } : {}),
  };
}

@Injectable()
export class HttpVehicleRepository extends VehicleRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  private url(path = ''): string {
    return buildServiceUrl(this.config, 'vehicles', path);
  }

  list(): Observable<readonly Vehicle[]> {
    return this.http.get<BackendVehicle[]>(this.url()).pipe(map((rows) => rows.map(toVehicle)));
  }

  create(draft: VehicleDraft): Observable<Vehicle> {
    return this.http.post<BackendVehicle>(this.url(), toPayload(draft)).pipe(map(toVehicle));
  }

  update(id: string, draft: VehicleDraft): Observable<Vehicle> {
    return this.http.put<BackendVehicle>(this.url(id), toPayload(draft)).pipe(map(toVehicle));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url(id)).pipe(map(() => undefined));
  }
}
