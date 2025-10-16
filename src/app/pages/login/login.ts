import { Auth } from './../../services/auth';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;
  
  constructor(
    private authService: Auth,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          CustomValidators.emailDomain(),
          CustomValidators.noScriptTags()
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          CustomValidators.noScriptTags()
        ]
      ]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    const user = this.loginForm.value;

    this.authService.login(user).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        this.errorMessage = error.error?.detail || error.message || 'Error en el login';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getEmailError(): string {
    const control = this.loginForm.get('email');
    if (control?.hasError('required')) {
      return 'El email es requerido';
    }
    if (control?.hasError('invalidEmail')) {
      return 'Formato de email inválido';
    }
    if (control?.hasError('invalidDomain')) {
      return 'Dominio de email no permitido. Usa gmail, hotmail, outlook, etc.';
    }
    if (control?.hasError('containsHtml')) {
      return 'El email contiene caracteres no permitidos';
    }
    return '';
  }

  getPasswordError(): string {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (control?.hasError('containsHtml')) {
      return 'La contraseña contiene caracteres no permitidos';
    }
    return '';
  }
}