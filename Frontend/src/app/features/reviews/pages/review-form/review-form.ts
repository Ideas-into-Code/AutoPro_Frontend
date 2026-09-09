import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { ApiError } from '@core';
import { Avatar, Button, RatingStars, Spinner } from '@shared/ui';
import { ReviewSubmissionRepository, ReviewTargetRepository } from '../../data/review.repository';
import { COMMENTAIRE_MAX, LIBELLES_NOTE, ReviewTarget } from '../../models/review.model';

/**
 * Formulaire d'avis — ticket #26, aligné sur le backend.
 *
 * On note **un mécanicien** (pas une intervention), une note et un commentaire
 * facultatif. Le mécanicien visé arrive par l'URL :
 * `/avis/nouveau?mecanicien=<id>` — depuis le suivi d'une demande terminée ou
 * depuis la fiche du mécanicien.
 *
 * **Pas de formulaire réactif** : un seul champ contraint (la note), le bouton
 * traduit la règle en s'activant. Un `FormGroup` n'ajouterait que de la
 * cérémonie.
 */
@Component({
  selector: 'app-review-form',
  imports: [Avatar, Button, RatingStars, Spinner, RouterLink, LowerCasePipe],
  templateUrl: './review-form.html',
  styleUrl: './review-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewFormPage {
  private readonly cibles = inject(ReviewTargetRepository);
  private readonly envois = inject(ReviewSubmissionRepository);

  /**
   * Id du mécanicien à noter, issu du paramètre d'URL `mecanicien`.
   *
   * `withComponentInputBinding()` écrit `undefined` quand le paramètre est
   * absent de l'URL — la valeur par défaut d'`input()` ne joue qu'avant la
   * première liaison. On normalise donc en chaîne vide.
   */
  readonly mecanicien = input('', { transform: (v: string | undefined) => v ?? '' });

  protected readonly libelles = LIBELLES_NOTE;
  protected readonly commentaireMax = COMMENTAIRE_MAX;

  protected readonly cibleResource = rxResource<ReviewTarget | null, string>({
    params: () => this.mecanicien(),
    stream: ({ params }) => (params ? this.cibles.forMechanic(params) : of(null)),
    defaultValue: null,
  });

  protected readonly chargementFailed = computed(
    () => this.mecanicien() === '' || this.cibleResource.error() !== undefined,
  );

  // --- Saisie -----------------------------------------------------------

  protected readonly note = signal(0);
  protected readonly commentaire = signal('');

  protected readonly caracteres = computed(() => this.commentaire().length);

  protected readonly peutEnvoyer = computed(() => this.note() > 0 && !this.envoiEnCours());

  protected readonly envoiEnCours = signal(false);
  protected readonly envoye = signal(false);
  protected readonly erreur = signal<string | null>(null);

  // --- Actions --------------------------------------------------------------

  protected noter(note: number): void {
    this.note.set(note);
    this.erreur.set(null);
  }

  protected saisirCommentaire(texte: string): void {
    this.commentaire.set(texte.slice(0, COMMENTAIRE_MAX));
  }

  protected envoyer(): void {
    const cible = this.cibleResource.value();
    if (cible === null || !this.peutEnvoyer()) {
      return;
    }

    this.envoiEnCours.set(true);
    this.erreur.set(null);

    this.envois
      .submit({
        mechanicId: cible.mechanicId,
        rating: this.note(),
        comment: this.commentaire().trim(),
      })
      .subscribe({
        next: () => {
          this.envoiEnCours.set(false);
          this.envoye.set(true);
        },
        error: (err: ApiError) => {
          this.envoiEnCours.set(false);
          // Le backend renvoie un message clair (« Vous avez déjà laissé un
          // avis… ») : on le montre tel quel plutôt que de le masquer.
          this.erreur.set(
            err?.message ?? "Votre avis n'a pas pu être envoyé. Vérifiez votre connexion.",
          );
        },
      });
  }

  protected reessayerChargement(): void {
    this.cibleResource.reload();
  }
}
