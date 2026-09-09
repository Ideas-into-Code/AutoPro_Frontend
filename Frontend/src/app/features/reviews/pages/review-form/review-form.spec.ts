import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { ApiError } from '@core';
import { ReviewSubmissionRepository, ReviewTargetRepository } from '../../data/review.repository';
import { ReviewDraft, ReviewTarget } from '../../models/review.model';
import { ReviewFormPage } from './review-form';

const CIBLE: ReviewTarget = {
  mechanicId: '14',
  mechanicName: 'Modou Niang',
  mechanicSpecialty: 'Freinage et suspension',
};

class FausseCible extends ReviewTargetRepository {
  demandes: string[] = [];
  forMechanic(id: string): Observable<ReviewTarget> {
    this.demandes.push(id);
    return of(CIBLE);
  }
}

class FauxEnvoi extends ReviewSubmissionRepository {
  envois: ReviewDraft[] = [];
  erreur: ApiError | null = null;

  submit(draft: ReviewDraft): Observable<void> {
    this.envois.push(draft);
    return this.erreur ? throwError(() => this.erreur) : of(undefined);
  }
}

describe('ReviewFormPage', () => {
  let fixture: ComponentFixture<ReviewFormPage>;
  let cibles: FausseCible;
  let envois: FauxEnvoi;

  const hote = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const etoile = (i: number): HTMLInputElement =>
    hote().querySelectorAll<HTMLInputElement>('input[type="radio"]')[i];
  const boutonEnvoyer = (): HTMLButtonElement =>
    [...hote().querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Envoyer mon avis'),
    ) as HTMLButtonElement;
  const zone = (): HTMLTextAreaElement => hote().querySelector('textarea') as HTMLTextAreaElement;

  const saisir = (t: string): void => {
    zone().value = t;
    zone().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const noter = (i: number): void => {
    etoile(i).click();
    fixture.detectChanges();
  };

  const rendre = async (mecanicien = '14'): Promise<void> => {
    fixture = TestBed.createComponent(ReviewFormPage);
    fixture.componentRef.setInput('mecanicien', mecanicien);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    cibles = new FausseCible();
    envois = new FauxEnvoi();
    await TestBed.configureTestingModule({
      imports: [ReviewFormPage],
      providers: [
        provideRouter([]),
        { provide: ReviewTargetRepository, useValue: cibles },
        { provide: ReviewSubmissionRepository, useValue: envois },
      ],
    }).compileComponents();
  });

  it('résout le mécanicien depuis le paramètre d’URL', async () => {
    await rendre('14');
    expect(cibles.demandes).toEqual(['14']);
    expect(hote().textContent).toContain('Modou Niang');
    expect(hote().textContent).toContain('freinage et suspension');
  });

  it('interdit l’envoi tant qu’aucune note n’est donnée', async () => {
    await rendre();
    expect(boutonEnvoyer().disabled).toBe(true);
  });

  it('transmet la note et le commentaire au mécanicien visé', async () => {
    await rendre();
    noter(4);
    saisir('Travail rapide et soigné.');
    boutonEnvoyer().click();
    await fixture.whenStable();

    expect(envois.envois).toEqual([
      { mechanicId: '14', rating: 5, comment: 'Travail rapide et soigné.' },
    ]);
  });

  it('coupe le commentaire à la limite du serveur (1000)', async () => {
    await rendre();
    saisir('a'.repeat(1200));
    expect(hote().querySelector('.ap-review__counter')?.textContent).toContain('1000/1000');
  });

  it('accuse réception une fois l’avis parti', async () => {
    await rendre();
    noter(4);
    boutonEnvoyer().click();
    await fixture.whenStable();
    expect(hote().textContent).toContain('Merci pour votre avis');
  });

  it('montre le message du backend quand un avis existe déjà', async () => {
    envois.erreur = {
      kind: 'unknown',
      status: 400,
      message: 'Vous avez déjà laissé un avis pour ce mécanicien',
    };
    await rendre();
    noter(4);
    boutonEnvoyer().click();
    await fixture.whenStable();

    expect(hote().querySelector('[role="alert"]')?.textContent).toContain('déjà laissé un avis');
  });

  it('affiche l’état d’échec quand aucun mécanicien n’est fourni', async () => {
    await rendre('');
    expect(hote().textContent).toContain("n'a pas pu être chargé");
  });
});
