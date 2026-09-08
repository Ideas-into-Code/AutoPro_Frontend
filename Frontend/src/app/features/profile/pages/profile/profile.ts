import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';

import { PositionProvider } from '@core';
import { AuthService } from '@core/services/auth.service';
import { Button, Spinner } from '@shared/ui';
import { longueurMax, requis } from '@shared/validators';

import { ProfileRepository } from '../../data/profile.repository';
import { MechanicPatch, Profile } from '../../models/profile.model';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * « Mon profil » — un seul écran pour les deux personas.
 *
 * Le client n'y voit que son compte (nom, téléphone). Le mécanicien y voit en
 * plus sa fiche professionnelle : spécialité, années d'expérience, présentation,
 * disponibilité et **position de l'atelier**, qu'il capture d'un bouton. Cette
 * position alimente la recherche géographique côté client (`/api/mechanics/nearby`).
 *
 * Deux formulaires distincts et non un seul : ils partent vers deux ressources
 * backend (`/api/users/me`, `/api/mechanics/me`), s'enregistrent séparément, et
 * le client n'a pas le second.
 */
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, Button, Spinner],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly repo = inject(ProfileRepository);
  private readonly positions = inject(PositionProvider);
  private readonly auth = inject(AuthService);

  protected readonly profil = rxResource<Profile | null, unknown>({
    stream: () => this.repo.load(),
    defaultValue: null,
  });

  protected readonly estMecanicien = computed(() => this.profil.value()?.account.role === 'mecanicien');

  // --- Formulaire compte --------------------------------------------------

  protected readonly compteForm = this.fb.nonNullable.group({
    firstName: this.fb.nonNullable.control('', [requis, longueurMax(100)]),
    lastName: this.fb.nonNullable.control('', [requis, longueurMax(100)]),
    phone: this.fb.nonNullable.control('', [longueurMax(20)]),
  });

  protected readonly compteState = signal<SaveState>('idle');

  // --- Formulaire mécanicien -------------------------------------------------

  protected readonly mecanoForm = this.fb.nonNullable.group({
    specialization: this.fb.nonNullable.control('', [longueurMax(255)]),
    experienceYears: this.fb.control<number | null>(null),
    bio: this.fb.nonNullable.control('', [longueurMax(1000)]),
    isAvailable: this.fb.nonNullable.control(false),
    latitude: this.fb.control<number | null>(null),
    longitude: this.fb.control<number | null>(null),
  });

  protected readonly mecanoState = signal<SaveState>('idle');
  protected readonly positionState = signal<'idle' | 'loading' | 'error'>('idle');

  /**
   * Miroir signal des coordonnées du formulaire.
   *
   * Un `FormControl` n'est pas réactif au sens des signaux : un `computed` qui
   * lirait `mecanoForm.controls.latitude.value` ne se recalculerait jamais. On
   * tient donc les coordonnées dans un signal, synchronisé à chaque écriture.
   */
  protected readonly coords = signal<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  /** Le mécanicien ne peut se rendre disponible qu'une fois son dossier validé. */
  protected readonly peutBasculerDispo = computed(
    () => this.profil.value()?.mechanic?.isVerified === true,
  );

  protected readonly aUnePosition = computed(() => this.coords().lat != null);

  constructor() {
    // Remplit les formulaires dès que le profil est chargé (ou rechargé).
    effect(() => {
      const p = this.profil.value();
      if (!p) {
        return;
      }
      this.compteForm.reset({
        firstName: p.account.firstName,
        lastName: p.account.lastName,
        phone: p.account.phone,
      });
      if (p.mechanic) {
        this.mecanoForm.reset({
          specialization: p.mechanic.specialization,
          experienceYears: p.mechanic.experienceYears,
          bio: p.mechanic.bio,
          isAvailable: p.mechanic.isAvailable,
          latitude: p.mechanic.latitude,
          longitude: p.mechanic.longitude,
        });
        this.coords.set({ lat: p.mechanic.latitude, lng: p.mechanic.longitude });
      }
    });
  }

  // --- Actions -----------------------------------------------------------

  protected enregistrerCompte(): void {
    if (this.compteForm.invalid || this.compteState() === 'saving') {
      return;
    }
    this.compteState.set('saving');
    const { firstName, lastName, phone } = this.compteForm.getRawValue();

    this.repo.saveAccount({ firstName, lastName, phone }).subscribe({
      next: () => {
        this.compteState.set('saved');
        // Le nom affiché dans l'en-tête vient de la session : on la resynchronise.
        this.auth.refreshCurrentUser().pipe(take(1)).subscribe();
      },
      error: () => this.compteState.set('error'),
    });
  }

  protected enregistrerMecano(): void {
    if (this.mecanoForm.invalid || this.mecanoState() === 'saving') {
      return;
    }
    this.mecanoState.set('saving');
    const v = this.mecanoForm.getRawValue();
    const patch: MechanicPatch = {
      specialization: v.specialization,
      experienceYears: v.experienceYears,
      bio: v.bio,
      // Garde-fou : le backend refuse `isAvailable=true` sans dossier validé.
      isAvailable: v.isAvailable && this.peutBasculerDispo(),
      latitude: v.latitude,
      longitude: v.longitude,
    };

    this.repo.saveMechanic(patch).subscribe({
      next: () => this.mecanoState.set('saved'),
      error: () => this.mecanoState.set('error'),
    });
  }

  protected utiliserMaPosition(): void {
    this.positionState.set('loading');
    this.positions
      .current()
      .pipe(take(1))
      .subscribe({
        next: (pos) => {
          const lat = Number(pos.latitude.toFixed(6));
          const lng = Number(pos.longitude.toFixed(6));
          this.mecanoForm.controls.latitude.setValue(lat);
          this.mecanoForm.controls.longitude.setValue(lng);
          this.mecanoForm.markAsDirty();
          this.coords.set({ lat, lng });
          this.positionState.set('idle');
        },
        error: () => this.positionState.set('error'),
      });
  }

  protected effacerPosition(): void {
    this.mecanoForm.controls.latitude.setValue(null);
    this.mecanoForm.controls.longitude.setValue(null);
    this.mecanoForm.markAsDirty();
    this.coords.set({ lat: null, lng: null });
  }
}
