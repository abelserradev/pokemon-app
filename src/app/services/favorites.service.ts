import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SmartFavorite {
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite: string;
  pokemon_types: string[];
  relevance_score: number;
  source: 'search_history' | 'global_popular' | 'team_usage';
  // Alias para compatibilidad con templates
  sprite?: string;
  name?: string;
}

export interface SearchHistoryItem {
  id: number;
  user_id: number;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite: string;
  pokemon_types: string[];
  search_count: number;
  last_searched: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = `${environment.apiUrl}/pokemon`;
  private favoritesSubject = new BehaviorSubject<SmartFavorite[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Cargar favoritos inteligentes (nuevo sistema)
   */
  loadSmartFavorites(limit: number = 5): Observable<SmartFavorite[]> {
    return this.http.get<SmartFavorite[]>(
      `${this.apiUrl}/favorites/smart?limit=${limit}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(favorites => {
        console.log('Favoritos inteligentes recibidos del backend:', favorites);
        // Transformar para compatibilidad con templates existentes
        const transformedFavorites = favorites.map(f => ({
          ...f,
          sprite: f.pokemon_sprite,
          name: f.pokemon_name
        }));
        this.favoritesSubject.next(transformedFavorites);
      }),
      catchError(error => {
        console.error('Error cargando favoritos inteligentes:', error);
        this.favoritesSubject.next([]);
        throw error;
      })
    );
  }

  /**
   * Registrar búsqueda/interacción con un Pokémon
   */
  trackPokemonSearch(data: {
    pokemon_id: number;
    pokemon_name: string;
    pokemon_sprite?: string;
    pokemon_types?: string[];
  }): Observable<SearchHistoryItem> {
    return this.http.post<SearchHistoryItem>(
      `${this.apiUrl}/search/track`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      tap((result) => {
        console.log(`Búsqueda registrada para ${data.pokemon_name}:`, result);
        // Recargar favoritos después de registrar búsqueda
        this.loadSmartFavorites(5).subscribe();
      }),
      catchError(error => {
        console.error('Error registrando búsqueda:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener historial de búsquedas
   */
  getSearchHistory(limit: number = 10): Observable<SearchHistoryItem[]> {
    return this.http.get<SearchHistoryItem[]>(
      `${this.apiUrl}/search/history?limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener favoritos actuales del BehaviorSubject
   */
  getTopFavorites(limit: number = 5): SmartFavorite[] {
    return this.favoritesSubject.value.slice(0, limit);
  }

  /**
   * Limpiar favoritos (para logout)
   */
  clearFavorites(): void {
    this.favoritesSubject.next([]);
  }

  /**
   * LEGACY: Mantener para compatibilidad si es necesario
   */
  loadFavorites(limit: number = 5): Observable<SmartFavorite[]> {
    return this.loadSmartFavorites(limit);
  }
}
