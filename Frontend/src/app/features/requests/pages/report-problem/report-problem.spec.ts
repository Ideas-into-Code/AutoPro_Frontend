import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { Position, PositionError, PositionProvider, Vehicle, VehicleRepository } from '@core';
import { InterventionRequest } from '../../models/request.model';
import { InterventionRequestDraft } from '../../models/request-draft.model';
import { RequestRepository } from '../../data/request.repository';
import { ReportProblemPage } from './report-problem';

class DepotDeTest extends RequestRepository {
  /** Dernier brouillon reçu, pour vérifier ce que l'écran envoie réellement. */
  dernierBrouillon: InterventionRequestDraft | null = null;

  constructor(private readonly reponse: () => Observable<InterventionRequest>) {
    super();
  }

  create(draft: InterventionRequestDraft): Observable<InterventionRequest> {
    this.dernierBrouillon = draft;

    return this.reponse();
  }

  list(): Observable<readonly InterventionRequest[]> {
    return of([]);
  }

  findById(): Observable<InterventionRequest> {
    return this.reponse();
  }

  cancel(): Observable<InterventionRequest> {
    return this.reponse();
  }
}

class DepotVehiculesDeTest extends VehicleRepository {
  list(): Observable<readonly Vehicle[]> {
    return of([]);
  }
  create(): Observable<Vehicle> {
    return throwError(() => new Error('non utilisé'));
  }
  update(): Observable<Vehicle> {
    return throwError(() => new Error('non utilisé'));
  }
  remove(): Observable<void> {
    return of(undefined);
  }
}

class PositionsDeTest extends PositionProvider {
  constructor(private readonly reponse: () => Observable<Position>) {
    super();
  }

  current(): Observable<Position> {
    return this.reponse();
  }
}

const ENREGISTREE: InterventionRequest = {
  id: 'req-2026-001',
  clientId: 'usr-client-01',
  clientName: 'Mohamed El Fadel Badji',
  clientPhone: '771234567',
  problemType: 'batterie',
  description: 'La voiture ne démarre plus depuis ce matin.',
  status: 'en_attente',
  isEmergency: false,
  priceXOF: null,
  paymentStatus: null,
  locationAddress: 'Les Almadies, Dakar',
  createdAt: '2026-07-31T10:00:00Z',
  updatedAt: '2026-07-31T10:00:00Z',
};

