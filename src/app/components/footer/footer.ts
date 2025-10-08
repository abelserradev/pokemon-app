import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService, SmartFavorite } from '../../services/favorites.service';
import { Auth } from '../../services/auth';
import { TeamService } from '../../services/team.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer implements OnInit, OnDestroy {
  topFavorites: SmartFavorite[] = [];
  private subscriptions = new Subscription();

  constructor(
    private favoritesService: FavoritesService,
    private authService: Auth,
    private teamService: TeamService
  ) {}

  ngOnInit() {
    // Cargar favoritos si el usuario está autenticado
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.loadSmartFavorites();
        } else {
          // Usuario no autenticado o cerró sesión
          this.topFavorites = [];
          this.favoritesService.clearFavorites();
        }
      })
    );

    // Recargar favoritos cuando cambie el equipo
    this.subscriptions.add(
      this.teamService.team$.subscribe(() => {
        if (this.authService.isAuthenticated()) {
          this.loadSmartFavorites();
        }
      })
    );

    // Suscribirse a cambios en favoritos
    this.subscriptions.add(
      this.favoritesService.favorites$.subscribe(favorites => {
        this.topFavorites = favorites;
        console.log('Favoritos actualizados en footer:', favorites);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadSmartFavorites() {
    this.favoritesService.loadSmartFavorites(5).subscribe({
      next: (favorites) => {
        console.log('Favoritos inteligentes cargados:', favorites);
      },
      error: (error) => {
        console.error('Error al cargar favoritos:', error);
        this.topFavorites = [];
      }
    });
  }
}
