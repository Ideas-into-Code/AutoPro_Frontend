import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG, DEFAULT_API_CONFIG } from '@core';
import { AuthService } from '@core/services/auth.service';
import { HomeHighlightsRepository } from './home-highlights.repository';
import { HttpHomeHighlightsRepository } from './home-highlights.repository.http';

const authStub = { token: () => 'jwt' } as unknown as AuthService;

describe('HttpHomeHighlightsRepository', () => {
  let repo: HomeHighlightsRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        { provide: AuthService, useValue: authStub },
        { provide: HomeHighlightsRepository, useClass: HttpHomeHighlightsRepository },
        HttpClient,
      ],
    });
    repo = TestBed.inject(HomeHighlightsRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('interroge /nearby autour de Dakar, disponibles seulement', () => {
    let result: readonly unknown[] | undefined;
    repo.nearbyMechanics().subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === '/api/mechanics/nearby');
    expect(req.request.params.get('onlyAvailable')).toBe('true');
    expect(req.request.params.get('latitude')).toBe('14.6937');

    req.flush([
      {
        id: 5,
        fullName: 'Awa Diop',
        firstName: 'Awa',
        lastName: 'Diop',
        specialization: 'Pneu et freinage',
        averageRating: 4.5,
        distanceKm: 1.23,
      },
    ]);

    expect(result).toEqual([
      { id: '5', name: 'Awa Diop', district: '', distance: '1.2 km', rating: 4.5, tags: ['Pneu', 'freinage'] },
    ]);
  });

  it('renvoie une liste vide plutôt qu’une erreur si l’API échoue', () => {
    let result: readonly unknown[] | undefined = undefined;
    repo.recentRequests().subscribe((r) => (result = r));

    http.expectOne('/api/service-requests').flush('Erreur', {
      status: 500,
      statusText: 'Server Error',
    });

    expect(result).toEqual([]);
  });

  it('n’appelle pas l’API des demandes sans token', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        { provide: AuthService, useValue: { token: () => null } },
        { provide: HomeHighlightsRepository, useClass: HttpHomeHighlightsRepository },
        HttpClient,
      ],
    });
    const anon = TestBed.inject(HomeHighlightsRepository);
    const anonHttp = TestBed.inject(HttpTestingController);

    let result: readonly unknown[] | undefined;
    anon.recentRequests().subscribe((r) => (result = r));

    anonHttp.expectNone('/api/service-requests');
    expect(result).toEqual([]);
  });

  it('trie les demandes par date décroissante et n’en garde que trois', () => {
    let result: readonly { id: string }[] = [];
    repo.recentRequests().subscribe((r) => (result = r));

    http.expectOne('/api/service-requests').flush([
      { id: 1, problemType: 'BATTERY', status: 'PENDING', createdAt: '2026-09-01T10:00:00' },
      { id: 2, problemType: 'TIRE', status: 'COMPLETED', createdAt: '2026-09-05T10:00:00' },
      { id: 3, problemType: 'ENGINE', status: 'ACCEPTED', createdAt: '2026-09-03T10:00:00' },
      { id: 4, problemType: 'BRAKES', status: 'CANCELLED', createdAt: '2026-09-04T10:00:00' },
    ]);

    expect(result.map((r) => r.id)).toEqual(['2', '4', '3']);
  });
});
