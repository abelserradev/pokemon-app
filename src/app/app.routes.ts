import { Routes } from '@angular/router';
import { PokemonComponent } from './pages/pokemon/pokemon.component';
import { Home } from './pages/home/home';
import { Team } from './pages/team/team';
import { Training } from './pages/training/training';
import { Register } from './pages/register/register';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'pokemon', component: PokemonComponent },
  { path: 'equipo', component: Team },
  { path: 'entrenamiento', component: Training },
  { path: 'register', component: Register },
];
