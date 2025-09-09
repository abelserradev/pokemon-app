import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Auth } from '../../services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  user = {email: '', password: ''};
  errorMessage: string = '';

  constructor(private auth: Auth, private router: Router) {}


  onSubmit() {
    this.auth.register(this.user).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (error) => this.errorMessage = error.error?.message || 'Error en el registro'
    });
  }
}
