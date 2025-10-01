import { Auth } from './../../services/auth';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  user = { email: '', password: '' };
  errorMessage: string = '';

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  onSubmit() {
    this.authService.login(this.user).subscribe({
      next: (response: any) => {
        // Guardar token en localStorage
        localStorage.setItem('token', response.access_token);
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        this.errorMessage = error.error?.detail || 'Error en el login';
      }
    });
  }
}
