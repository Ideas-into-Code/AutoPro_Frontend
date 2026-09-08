import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import {
  AccountStatus,
  ApprovalDecision,
  ManagedAccount,
  PendingMechanic,
  SystemMetric,
} from '../../models/admin-dashboard.model';
import {
  AccountDirectoryRepository,
  AccountModerationRepository,
  MechanicApprovalRepository,
  SystemOverviewRepository,
} from '../../data/admin-dashboard.repository';
import { AdminDashboardPage } from './admin-dashboard';

const INDICATEUR: SystemMetric = {
  id: 'utilisateurs',
  label: 'Utilisateurs inscrits',
  value: 14284,
  icon: 'groupes',
  trendPercent: 12,
  direction: 'hausse',
};

const COMPTE: ManagedAccount = {
  id: 'acc-001',
  fullName: 'Moussa Diop',
  email: 'moussa.diop@example.sn',
  role: 'client',
  status: 'actif',
  city: 'Dakar Plateau',
  registeredAt: '2026-01-14',
};

const DOSSIER: PendingMechanic = {
  id: 'acc-008',
  fullName: 'Amadou Sall',
  specialty: 'BMW et Audi',
  city: 'Dakar Plateau',
  submittedAt: '2026-07-31',
};

/** Serveur d'administration doublé, entièrement piloté par le test. */
class FauxBackend
  extends SystemOverviewRepository
  implements AccountDirectoryRepository, AccountModerationRepository, MechanicApprovalRepository
{
  lecturesComptes = 0;
  lecturesFile = 0;
  lecturesMetrics = 0;
  statuts: { accountId: string; status: AccountStatus }[] = [];
  decisions: { mechanicId: string; decision: ApprovalDecision }[] = [];

  /** Bascule à `true` pour vérifier le traitement d'un échec réseau. */
  echoueEnEcriture = false;

  metrics(): Observable<readonly SystemMetric[]> {
    this.lecturesMetrics += 1;

    return of([INDICATEUR]);
  }

  accounts(): Observable<readonly ManagedAccount[]> {
    this.lecturesComptes += 1;

    return of([COMPTE]);
  }

  setStatus(accountId: string, status: AccountStatus): Observable<ManagedAccount> {
    this.statuts.push({ accountId, status });

    if (this.echoueEnEcriture) {
      return throwError(() => new Error('réseau'));
    }

    return of({ ...COMPTE, status });
  }

  pending(): Observable<readonly PendingMechanic[]> {
    this.lecturesFile += 1;

    return of([DOSSIER]);
  }

  decide(mechanicId: string, decision: ApprovalDecision): Observable<void> {
    this.decisions.push({ mechanicId, decision });

    if (this.echoueEnEcriture) {
      return throwError(() => new Error('réseau'));
    }

    return of(undefined);
  }
}

describe('AdminDashboardPage', () => {
  let fixture: ComponentFixture<AdminDashboardPage>;
  let backend: FauxBackend;

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const bouton = (libelle: string): HTMLButtonElement =>
    [...hote().querySelectorAll('button')].find((b) =>
      b.textContent?.includes(libelle),
    ) as HTMLButtonElement;

  const rendre = async (): Promise<void> => {
    fixture = TestBed.createComponent(AdminDashboardPage);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    backend = new FauxBackend();

    await TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [
        { provide: SystemOverviewRepository, useValue: backend },
        { provide: AccountDirectoryRepository, useValue: backend },
        { provide: AccountModerationRepository, useValue: backend },
        { provide: MechanicApprovalRepository, useValue: backend },
      ],
    }).compileComponents();
  });

  it('réunit les trois blocs du ticket', async () => {
    await rendre();

    expect(hote().querySelector('app-metric-card')).not.toBeNull();
    expect(hote().querySelector('app-accounts-table')).not.toBeNull();
    expect(hote().querySelector('app-approval-queue')).not.toBeNull();
  });

  it('transmet la suspension au dépôt de modération', async () => {
    await rendre();

    bouton('Suspendre').click();
    await fixture.whenStable();

    expect(backend.statuts).toEqual([{ accountId: 'acc-001', status: 'suspendu' }]);
  });

  it('relit les comptes après une modération réussie', async () => {
    await rendre();
    const avant = backend.lecturesComptes;

    bouton('Suspendre').click();
    await fixture.whenStable();

    // Le serveur fait autorité sur le statut enregistré : on relit plutôt que
    // de modifier la liste sur place.
    expect(backend.lecturesComptes).toBeGreaterThan(avant);
  });

  it('relit AUSSI les comptes après une validation', async () => {
    await rendre();
    const avant = backend.lecturesComptes;

    bouton('Valider').click();
    await fixture.whenStable();

    // Valider une candidature fait passer le compte à « actif » : la table et
    // la file doivent dire la même chose.
    expect(backend.decisions).toEqual([{ mechanicId: 'acc-008', decision: 'validee' }]);
    expect(backend.lecturesComptes).toBeGreaterThan(avant);
  });

  it('relit les indicateurs après une écriture réussie', async () => {
    await rendre();
    const avant = backend.lecturesMetrics;

    bouton('Valider').click();
    await fixture.whenStable();

    // « Validés » et « en attente » viennent de bouger : les cartes seraient
    // sinon en contradiction avec la file juste en dessous.
    expect(backend.lecturesMetrics).toBeGreaterThan(avant);
  });

  it('signale un échec d’écriture sans vider l’écran', async () => {
    await rendre();
    backend.echoueEnEcriture = true;

    bouton('Rejeter').click();
    await fixture.whenStable();

    expect(hote().querySelector('[role="alert"]')?.textContent).toContain(
      "n'a pas pu être enregistrée",
    );
    // Le dossier reste affiché : il n'est pas perdu, l'administrateur réessaie.
    expect(hote().querySelector('app-approval-queue')).not.toBeNull();
  });
});
