import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagedAccount } from '../../models/admin-dashboard.model';
import { AccountModeration, AccountsTable } from './accounts-table';

const COMPTES: readonly ManagedAccount[] = [
  {
    id: 'acc-001',
    fullName: 'Moussa Diop',
    email: 'moussa.diop@example.sn',
    role: 'client',
    status: 'actif',
    city: 'Dakar Plateau',
    registeredAt: '2026-01-14',
  },
  {
    id: 'acc-003',
    fullName: 'Samba Fall',
    email: 'samba.fall@autopro.sn',
    role: 'mecanicien',
    status: 'suspendu',
    city: 'Pikine',
    registeredAt: '2025-11-22',
  },
  {
    id: 'acc-008',
    fullName: 'Amadou Sall',
    email: 'amadou.sall@autopro.sn',
    role: 'mecanicien',
    status: 'en_attente',
    city: 'Thiès',
    registeredAt: '2026-07-31',
  },
];

describe('AccountsTable', () => {
  let fixture: ComponentFixture<AccountsTable>;
  let emis: AccountModeration[];

  const rendre = async (comptes = COMPTES): Promise<void> => {
    fixture = TestBed.createComponent(AccountsTable);
    fixture.componentRef.setInput('accounts', comptes);

    emis = [];
    fixture.componentInstance.moderationRequested.subscribe((m) => emis.push(m));

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const lignes = (): HTMLTableRowElement[] => [
    ...hote().querySelectorAll<HTMLTableRowElement>('tbody tr'),
  ];

  const noms = (): string[] =>
    lignes()
      .map((ligne) => ligne.querySelector('.ap-accounts__name')?.textContent?.trim() ?? '')
      .filter((nom) => nom !== '');

  const cliquer = (element: Element | null | undefined): void => {
    (element as HTMLElement | undefined)?.click();
    fixture.detectChanges();
  };

  const onglet = (libelle: string): HTMLButtonElement =>
    [...hote().querySelectorAll('.ap-accounts__tab')].find(
      (b) => b.textContent?.trim() === libelle,
    ) as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AccountsTable] }).compileComponents();
  });

  it('affiche tous les comptes par défaut', async () => {
    await rendre();

    expect(noms()).toEqual(['Moussa Diop', 'Samba Fall', 'Amadou Sall']);
  });

  it('filtre sur les clients', async () => {
    await rendre();

    cliquer(onglet('Clients'));

    expect(noms()).toEqual(['Moussa Diop']);
  });

  it('filtre sur les mécaniciens', async () => {
    await rendre();

    cliquer(onglet('Mécaniciens'));

    expect(noms()).toEqual(['Samba Fall', 'Amadou Sall']);
  });

  it('recherche sur la ville autant que sur le nom', async () => {
    await rendre();

    // L'administrateur cherche souvent par quartier, pas seulement par nom.
    const barre = hote().querySelector('input') as HTMLInputElement;
    barre.value = 'pikine';
    barre.dispatchEvent(new Event('input'));
    (hote().querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    fixture.detectChanges();

    expect(noms()).toEqual(['Samba Fall']);
  });

  it('demande la suspension d’un compte actif', async () => {
    await rendre();

    cliquer(lignes()[0].querySelector('button'));

    expect(emis).toEqual([{ accountId: 'acc-001', status: 'suspendu' }]);
  });

  it('demande la réactivation d’un compte suspendu', async () => {
    await rendre();

    cliquer(lignes()[1].querySelector('button'));

    expect(emis).toEqual([{ accountId: 'acc-003', status: 'actif' }]);
  });

  it('ne propose aucune bascule sur un dossier en attente', async () => {
    await rendre();

    // Un dossier se tranche dans la file de validation, où l'administrateur
    // voit la spécialité et les justificatifs — pas depuis la table.
    expect(lignes()[2].querySelector('button')).toBeNull();
    expect(lignes()[2].textContent).toContain('Dossier à valider');
  });

  it('annonce le nombre de comptes affichés', async () => {
    await rendre();

    cliquer(onglet('Clients'));

    expect(hote().querySelector('.ap-accounts__summary')?.textContent).toContain('1 compte');
  });

  it('reste lisible sans aucun compte', async () => {
    await rendre([]);

    expect(hote().textContent).toContain('Aucun compte');
  });
});
