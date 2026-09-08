import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG, DEFAULT_API_CONFIG } from '@core';
import { HttpProfileRepository } from './profile.repository.http';
import { ProfileRepository } from './profile.repository';
import { Profile } from '../models/profile.model';

describe('HttpProfileRepository', () => {
  let repo: ProfileRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        { provide: ProfileRepository, useClass: HttpProfileRepository },
        HttpClient,
      ],
    });
    repo = TestBed.inject(ProfileRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('ne charge que le compte pour un client', () => {
    let profile: Profile | undefined;
    repo.load().subscribe((p) => (profile = p));

    http.expectOne('/api/users/me').flush({
      id: 1,
      firstName: 'Awa',
      lastName: 'Sow',
      email: 'awa@example.sn',
      phone: '770000000',
      role: 'ROLE_CLIENT',
      mechanicId: null,
    });

    http.expectNone('/api/mechanics/me');
    expect(profile?.account.role).toBe('client');
    expect(profile?.mechanic).toBeNull();
  });

  it('charge aussi la fiche pour un mécanicien', () => {
    let profile: Profile | undefined;
    repo.load().subscribe((p) => (profile = p));

    http.expectOne('/api/users/me').flush({
      id: 2,
      firstName: 'Modou',
      lastName: 'Ba',
      email: 'modou@example.sn',
      phone: null,
      role: 'ROLE_MECHANIC',
      mechanicId: 9,
    });

    http.expectOne('/api/mechanics/me').flush({
      id: 9,
      specialization: 'Freinage',
      experienceYears: 5,
      bio: 'Garage Modou',
      isAvailable: true,
      validationStatus: 'APPROVED',
      latitude: 14.7,
      longitude: -17.45,
    });

    expect(profile?.account.role).toBe('mecanicien');
    expect(profile?.mechanic?.isVerified).toBe(true);
    expect(profile?.mechanic?.latitude).toBe(14.7);
  });

  it('recharge le profil après sauvegarde du compte', () => {
    repo.saveAccount({ firstName: 'A', lastName: 'B', phone: '' }).subscribe();

    const put = http.expectOne(
      (r) => r.url === '/api/users/me' && r.method === 'PUT',
    );
    expect(put.request.body).toEqual({ firstName: 'A', lastName: 'B', phone: '' });
    put.flush({});

    http.expectOne('/api/users/me').flush({
      id: 1,
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.sn',
      phone: '',
      role: 'ROLE_CLIENT',
      mechanicId: null,
    });
  });
});
