import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { LoadingComponent } from './components/loading/loading';
import { LoadingService, LoadingState } from './services/loading.service';
import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,AsyncPipe, Header, Footer, LoadingComponent, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  contador: number = 0;
  loadingState$!: Observable<LoadingState>;

  constructor(
    private loadingService: LoadingService,
    private cdRef: ChangeDetectorRef
  ) {}


  ngOnInit() {
    this.loadingState$ = this.loadingService.loading$;
    this.loadingService.show('Iniciando aplicacion...');

    setTimeout(() => {
      this.loadingService.hide();
    }, 2000);
  }

  ngAfterViewInit() {
    this.contador = -1;
    this.cdRef.detectChanges();
  }
}
