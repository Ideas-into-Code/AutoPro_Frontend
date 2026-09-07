import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { Vehicle, VehicleDraft, VehicleRepository } from '@core';
import { Button, Spinner } from '@shared/ui';
import { longueurMax, requis } from '@shared/validators';

const ANNEE_MAX = new Date().getFullYear() + 1;

/**
 * « Mes véhicules » : liste réelle du parc du client, avec ajout, modification
 * et suppression. Un seul formulaire, réutilisé pour l'ajout et l'édition.
 */
@Component({
  selector: 'app-my-vehicles',
  imports: [ReactiveFormsModule, Button, Spinner],
  templateUrl: './my-vehicles.html',
  styleUrl: './my-vehicles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyVehiclesPage {
  private readonly fb = inject(FormBuilder);
  private readonly repo = inject(VehicleRepository);

  protected readonly vehicules = rxResource<readonly Vehicle[], unknown>({
    stream: () => this.repo.list(),
    defaultValue: [],
  });

  /** `null` = formulaire fermé ; `'new'` = ajout ; un id = édition. */
  protected readonly edition = signal<string | null | 'new'>(null);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly anneeMax = ANNEE_MAX;

  protected readonly form = this.fb.nonNullable.group({
    brand: this.fb.nonNullable.control('', [requis, longueurMax(100)]),
    model: this.fb.nonNullable.control('', [requis, longueurMax(100)]),
    year: this.fb.nonNullable.control(ANNEE_MAX - 5, [requis]),
    licensePlate: this.fb.nonNullable.control('', [requis, longueurMax(20)]),
    color: this.fb.nonNullable.control(''),
    mileage: this.fb.control<number | null>(null),
  });

  protected ouvrirAjout(): void {
    this.erreur.set(null);
    this.form.reset({ year: ANNEE_MAX - 5, color: '', mileage: null });
    this.edition.set('new');
  }

  protected ouvrirEdition(v: Vehicle): void {
    this.erreur.set(null);
    this.form.reset({
      brand: v.brand,
      model: v.model,
      year: v.year,
      licensePlate: v.licensePlate,
      color: v.color ?? '',
      mileage: v.mileage,
    });
    this.edition.set(v.id);
  }

  protected annuler(): void {
    this.edition.set(null);
    this.erreur.set(null);
  }

  protected enregistrer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const draft: VehicleDraft = {
      brand: v.brand.trim(),
      model: v.model.trim(),
      year: Number(v.year),
      licensePlate: v.licensePlate.trim(),
      color: v.color.trim() || undefined,
      mileage: v.mileage ?? undefined,
    };

    const mode = this.edition();
    const call$ = mode === 'new' ? this.repo.create(draft) : this.repo.update(mode as string, draft);

    this.erreur.set(null);
    this.enCours.set(true);
    call$.subscribe({
      next: () => {
        this.enCours.set(false);
        this.edition.set(null);
        this.vehicules.reload();
      },
      error: (e: { message?: string }) => {
        this.enCours.set(false);
        this.erreur.set(e?.message ?? "L'enregistrement a échoué.");
      },
    });
  }

  protected supprimer(v: Vehicle): void {
    this.erreur.set(null);
    this.enCours.set(true);
    this.repo.remove(v.id).subscribe({
      next: () => {
        this.enCours.set(false);
        this.vehicules.reload();
      },
      error: (e: { message?: string }) => {
        this.enCours.set(false);
        this.erreur.set(e?.message ?? 'La suppression a échoué.');
      },
    });
  }
}
