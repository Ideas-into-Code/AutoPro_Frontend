import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';

import { API_CONFIG, buildServiceUrl } from '@core';
import {
  AccountPatch,
  AccountProfile,
  MechanicPatch,
  MechanicProfile,
  Profile,
  ProfileRole,
} from '../models/profile.model';
import { ProfileRepository } from './profile.repository';

interface BackendUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  mechanicId: number | null;
}

interface BackendMechanic {
  id: number;
  specialization: string | null;
  experienceYears: number | null;
  bio: string | null;
  isAvailable: boolean;
  validationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  latitude: number | null;
  longitude: number | null;
}

const ROLE: Readonly<Record<string, ProfileRole>> = {
  ROLE_CLIENT: 'client',
  ROLE_MECHANIC: 'mecanicien',
  ROLE_ADMIN: 'admin',
};

function toAccount(u: BackendUser): AccountProfile {
  return {
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone ?? '',
    email: u.email,
    role: ROLE[u.role] ?? 'client',
  };
}

function toMechanic(m: BackendMechanic): MechanicProfile {
  return {
    specialization: m.specialization ?? '',
    experienceYears: m.experienceYears,
    bio: m.bio ?? '',
    isAvailable: m.isAvailable,
    isVerified: m.validationStatus === 'APPROVED',
    latitude: m.latitude,
    longitude: m.longitude,
  };
}

export class HttpProfileRepository extends ProfileRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  private get usersMe(): string {
    return buildServiceUrl(this.config, 'users', 'me');
  }

  private get mechanicsMe(): string {
    return buildServiceUrl(this.config, 'mechanics', 'me');
  }

  load(): Observable<Profile> {
    return this.http.get<BackendUser>(this.usersMe).pipe(
      switchMap((user) => {
        const account = toAccount(user);
        if (account.role !== 'mecanicien') {
          return of<Profile>({ account, mechanic: null });
        }
        return this.http
          .get<BackendMechanic>(this.mechanicsMe)
          .pipe(map((m) => ({ account, mechanic: toMechanic(m) })));
      }),
    );
  }

  saveAccount(patch: AccountPatch): Observable<Profile> {
    return this.http
      .put<BackendUser>(this.usersMe, {
        firstName: patch.firstName,
        lastName: patch.lastName,
        phone: patch.phone,
      })
      .pipe(switchMap(() => this.load()));
  }

  saveMechanic(patch: MechanicPatch): Observable<Profile> {
    return this.http
      .put<BackendMechanic>(this.mechanicsMe, {
        specialization: patch.specialization,
        experienceYears: patch.experienceYears,
        bio: patch.bio,
        isAvailable: patch.isAvailable,
        latitude: patch.latitude,
        longitude: patch.longitude,
      })
      .pipe(switchMap(() => this.load()));
  }
}

/** Adaptateurs exportés pour les tests. */
export const __testing = { toAccount, toMechanic };
