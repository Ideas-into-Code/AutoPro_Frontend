import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '../role-selection/role-selection';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly userRole = signal<UserRole>('client');
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly registerForm = this.fb.group(
    {
      firstName: ['', [(c: AbstractControl) => Validators.required(c)]],
      lastName: ['', [(c: AbstractControl) => Validators.required(c)]],
      email: [
        '',
        [
          (c: AbstractControl) => Validators.required(c),
          (c: AbstractControl) => Validators.email(c),
        ],
      ],
      phoneNumber: [
        '',
        [
          (c: AbstractControl) => Validators.required(c),
          (c: AbstractControl) => Validators.pattern(/^[0-9]{9}$/)(c),
        ],
      ],
      workshopName: [''], // Optional for mechanics
      password: [
        '',
        [
          (c: AbstractControl) => Validators.required(c),
          // Le backend exige 8 caractères minimum : on aligne pour éviter un
          // « Requête invalide » incompréhensible après envoi.
          (c: AbstractControl) => Validators.minLength(8)(c),
        ],
      ],
      confirmPassword: ['', [(c: AbstractControl) => Validators.required(c)]],
    },
    { validators: [(group: AbstractControl) => this.passwordMatchValidator(group)] }
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['role'] === 'mecanicien') {
        this.userRole.set('mecanicien');
        this.registerForm
          .get('workshopName')
          ?.setValidators([(c: AbstractControl) => Validators.required(c)]);
      } else {
        this.userRole.set('client');
        this.registerForm.get('workshopName')?.clearValidators();
      }
      this.registerForm.get('workshopName')?.updateValueAndValidity();
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value as string;
    const confirmPassword = control.get('confirmPassword')?.value as string;
    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const v = this.registerForm.value;
    this.authService
      .register({
        firstName: v.firstName!,
        lastName: v.lastName!,
        email: v.email!,
        password: v.password!,
        phone: v.phoneNumber ?? undefined,
        role: this.userRole(),
        workshopName: v.workshopName ?? undefined,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          // L'utilisateur est connecté dès l'inscription : on l'amène directement
          // dans son espace plutôt que de le renvoyer vers la page de connexion.
          const target = this.userRole() === 'mecanicien' ? '/mecanicien' : '/accueil';
          void this.router.navigate([target]);
        },
        error: (err: { message?: string; fieldErrors?: Record<string, string> }) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.messageErreur(err, "Échec de l'inscription."));
        },
      });
  }

  /** Combine le message d'erreur et le détail par champ renvoyés par le backend. */
  private messageErreur(
    err: { message?: string; fieldErrors?: Record<string, string> },
    fallback: string,
  ): string {
    const base = err?.message ?? fallback;
    const details = err?.fieldErrors ? Object.values(err.fieldErrors) : [];
    return details.length > 0 ? `${base} : ${details.join(' · ')}` : base;
  }

  onLogin(): void {
    void this.router.navigate(['/compte/connexion']);
  }
}
