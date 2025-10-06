import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  user = {email: '', password: ''};
  errorMessage: string = '';

  constructor(private auth: Auth, private router: Router) {}

  onSubmit() {
    this.errorMessage = ''; // Limpiar mensaje de error anterior

    this.auth.register(this.user).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error en registro:', error);
        this.errorMessage = error.error?.detail || error.message || 'Error en el registro';
      }
    });
  }
}
