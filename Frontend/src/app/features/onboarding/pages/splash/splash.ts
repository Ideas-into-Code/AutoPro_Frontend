import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.html',
  styleUrls: ['./splash.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly progress = signal(0);
  protected readonly isComplete = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.progress.set(100);
      this.isComplete.set(true);
      return;
    }

    let start: number | null = null;
    const duration = 1200; // 1.2s smooth filling animation
    let animationFrameId: number;

    const step = (timestamp: number): void => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const currentProgress = Math.min(Math.floor((elapsed / duration) * 100), 100);

      this.progress.set(currentProgress);

      if (currentProgress < 100) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        this.isComplete.set(true);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    this.destroyRef.onDestroy(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    });
  }

  onContinue(): void {
    void this.router.navigate(['/bienvenue/presentation']);
  }
}
