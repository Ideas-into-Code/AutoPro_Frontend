import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewRequest, RequestDecision } from '../../models/mechanic-dashboard.model';
import { NewRequestDialog } from './new-request-dialog';

const DEMANDE: NewRequest = {
  id: 'req-2026-118',
  clientName: 'Moussa Diop',
  vehicle: 'Toyota Prado',
  problemLabel: 'Bruit au freinage',
  distanceLabel: '2,4 km',
  estimatedPayoutXOF: 15000,
};

describe('NewRequestDialog', () => {
  let fixture: ComponentFixture<NewRequestDialog>;
  let emis: RequestDecision[];

  const rendre = async (request: NewRequest | null, pending = false): Promise<void> => {
    fixture = TestBed.createComponent(NewRequestDialog);
    fixture.componentRef.setInput('request', request);
    fixture.componentRef.setInput('pending', pending);

    emis = [];
    fixture.componentInstance.decided.subscribe((d) => emis.push(d));

    await fixture.whenStable();
  };

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const boite = (): HTMLDialogElement => hote().querySelector('dialog') as HTMLDialogElement;

  const bouton = (libelle: string): HTMLButtonElement =>
    [...hote().querySelectorAll('button')].find((b) =>
      b.textContent?.includes(libelle),
    ) as HTMLButtonElement;

  beforeEach(async () => {
    // `showModal` et `close` ne sont pas implémentés par l'environnement de
    // test : on les remplace par une simple bascule de l'attribut `open`,
    // ce qui suffit à vérifier le comportement du composant.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
      this.open = false;
    };

    await TestBed.configureTestingModule({ imports: [NewRequestDialog] }).compileComponents();
  });

  it('reste fermée tant', async () => {
    await rendre(null);

    expect(boite().open).toBe(false);
  });

  it("s'ouvre dès qu'une demande arrive", async () => {
    await rendre(DEMANDE);

    expect(boite().open).toBe(true);
  });

  it('utilise un dialog natif, et non un div superposé', async () => {
    await rendre(DEMANDE);

    // C'est ce qui apporte le piégeage du focus, la touche Échap et le fond
    // inerte sans avoir à les réécrire.
    expect(boite().tagName).toBe('DIALOG');
  });

  it('affiche ce qui permet de décider en quelques secondes', async () => {
    await rendre(DEMANDE);

    const texte = hote().textContent?.replace(/[\u00A0\u202F\u2009]/g, ' ') ?? '';

    expect(texte).toContain('Moussa Diop');
    expect(texte).toContain('Toyota Prado');
    expect(texte).toContain('Bruit au freinage');
    expect(texte).toContain('2,4 km');
    expect(texte).toContain('15 000');
  });

  it('émet l’acceptation', async () => {
    await rendre(DEMANDE);

    bouton('Accepter').click();
    await fixture.whenStable();

    expect(emis).toEqual(['acceptee']);
  });

  it('émet le refus', async () => {
    await rendre(DEMANDE);

    bouton('Refuser').click();
    await fixture.whenStable();

    expect(emis).toEqual(['refusee']);
  });

  it('traduit la fermeture par Échap en refus explicite', async () => {
    await rendre(DEMANDE);

    // Sans cela, la demande disparaîtrait de l'écran sans que le serveur en
    // sache rien.
    boite().dispatchEvent(new Event('close'));
    await fixture.whenStable();

    expect(emis).toEqual(['refusee']);
  });

  it("se referme quand l'écran retire la demande", async () => {
    await rendre(DEMANDE);
    expect(boite().open).toBe(true);

    fixture.componentRef.setInput('request', null);
    await fixture.whenStable();

    expect(boite().open).toBe(false);
  });
});
