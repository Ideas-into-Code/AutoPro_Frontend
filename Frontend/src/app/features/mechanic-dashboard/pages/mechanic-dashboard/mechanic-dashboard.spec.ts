import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import {
  Availability,
  EarningsSummary,
  NewRequest,
  RequestDecision,
} from '../../models/mechanic-dashboard.model';
import {
  MechanicAvailabilityRepository,
  MechanicDashboardRepository,
  RequestDecisionRepository,
} from '../../data/mechanic-dashboard.repository';
import { MechanicDashboardPage } from './mechanic-dashboard';

const GAINS: EarningsSummary = {
  todayXOF: 145500,
  trendPercent: 12,
  points: [{ label: 'Lun', amountXOF: 50000 }],
};

const DEMANDE: NewRequest = {
  id: 'req-1',
  clientName: 'Moussa Diop',
  vehicle: 'Toyota Prado',
  problemLabel: 'Bruit au freinage',
  distanceLabel: '2,4 km',
  estimatedPayoutXOF: 15000,
};

class DepotDeTest extends MechanicDashboardRepository {
  constructor(private readonly demande: NewRequest | null) {
    super();
  }

  earnings(): Observable<EarningsSummary> {
    return of(GAINS);
  }

  incomingRequest(): Observable<NewRequest | null> {
    return of(this.demande);
  }
}

class DisponibiliteDeTest extends MechanicAvailabilityRepository {
  dernierEnvoi: boolean | null = null;

  constructor(
    private enLigne: boolean,
    private readonly echoue = false,
  ) {
    super();
  }

  current(): Observable<Availability> {
    return of({ isOnline: this.enLigne });
  }

  update(isOnline: boolean): Observable<Availability> {
    this.dernierEnvoi = isOnline;

    if (this.echoue) {
      return throwError(() => new Error('réseau indisponible'));
    }

    this.enLigne = isOnline;

    return of({ isOnline });
  }
}

class DecisionsDeTest extends RequestDecisionRepository {
  derniere: { id: string; decision: RequestDecision } | null = null;

  decide(requestId: string, decision: RequestDecision): Observable<void> {
    this.derniere = { id: requestId, decision };

    return of(undefined);
  }
}

describe('MechanicDashboardPage', () => {
  let fixture: ComponentFixture<MechanicDashboardPage>;
  let disponibilite: DisponibiliteDeTest;
  let decisions: DecisionsDeTest;

  const rendre = async (
    options: { enLigne?: boolean; demande?: NewRequest | null; echecBascule?: boolean } = {},
  ): Promise<void> => {
    disponibilite = new DisponibiliteDeTest(options.enLigne ?? true, options.echecBascule ?? false);
    decisions = new DecisionsDeTest();

    TestBed.configureTestingModule({
      imports: [MechanicDashboardPage],
      providers: [
        {
          provide: MechanicDashboardRepository,
          // `??` retomberait sur DEMANDE quand le test passe `null` exprès.
          useValue: new DepotDeTest('demande' in options ? (options.demande ?? null) : DEMANDE),
        },
        { provide: MechanicAvailabilityRepository, useValue: disponibilite },
        { provide: RequestDecisionRepository, useValue: decisions },
      ],
    });

    fixture = TestBed.createComponent(MechanicDashboardPage);
    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const popupOuverte = (): boolean =>
    hote().querySelector<HTMLDialogElement>('dialog')?.open === true;

  const bascule = (): HTMLInputElement =>
    hote().querySelector('input[type="checkbox"]') as HTMLInputElement;

  const etatAffiche = (): string =>
    hote().querySelector('.ap-availability__state')?.textContent?.trim() ?? '';

  const basculer = async (vers: boolean): Promise<void> => {
    bascule().checked = vers;
    bascule().dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };

  const bouton = (libelle: string): HTMLButtonElement =>
    [...hote().querySelectorAll('button')].find((b) =>
      b.textContent?.includes(libelle),
    ) as HTMLButtonElement;

  beforeEach(async () => {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
      this.open = false;
    };

    await TestBed.configureTestingModule({}).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('affiche les gains du jour', async () => {
    await rendre();

    expect(hote().textContent?.replace(/[\u00A0\u202F\u2009]/g, ' ')).toContain('145 500');
  });

  it('propose la demande entrante quand le mécanicien est en ligne', async () => {
    await rendre({ enLigne: true });

    expect(popupOuverte()).toBe(true);
  });

  it('ne propose aucune demande quand le mécanicien est hors ligne', async () => {
    // C'est tout l'objet de la bascule : « cessez de recevoir des demandes »
    // n'aurait aucun sens si la popup s'ouvrait malgré tout.
    await rendre({ enLigne: false });

    expect(popupOuverte()).toBe(false);
  });

  it('referme la popup dès que le mécanicien passe hors ligne', async () => {
    await rendre({ enLigne: true });
    expect(popupOuverte()).toBe(true);

    await basculer(false);

    expect(popupOuverte()).toBe(false);
  });

  it('ne rouvre pas une demande déjà traitée', async () => {
    await rendre({ enLigne: true });

    bouton('Refuser').click();
    await fixture.whenStable();

    expect(decisions.derniere).toEqual({ id: 'req-1', decision: 'refusee' });
    expect(popupOuverte()).toBe(false);
  });

  it('transmet la disponibilité choisie au dépôt', async () => {
    await rendre({ enLigne: true });

    await basculer(false);

    expect(disponibilite.dernierEnvoi).toBe(false);
  });

  it("revient à l'état du serveur et l'explique si la bascule échoue", async () => {
    await rendre({ enLigne: true, echecBascule: true });

    await basculer(false);

    // On lit l'état affiché plutôt que l'attribut `checked` : le test l'a
    // forcé lui-même dans le DOM, et la liaison Angular ne le réécrit pas
    // puisque de son point de vue la valeur n'a pas changé.
    //
    // Laisser l'interrupteur sur « hors ligne » ferait croire au mécanicien
    // qu'il ne reçoit plus rien, alors que le serveur le sait toujours en ligne.
    expect(etatAffiche()).toBe('En ligne');
    expect(hote().querySelector('[role="alert"]')?.textContent).toContain(
      'pas pu être enregistrée',
    );
  });

  it("n'affiche pas de popup quand aucune demande n'arrive", async () => {
    await rendre({ demande: null });

    expect(popupOuverte()).toBe(false);
  });
});
