import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Position } from '@core';
import { Button, FormField, Icon } from '@shared/ui';
import { longueurMax, longueurMin, requis, telephoneSenegalaisValidator } from '@shared/validators';
import { InterventionRequest, ProblemType } from '../../models/request.model';
import { PROBLEM_TYPE_LABELS, problemTypeFromCategorySlug } from '../../models/request-draft.model';
import { RequestRepository } from '../../data/request.repository';
import { LocationPicker } from '../../components/location-picker/location-picker';
import { NextSteps } from '../../components/next-steps/next-steps';
import { PhotoUpload } from '../../components/photo-upload/photo-upload';

/** Longueur en deçà de laquelle une description n'apprend rien au mécanicien. */
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 600;

/** Ramène un paramètre d'URL absent à la chaîne vide — voir la liste des mécaniciens. */
function versChaine(valeur: string | undefined): string {
  return valeur ?? '';
}

/** Le routeur transmet les paramètres en chaînes : `'true'`, jamais `true`. */
function versBooleen(valeur: string | undefined): boolean {
  return valeur === 'true';
}

/**
 * Formulaire de signalement d'un problème.
 *
 * Deux entrées possibles, toutes deux depuis l'accueil :
 *   - le bouton SOS, avec `?urgence=true` ;
 *   - une carte de catégorie, avec `?categorie=batterie`, qui présélectionne
 *     le type de panne pour épargner un choix à quelqu'un qui est en panne.
 *
 * L'écran ne connaît que `RequestRepository`. Le livrable du ticket — « un
 * formulaire envoyant une requête au backend » — tient donc entièrement dans
 * cette dépendance : le jour où le microservice répond, on remplace le
 * fournisseur dans `requests.routes.ts` et pas une ligne d'ici ne bouge.
 */
@Component({
  selector: 'app-report-problem',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Button,
    FormField,
    Icon,
    LocationPicker,
    NextSteps,
    PhotoUpload,
  ],
  templateUrl: './report-problem.html',
  styleUrl: './report-problem.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportProblemPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly requests = inject(RequestRepository);

  /** `slug` de catégorie choisi sur l'accueil, s'il y en a un. */
  readonly categorie = input('', { transform: versChaine });

  /** Marque une immobilisation, positionné par le bouton SOS. */
  readonly urgence = input(false, { transform: versBooleen });

  protected readonly typesDeProbleme = Object.entries(PROBLEM_TYPE_LABELS) as [
    ProblemType,
    string,
  ][];

  protected readonly formulaire = this.fb.nonNullable.group({
    problemType: this.fb.nonNullable.control<ProblemType>('autre', requis),
    description: this.fb.nonNullable.control('', [
      requis,
      longueurMin(DESCRIPTION_MIN),
      longueurMax(DESCRIPTION_MAX),
    ]),
    adresse: this.fb.nonNullable.control('', requis),
    telephone: this.fb.nonNullable.control('', [requis, telephoneSenegalaisValidator]),
  });

  /** Photos et position vivent hors du formulaire : voir `PhotoUpload`. */
  protected readonly photos = signal<readonly File[]>([]);
  protected readonly position = signal<Position | null>(null);

  protected readonly envoiEnCours = signal(false);
  protected readonly erreurEnvoi = signal<string | null>(null);

  /** Demande enregistrée par le serveur : sert d'accusé de réception. */
  protected readonly demandeEnvoyee = signal<InterventionRequest | null>(null);

  protected readonly caracteresRestants = computed(
    () => DESCRIPTION_MAX - this.formulaire.controls.description.value.length,
  );

  constructor() {
    /**
     * Une catégorie choisie sur l'accueil présélectionne le type de panne.
     *
     * Dans un `effect` et non dans le corps du constructeur : les entrées liées
     * aux paramètres d'URL ne sont pas encore renseignées à la construction, et
     * la présélection retomberait systématiquement sur « autre ».
     *
     * La valeur est écrite dans le contrôle, pas verrouillée : l'utilisateur
     * reste libre de corriger, il connaît sa panne mieux que la carte sur
     * laquelle il a cliqué.
     */
    effect(() => {
      this.formulaire.controls.problemType.setValue(problemTypeFromCategorySlug(this.categorie()));
    });
  }

  protected surPhotos(fichiers: readonly File[]): void {
    this.photos.set(fichiers);
  }

  protected surPosition(relevee: Position | null): void {
    this.position.set(relevee);
  }

  protected envoyer(): void {
    this.erreurEnvoi.set(null);

    if (this.formulaire.invalid) {
      // Sans ce marquage, les champs jamais atteints resteraient vierges de
      // tout message et l'utilisateur ne saurait pas ce qui bloque.
      this.formulaire.markAllAsTouched();
      return;
    }

    const valeurs = this.formulaire.getRawValue();
    const relevee = this.position();

    this.envoiEnCours.set(true);

    this.requests
      .create({
        problemType: valeurs.problemType,
        description: valeurs.description.trim(),
        contactPhone: valeurs.telephone.trim(),
        isEmergency: this.urgence(),
        location: {
          address: valeurs.adresse.trim(),
          coordinates:
            relevee === null
              ? undefined
              : { latitude: relevee.latitude, longitude: relevee.longitude },
        },
        photos: this.photos(),
      })
      .subscribe({
        next: (enregistree) => {
          this.envoiEnCours.set(false);
          this.demandeEnvoyee.set(enregistree);
        },
        error: () => {
          this.envoiEnCours.set(false);
          this.erreurEnvoi.set(
            "Votre demande n'a pas pu être envoyée. Vérifiez votre connexion et réessayez.",
          );
        },
      });
  }

  protected retourAccueil(): void {
    void this.router.navigate(['/accueil']);
  }
}