describe('ReportProblemPage', () => {
  let fixture: ComponentFixture<ReportProblemPage>;
  let depot: DepotDeTest;

  const rendre = async (
    entrees: Record<string, string | undefined> = {},
    options: {
      reponse?: () => Observable<InterventionRequest>;
      position?: () => Observable<Position>;
    } = {},
  ): Promise<void> => {
    depot = new DepotDeTest(options.reponse ?? (() => of(ENREGISTREE)));

    TestBed.configureTestingModule({
      imports: [ReportProblemPage],
      providers: [
        provideRouter([]),
        { provide: RequestRepository, useValue: depot },
        { provide: VehicleRepository, useClass: DepotVehiculesDeTest },
        {
          provide: PositionProvider,
          useValue: new PositionsDeTest(
            options.position ?? (() => throwError(() => new PositionError('non-supportee'))),
          ),
        },
      ],
    });

    fixture = TestBed.createComponent(ReportProblemPage);

    for (const [nom, valeur] of Object.entries(entrees)) {
      fixture.componentRef.setInput(nom, valeur);
    }

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const saisir = async (selecteur: string, valeur: string): Promise<void> => {
    const champ = hote().querySelector(selecteur) as HTMLInputElement | HTMLTextAreaElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  const soumettre = async (): Promise<void> => {
    (hote().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  /** Remplit le formulaire avec un jeu de valeurs valides. */
  const remplirValide = async (): Promise<void> => {
    await saisir('#ap-report-description', 'La voiture ne démarre plus depuis ce matin.');
    await saisir('app-location-picker input', 'Les Almadies, Dakar');
    await saisir('app-form-field[label="Numéro de téléphone"] input', '771234567');
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("présélectionne le type de panne à partir de la catégorie choisie sur l'accueil", async () => {
    await rendre({ categorie: 'panne-moteur' });

    const select = hote().querySelector('#ap-report-type') as HTMLSelectElement;

    // Le tiret du slug devient un underscore côté demandes : c'est le piège
    // que la conversion est là pour absorber.
    expect(select.value).toBe('panne_moteur');
  });

  it('retombe sur « autre » quand on arrive sans catégorie', async () => {
    await rendre({});

    expect((hote().querySelector('#ap-report-type') as HTMLSelectElement).value).toBe('autre');
  });

  it('signale visuellement une demande marquée urgente par le bouton SOS', async () => {
    await rendre({ urgence: 'true' });

    expect(hote().textContent).toContain('urgente');
  });

  it("n'affiche pas la bannière d'urgence pour une demande ordinaire", async () => {
    await rendre({});

    expect(hote().textContent).not.toContain('traitée en priorité');
  });

  it("n'envoie rien tant que le formulaire est incomplet", async () => {
    await rendre({});
    await soumettre();

    expect(depot.dernierBrouillon).toBeNull();
  });

  it('reproche une description trop courte pour être utile', async () => {
    await rendre({});
    await saisir('#ap-report-description', 'ça marche pas');
    await soumettre();

    expect(hote().querySelector('[role="alert"]')?.textContent).toContain('20 caractères');
  });

  it("refuse un numéro qui n'est pas un mobile sénégalais", async () => {
    await rendre({});
    await remplirValide();
    await saisir('app-form-field[label="Numéro de téléphone"] input', '331234567');
    await soumettre();

    expect(depot.dernierBrouillon).toBeNull();
  });

  it('envoie un brouillon complet quand tout est valide', async () => {
    await rendre({ urgence: 'true' });
    await remplirValide();
    await soumettre();

    expect(depot.dernierBrouillon).toMatchObject({
      problemType: 'autre',
      description: 'La voiture ne démarre plus depuis ce matin.',
      contactPhone: '771234567',
      isEmergency: true,
      location: { address: 'Les Almadies, Dakar' },
      photos: [],
    });
  });

  it("n'envoie pas de coordonnées quand la géolocalisation est indisponible", async () => {
    await rendre({});
    await remplirValide();
    await soumettre();

    // Le refus du GPS ne doit pas empêcher l'envoi : l'adresse suffit.
    expect(depot.dernierBrouillon?.location.coordinates).toBeUndefined();
  });

  it('joint les coordonnées quand le relevé aboutit', async () => {
    await rendre(
      {},
      { position: () => of({ latitude: 14.6708, longitude: -17.4373, accuracyMeters: 12 }) },
    );
    await remplirValide();

    const bouton = [...hote().querySelectorAll('button')].find((b) =>
      b.textContent?.includes('position'),
    ) as HTMLButtonElement;
    bouton.click();
    await fixture.whenStable();

    await soumettre();

    expect(depot.dernierBrouillon?.location.coordinates).toEqual({
      latitude: 14.6708,
      longitude: -17.4373,
    });
  });

  it('affiche un accusé de réception avec le numéro de demande', async () => {
    await rendre({});
    await remplirValide();
    await soumettre();

    expect(hote().textContent).toContain('Votre demande est partie');
    expect(hote().textContent).toContain('req-2026-001');
    expect(hote().textContent).toContain("En attente d'un mécanicien");
    expect(hote().querySelector('form')).toBeNull();
  });

  it("laisse le formulaire intact et explique quand l'envoi échoue", async () => {
    await rendre({}, { reponse: () => throwError(() => new Error('réseau indisponible')) });
    await remplirValide();
    await soumettre();

    expect(hote().querySelector('form')).not.toBeNull();
    expect(hote().textContent).toContain("n'a pas pu être envoyée");
  });
});
