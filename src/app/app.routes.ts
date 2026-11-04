import { Routes } from '@angular/router';
import { PokemonComponent } from './pages/pokemon/pokemon.component';
import { Home } from './pages/home/home';
import { Team } from './pages/team/team';
import { Training } from './pages/training/training';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth.guard';
import { PokemonTeams } from './pages/pokemon-teams/pokemon-teams';


export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'pokemon', component: PokemonComponent },
  {
    path: 'equipo',
    component: Team,
    title: 'Team page',
    canActivate: [authGuard]
  },
  {
    path: 'entrenamiento',
    component: Training,
    title: 'Training page',
    canActivate: [authGuard]
  },
  { path: 'register', component: Register },
  { path: 'login', component: Login },
  {
    path: 'equipos',
    component: PokemonTeams,
    canActivate: [authGuard]
  },
];
