import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { LoadingComponent } from './components/loading/loading';
import { LoadingService, LoadingState } from './services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe, Header, Footer, LoadingComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  loadingState$!: Observable<LoadingState>;

  constructor(private loadingService: LoadingService) {}

  ngOnInit() {
    this.loadingState$ = this.loadingService.loading$;
    this.loadingService.show('Iniciando aplicación...');

    setTimeout(() => {
      this.loadingService.hide();
    }, 2000);
  }
}
