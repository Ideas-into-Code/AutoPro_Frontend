import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface SlideFeature {
  icon: string;
  iconType: 'primary' | 'tertiary';
  title: string;
  description: string;
}

export interface SlideBadge {
  icon: string;
  iconType: 'green' | 'primary' | 'tertiary';
  title: string;
  sub: string;
}

export interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  badge1?: SlideBadge;
  badge2?: SlideBadge;
  features?: SlideFeature[];
}

@Component({
  selector: 'app-slides',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slides.html',
  styleUrls: ['./slides.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlidesComponent {
  private readonly router = inject(Router);

  protected readonly slides: OnboardingSlide[] = [
    {
      id: 0,
      title: 'Trouvez un mécanicien de confiance près de chez vous.',
      description:
        'Localisez des professionnels certifiés dans votre région pour toute réparation ou entretien de votre véhicule.',
      imageUrl: 'images/splash_visual.png',
      imageAlt: 'Illustration diagnostic automobile 3D Ultra-HD AutoPro Dakar',
      badge1: {
        icon: 'verified',
        iconType: 'primary',
        title: 'Pros Certifiés',
        sub: 'Vérifiés par AutoPro',
      },
    },
    {
      id: 1,
      title: 'Des diagnostics précis et des réparations garanties.',
      description:
        'Obtenez des devis transparents et suivez l’avancement des travaux sur votre voiture en temps réel.',
      imageUrl: 'images/tech_support.png',
      imageAlt: 'Illustration atelier mécanique et diagnostic haute qualité',
      badge1: {
        icon: 'build_circle',
        iconType: 'tertiary',
        title: 'Service Rapide',
        sub: 'Intervention sous 24h',
      },
    },
    {
      id: 2,
      title: 'Discutez, appelez et obtenez une assistance en toute confiance.',
      description:
        'Une communication sécurisée et un support professionnel à tout moment pour votre véhicule.',
      imageUrl: 'images/tech_support.png',
      imageAlt: 'Interface de communication et support expert AutoPro',
      badge1: {
        icon: 'call',
        iconType: 'green',
        title: 'Support Expert',
        sub: 'En ligne',
      },
      badge2: {
        icon: 'verified_user',
        iconType: 'primary',
        title: 'Chat Sécurisé',
        sub: 'Chiffré de bout en bout',
      },
      features: [
        {
          icon: 'support_agent',
          iconType: 'primary',
          title: 'Support Technique 24/7',
          description: 'Des experts disponibles pour vous aider avec votre véhicule.',
        },
        {
          icon: 'forum',
          iconType: 'tertiary',
          title: 'Messagerie Directe Intégrée',
          description: 'Échangez directement avec les mécaniciens et ateliers.',
        },
      ],
    },
  ];

  protected readonly activeIndex = signal(0);
  protected readonly currentSlide = computed(() => this.slides[this.activeIndex()]);
  protected readonly isLastSlide = computed(() => this.activeIndex() === this.slides.length - 1);
  protected readonly isFirstSlide = computed(() => this.activeIndex() === 0);

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.onNext();
    } else if (event.key === 'ArrowLeft') {
      this.onPrevious();
    }
  }

  onSkip(): void {
    void this.router.navigate(['/compte/connexion']);
  }

  onNext(): void {
    if (this.isLastSlide()) {
      void this.router.navigate(['/compte/connexion']);
    } else {
      this.activeIndex.update((index) => index + 1);
    }
  }

  onPrevious(): void {
    if (this.activeIndex() > 0) {
      this.activeIndex.update((index) => index - 1);
    } else {
      void this.router.navigate(['/bienvenue']);
    }
  }

  onLogin(): void {
    void this.router.navigate(['/compte/connexion']);
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.activeIndex.set(index);
    }
  }
}
