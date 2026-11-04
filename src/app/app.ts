import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { LoadingComponent } from './components/loading/loading';
import { ModalComponent } from './components/modal/modal';
import { LoadingService, LoadingState } from './services/loading.service';
import { ModalService, ModalConfig } from './services/modal.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe, Header, Footer, LoadingComponent, ModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  loadingState$!: Observable<LoadingState>;
  modalConfig$!: Observable<ModalConfig>;

  constructor(
    private loadingService: LoadingService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadingState$ = this.loadingService.loading$;
    this.modalConfig$ = this.modalService.modalConfig$;
    
    // Usar setTimeout para mover fuera del ciclo de detección de cambios
    setTimeout(() => {
      this.loadingService.show('Iniciando aplicación...');
      
      setTimeout(() => {
        this.loadingService.hide();
      }, 2000);
    });
  }

  onModalConfirm(): void {
    this.modalService.confirm();
  }

  onModalCancel(): void {
    this.modalService.cancel();
  }

  onModalClose(): void {
    this.modalService.hide();
  }
}
