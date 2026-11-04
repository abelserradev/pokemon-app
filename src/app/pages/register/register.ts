import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomValidators } from '../../shared/validators/custom-validators';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;
  showPasswordRequirements: boolean = false;
  passwordRequirements = {
    minLength: false,
    maxLength: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false
  };

  constructor(
    private auth: Auth,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
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
          CustomValidators.securePassword(),
          CustomValidators.noScriptTags()
        ]
      ]
    });

    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.updatePasswordRequirements(password);
    });
  }

  updatePasswordRequirements(password: string): void {
    this.passwordRequirements = {
      minLength: password.length >= 8,
      maxLength: password.length <= 15,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
  }

  onPasswordFocus(): void {
    this.showPasswordRequirements = true;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    const user = this.registerForm.value;

    this.auth.register(user).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = error.error?.detail || error.message || 'Error en el registro';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getEmailError(): string {
    const control = this.registerForm.get('email');
    if (control?.hasError('required')) {
      return 'El email es requerido';
    }
    if (control?.hasError('invalidEmail')) {
      return 'Formato de email inválido';
    }
    if (control?.hasError('invalidDomain')) {
      return 'Dominio de email no permitido.';
    }
    if (control?.hasError('containsHtml')) {
      return 'El email contiene caracteres no permitidos';
    }
    return '';
  }

  getPasswordError(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (control?.hasError('containsHtml')) {
      return 'La contraseña contiene caracteres no permitidos';
    }
    return '';
  }
}