import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG, DEFAULT_API_CONFIG, ImageUploadService } from '@core';
import { InterventionRequestDraft } from '../models/request-draft.model';
import { HttpRequestRepository } from './request.repository.http';
import { RequestRepository } from './request.repository';

function draft(photos: File[]): InterventionRequestDraft {
  return {
    problemType: 'batterie',
    description: 'La voiture ne démarre plus.',
    location: { address: 'Plateau, Dakar' },
    contactPhone: '770000000',
    isEmergency: false,
    photos,
  };
}

describe('HttpRequestRepository', () => {
  let repo: RequestRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        { provide: RequestRepository, useClass: HttpRequestRepository },
        ImageUploadService,
        HttpClient,
      ],
    });
    repo = TestBed.inject(RequestRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('téléverse les photos puis crée la demande avec leurs URLs', () => {
    const file = new File(['x'], 'p.png', { type: 'image/png' });
    repo.create(draft([file])).subscribe();

    const upload = http.expectOne('/api/files/image');
    expect(upload.request.method).toBe('POST');
    upload.flush({ secureUrl: 'https://res.cloudinary.com/x/p.png', url: '' });

    const create = http.expectOne('/api/service-requests');
    expect(create.request.body.photoUrls).toEqual(['https://res.cloudinary.com/x/p.png']);
    create.flush({ id: 1, clientId: 1, status: 'PENDING', photoUrls: [] });
  });

  it('ne téléverse rien quand il n’y a pas de photo', () => {
    repo.create(draft([])).subscribe();

    http.expectNone('/api/files/image');
    const create = http.expectOne('/api/service-requests');
    expect(create.request.body.photoUrls).toBeUndefined();
    create.flush({ id: 1, clientId: 1, status: 'PENDING' });
  });

  it('envoie le motif choisi lors de l’annulation', () => {
    repo.cancel('7', 'PRICE_TOO_HIGH').subscribe();

    const req = http.expectOne('/api/service-requests/7/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'CANCELLED', cancellationReason: 'PRICE_TOO_HIGH' });
    req.flush({ id: 7, clientId: 1, status: 'CANCELLED', cancellationReason: 'PRICE_TOO_HIGH' });
  });
});
