import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FavoritePokemon {
  id?: number;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite: string;
  count: number;
  last_used: string;
  // Agregar propiedades alias para el template
  get sprite(): string;
  get name(): string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = `${environment.apiUrl}/pokemon`;
  private favoritesSubject = new BehaviorSubject<any[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadFavorites(limit: number = 5): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/favorites?limit=${limit}`).pipe(
      tap(favorites => {
        // Transformar los datos para que sean compatibles con el template
        const transformedFavorites = favorites.map(f => ({
          ...f,
          sprite: f.pokemon_sprite,
          name: f.pokemon_name
        }));
        this.favoritesSubject.next(transformedFavorites);
      })
    );
  }

  usePokemon(pokemonId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/favorites/${pokemonId}/use`, {}).pipe(
      tap(() => {
        this.loadFavorites().subscribe();
      })
    );
  }

  getTopFavorites(limit: number = 5): any[] {
    return this.favoritesSubject.value.slice(0, limit);
  }
}
