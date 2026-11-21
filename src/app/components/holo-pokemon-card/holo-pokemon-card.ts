import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HoloCardScene } from './holo-card-scene';

export type HoloCardSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-holo-pokemon-card',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './holo-pokemon-card.html',
  styleUrl: './holo-pokemon-card.scss'
})
export class HoloPokemonCardComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Display name — always exposed as real text for a11y (not canvas-only). */
  @Input({ required: true }) name!: string;
  @Input() types: string[] = [];
  @Input() artworkUrl: string | null = null;
  /** Fallback when artwork fails or is empty. */
  @Input() spriteUrl: string | null = null;
  @Input() size: HoloCardSize = 'md';
  @Input() pokemonId: number | null = null;

  @ViewChild('canvasHost', { static: true }) canvasHost!: ElementRef<HTMLCanvasElement>;

  loadState: 'loading' | 'ready' | 'error' | 'empty' = 'loading';
  errorMessage = '';
  private scene: HoloCardScene | null = null;
  private motionQuery: MediaQueryList | null = null;
  private boundMotionChange = (e: MediaQueryListEvent): void => {
    this.scene?.setReducedMotion(e.matches);
  };
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.bootScene();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) {
      return;
    }
    if (changes['artworkUrl'] || changes['spriteUrl']) {
      void this.refreshTexture();
    }
  }

  ngOnDestroy(): void {
    this.teardownMotionListener();
    this.scene?.dispose();
    this.scene = null;
  }

  get resolvedImageUrl(): string {
    return (this.artworkUrl || this.spriteUrl || '').trim();
  }

  get sizeClass(): string {
    return `holo-card--${this.size}`;
  }

  private bootScene(): void {
    this.scene?.dispose();
    this.scene = null;

    const url = this.resolvedImageUrl;
    if (!url) {
      this.loadState = 'empty';
      this.errorMessage = 'Sin imagen del Pokémon';
      return;
    }

    this.loadState = 'loading';
    this.errorMessage = '';

    const reduced = this.prefersReducedMotion();
    this.scene = new HoloCardScene({
      canvas: this.canvasHost.nativeElement,
      artworkUrl: url,
      reducedMotion: reduced,
      onReady: () => {
        this.loadState = 'ready';
      },
      onError: (message) => {
        this.loadState = 'error';
        this.errorMessage = message;
      }
    });

    void this.scene.mount();
    this.bindMotionListener();
  }

  private async refreshTexture(): Promise<void> {
    const url = this.resolvedImageUrl;
    if (!url) {
      this.loadState = 'empty';
      this.scene?.dispose();
      this.scene = null;
      return;
    }
    if (this.scene && this.loadState === 'ready') {
      await this.scene.updateArtwork(url);
      return;
    }
    this.bootScene();
  }

  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private bindMotionListener(): void {
    this.teardownMotionListener();
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.motionQuery.addEventListener('change', this.boundMotionChange);
  }

  private teardownMotionListener(): void {
    this.motionQuery?.removeEventListener('change', this.boundMotionChange);
    this.motionQuery = null;
  }
}
