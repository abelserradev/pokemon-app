import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService, FavoritePokemon } from '../../services/favorites.service';
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
  topFavorites: any[] = [];
  private subscriptions = new Subscription();

  constructor(
    private favoritesService: FavoritesService,
    private authService: Auth,
    private teamService: TeamService
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadFavorites();

      // Recargar favoritos cuando cambie el equipo
      this.subscriptions.add(
        this.teamService.team$.subscribe(() => {
          this.loadFavorites();
        })
      );

      // Suscribirse a cambios en favoritos
      this.subscriptions.add(
        this.favoritesService.favorites$.subscribe(favorites => {
          this.topFavorites = favorites;
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadFavorites() {
    this.favoritesService.loadFavorites(5).subscribe({
      error: (error) => {
        console.error('Error al cargar favoritos:', error);
      }
    });
  }
}
