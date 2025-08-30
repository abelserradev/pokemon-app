import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
  showOverlay?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({
    isLoading: false,
    message: 'Cargando Pokémon...',
    subMessage: '¡Preparando tu aventura!',
    showOverlay: true
  });

  public loading$ = this.loadingSubject.asObservable();

  show(message?: string, subMessage?: string, showOverlay: boolean = true) {
    this.loadingSubject.next({
      isLoading: true,
      message: message || 'Cargando Pokémon...',
      subMessage: subMessage || '¡Preparando tu aventura!',
      showOverlay
    });
  }

  hide() {
    this.loadingSubject.next({
      isLoading: false
    });
  }

  // Métodos específicos para diferentes tipos de loading
  showNavigation() {
    this.show('Navegando...', '¡Preparando la siguiente página!', true);
  }

  showApiCall() {
    this.show('Conectando con la API...', '¡Obteniendo datos de Pokémon!', false);
  }

  showSearch() {
    this.show('Buscando Pokémon...', '¡Explorando el mundo Pokémon!', false);
  }
}
