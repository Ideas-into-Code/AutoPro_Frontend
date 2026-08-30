import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingMechanic } from '../../models/admin-dashboard.model';
import { ApprovalQueue, ApprovalReview } from './approval-queue';

const DOSSIERS: readonly PendingMechanic[] = [
  {
    id: 'acc-008',
    fullName: 'Amadou Sall',
    specialty: 'BMW et Audi',
    city: 'Dakar Plateau',
    submittedAt: '2026-07-31',
  },
  {
    id: 'acc-005',
    fullName: 'Fatou Gueye',
    specialty: 'Systèmes hybrides',
    city: 'Almadies',
    submittedAt: '2026-07-29',
  },
];

describe('ApprovalQueue', () => {
  let fixture: ComponentFixture<ApprovalQueue>;
  let emis: ApprovalReview[];

  const rendre = async (dossiers = DOSSIERS, savingId: string | null = null): Promise<void> => {
    fixture = TestBed.createComponent(ApprovalQueue);
    fixture.componentRef.setInput('applications', dossiers);
    fixture.componentRef.setInput('savingId', savingId);

    emis = [];
    fixture.componentInstance.decided.subscribe((d) => emis.push(d));

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const items = (): HTMLLIElement[] => [
    ...hote().querySelectorAll<HTMLLIElement>('.ap-queue__item'),
  ];

  const bouton = (index: number, libelle: string): HTMLButtonElement =>
    [...items()[index].querySelectorAll('button')].find((b) =>
      b.textContent?.includes(libelle),
    ) as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ApprovalQueue] }).compileComponents();
  });

  it('liste les dossiers en attente', async () => {
    await rendre();

    expect(items()).toHaveLength(2);
    expect(items()[0].textContent).toContain('Amadou Sall');
    expect(items()[0].textContent).toContain('BMW et Audi');
  });

  it('annonce le nombre de dossiers', async () => {
    await rendre();

    expect(hote().querySelector('.ap-queue__count')?.textContent).toContain('2 dossiers');
  });

  it('émet la validation du bon dossier', async () => {
    await rendre();

    bouton(1, 'Valider').click();

    expect(emis).toEqual([{ mechanicId: 'acc-005', decision: 'validee' }]);
  });

  it('émet le rejet du bon dossier', async () => {
    await rendre();

    bouton(0, 'Rejeter').click();

    expect(emis).toEqual([{ mechanicId: 'acc-008', decision: 'rejetee' }]);
  });

  it('neutralise le rejet pendant l’envoi de la décision', async () => {
    await rendre(DOSSIERS, 'acc-008');

    // Sans cela, deux clics rapides enverraient deux décisions contradictoires
    // sur le même dossier.
    expect(bouton(0, 'Rejeter').disabled).toBe(true);
  });

  it('reste lisible quand la file est vide', async () => {
    await rendre([]);

    expect(hote().textContent).toContain('Aucune candidature en attente');
  });
});
