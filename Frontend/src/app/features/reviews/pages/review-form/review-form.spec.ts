import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { ReviewSubmissionRepository, ReviewTargetRepository } from '../../data/review.repository';
import { ReviewDraft, ReviewTarget } from '../../models/review.model';
import { ReviewFormPage } from './review-form';

const INTERVENTION: ReviewTarget = {
  interventionId: 'int-2026-0412',
  mechanicId: 'mec-014',
  mechanicName: 'Modou Niang',
  mechanicSpecialty: 'Freinage et suspension',
  serviceLabel: 'Remplacement des plaquettes de frein',
  completedAt: '2026-09-01T16:20:00',
};

class FausseCible extends ReviewTargetRepository {
  pending(): Observable<ReviewTarget> {
    return of(INTERVENTION);
  }
}

class FauxEnvoi extends ReviewSubmissionRepository {
  envois: ReviewDraft[] = [];
  echoue = false;

  submit(draft: ReviewDraft): Observable<void> {
    this.envois.push(draft);

    return this.echoue ? throwError(() => new Error('réseau')) : of(undefined);
  }
}

describe('ReviewFormPage', () => {
  let fixture: ComponentFixture<ReviewFormPage>;
  let envois: FauxEnvoi;

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const etoile = (index: number): HTMLInputElement =>
    hote().querySelectorAll<HTMLInputElement>('input[type="radio"]')[index];

  const boutonEnvoyer = (): HTMLButtonElement =>
    [...hote().querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Envoyer mon avis'),
    ) as HTMLButtonElement;

  const zoneCommentaire = (): HTMLTextAreaElement =>
    hote().querySelector('textarea') as HTMLTextAreaElement;

  const saisir = (texte: string): void => {
    zoneCommentaire().value = texte;
    zoneCommentaire().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const noter = (index: number): void => {
    etoile(index).click();
    fixture.detectChanges();
  };

  const rendre = async (): Promise<void> => {
    fixture = TestBed.createComponent(ReviewFormPage);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    envois = new FauxEnvoi();

    await TestBed.configureTestingModule({
      imports: [ReviewFormPage],
      providers: [
        provideRouter([]),
        { provide: ReviewTargetRepository, useClass: FausseCible },
        { provide: ReviewSubmissionRepository, useValue: envois },
      ],
    }).compileComponents();
  });

  it('rappelle ce qui est noté', async () => {
    await rendre();

    const texte = hote().textContent ?? '';

    // Un avis sans contexte ne vaut rien : on doit voir qui et quoi on note.
    expect(texte).toContain('Modou Niang');
    expect(texte).toContain('remplacement des plaquettes de frein');
  });

  it('réunit les deux tâches du ticket', async () => {
    await rendre();

    expect(hote().querySelector('app-rating-stars')).not.toBeNull();
    expect(hote().querySelector('app-photo-upload')).not.toBeNull();
  });

  it('interdit l’envoi tant qu’aucune note n’est donnée', async () => {
    await rendre();

    // La note est la seule information indispensable.
    expect(boutonEnvoyer().disabled).toBe(true);
  });

  it('autorise l’envoi dès la note posée, sans commentaire', async () => {
    await rendre();

    noter(4);

    // Exiger un commentaire ferait écrire n'importe quoi à qui veut seulement
    // mettre cinq étoiles.
    expect(boutonEnvoyer().disabled).toBe(false);
  });

  it('transmet la note, le commentaire et l’intervention', async () => {
    await rendre();

    noter(4);
    saisir('Travail rapide et soigné.');
    boutonEnvoyer().click();
    await fixture.whenStable();

    expect(envois.envois).toEqual([
      {
        interventionId: 'int-2026-0412',
        rating: 5,
        comment: 'Travail rapide et soigné.',
        photos: [],
      },
    ]);
  });

  it('coupe le commentaire à la limite du serveur', async () => {
    await rendre();

    saisir('a'.repeat(600));

    // Coupé à la source : le compteur ne peut jamais afficher un dépassement,
    // et le serveur ne reçoit rien qu'il devrait rejeter.
    expect(hote().querySelector('.ap-review__counter')?.textContent).toContain('500/500');
  });

  it('accuse réception une fois l’avis parti', async () => {
    await rendre();

    noter(4);
    boutonEnvoyer().click();
    await fixture.whenStable();

    expect(hote().textContent).toContain('Merci pour votre avis');
  });

  it('conserve la saisie quand l’envoi échoue', async () => {
    envois.echoue = true;
    await rendre();

    noter(4);
    saisir('Travail soigné.');
    boutonEnvoyer().click();
    await fixture.whenStable();

    // Refaire une note perdue par une coupure réseau est le meilleur moyen de
    // n'avoir aucun avis.
    expect(hote().querySelector('[role="alert"]')?.textContent).toContain("n'a pas pu être envoyé");
    expect(zoneCommentaire().value).toBe('Travail soigné.');
    expect(boutonEnvoyer().disabled).toBe(false);
  });
});
