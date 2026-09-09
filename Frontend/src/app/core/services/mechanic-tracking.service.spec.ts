import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { API_CONFIG, DEFAULT_API_CONFIG } from '../config/api.config';
import { MechanicTrackingService, haversineKm } from './mechanic-tracking.service';
import { RealtimeSocketService } from './realtime-socket.service';

class FakeSocket {
  topic = new Subject<unknown>();
  published: { destination: string; body: unknown }[] = [];
  watch<T>(): Subject<T> {
    return this.topic as Subject<T>;
  }
  publish(destination: string, body: unknown): void {
    this.published.push({ destination, body });
  }
}

describe('MechanicTrackingService', () => {
  let service: MechanicTrackingService;
  let socket: FakeSocket;
  let http: HttpTestingController;

  beforeEach(() => {
    socket = new FakeSocket();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        { provide: RealtimeSocketService, useValue: socket },
        MechanicTrackingService,
      ],
    });
    service = TestBed.inject(MechanicTrackingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('mappe la trame backend en LiveLocation', () => {
    const recu: unknown[] = [];
    service.watch('9').subscribe((l) => recu.push(l));

    socket.topic.next({
      mechanicId: 9,
      latitude: 14.7,
      longitude: -17.45,
      heading: 90,
      timestamp: '2026-09-09T10:00:00Z',
    });

    expect(recu).toEqual([
      { mechanicId: '9', latitude: 14.7, longitude: -17.45, heading: 90, at: '2026-09-09T10:00:00Z' },
    ]);
  });

  it('lit la dernière position via GET /api/mechanics/{id}', () => {
    let pos: unknown;
    service.lastKnownPosition('9').subscribe((p) => (pos = p));

    http.expectOne('/api/mechanics/9').flush({ latitude: 14.69, longitude: -17.44 });
    expect(pos).toEqual({ latitude: 14.69, longitude: -17.44 });
  });

  it('renvoie null si la position n’est pas renseignée', () => {
    let pos: unknown = 'x';
    service.lastKnownPosition('9').subscribe((p) => (pos = p));
    http.expectOne('/api/mechanics/9').flush({ latitude: null, longitude: null });
    expect(pos).toBeNull();
  });
});

describe('haversineKm', () => {
  it('mesure une distance connue', () => {
    const d = haversineKm(
      { latitude: 14.6937, longitude: -17.4441 },
      { latitude: 14.7167, longitude: -17.4677 },
    );
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(4);
  });

  it('vaut 0 pour deux points identiques', () => {
    const p = { latitude: 14.7, longitude: -17.4 };
    expect(haversineKm(p, p)).toBe(0);
  });
});
