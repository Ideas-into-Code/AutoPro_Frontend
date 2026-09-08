import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG, DEFAULT_API_CONFIG } from '../config/api.config';
import { HttpNearbyMechanicRepository } from './nearby-mechanic.repository.http';
import { NearbyMechanicRepository } from './nearby-mechanic.repository';

describe('HttpNearbyMechanicRepository', () => {
  let repo: NearbyMechanicRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        { provide: NearbyMechanicRepository, useClass: HttpNearbyMechanicRepository },
        HttpClient,
      ],
    });
    repo = TestBed.inject(NearbyMechanicRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('passe les paramètres de recherche et mappe la réponse backend', () => {
    let result: readonly unknown[] | undefined;
    repo
      .findNearby({ latitude: 14.69, longitude: -17.44, radiusKm: 30, onlyAvailable: false })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne(
      (r) => r.url === '/api/mechanics/nearby' && r.method === 'GET',
    );
    expect(req.request.params.get('latitude')).toBe('14.69');
    expect(req.request.params.get('longitude')).toBe('-17.44');
    expect(req.request.params.get('radiusKm')).toBe('30');
    expect(req.request.params.get('onlyAvailable')).toBe('false');

    req.flush([
      {
        id: 7,
        userId: 42,
        fullName: 'Awa Diop',
        firstName: 'Awa',
        lastName: 'Diop',
        specialization: 'Pneu et freinage',
        bio: 'Garage Awa',
        isAvailable: true,
        validationStatus: 'APPROVED',
        averageRating: '4.5',
        reviewCount: 12,
        latitude: 14.7,
        longitude: -17.47,
        distanceKm: 2.567,
      },
    ]);

    expect(result).toEqual([
      {
        id: '7',
        userId: '42',
        fullName: 'Awa Diop',
        specialties: ['Pneu', 'freinage'],
        bio: 'Garage Awa',
        rating: 4.5,
        reviewCount: 12,
        isAvailable: true,
        isVerified: true,
        latitude: 14.7,
        longitude: -17.47,
        distanceKm: 2.6,
      },
    ]);
  });

  it('omet les paramètres facultatifs absents', () => {
    repo.findNearby({ latitude: 1, longitude: 2 }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/mechanics/nearby');
    expect(req.request.params.has('radiusKm')).toBe(false);
    expect(req.request.params.has('onlyAvailable')).toBe(false);
    expect(req.request.params.has('specialization')).toBe(false);
    req.flush([]);
  });
});
