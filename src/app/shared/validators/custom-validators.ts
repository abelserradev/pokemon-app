import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class CustomValidators {
    static emailDomain(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            const validDomains = [
                'gmail.com',
                'hotmail.com',
                'outlook.com',
                'yahoo.com',
                'icloud.com',
                'live.com',
                'msn.com',
                'protonmail.com'
            ];

            if (!emailPattern.test(control.value)) {
                return { invalidEmail: true};
            }

            const domain = control.value.split('@')[1]?.toLowerCase();
            if (!validDomains.includes(domain)) {
                return { invalidDomain: { validDomains }};
            }

            return null;
        };
    }

    static securePassword(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const password = control.value;
            const errors: ValidationErrors = {};

            if (password.length < 8) {
                errors['minLength'] = { requiredLength: 8, actualLength: password.length };
            }

            if (password.length > 15) {
                errors['maxLength'] = { requiredLength: 15, actualLength: password.length };
            }

            if (!/[A-Z]/.test(password)) {
                errors['uppercase'] = true;
            }

            if (!/[a-z]/.test(password)) {
                errors['lowercase'] = true;
            }

            if (!/\d/.test(password)) {
                errors['number'] = true;
              }
        
             
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                errors['specialChar'] = true;
            }

            return Object.keys(errors).length > 0 ? errors : null;
        };
    }

    static noScriptTags(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const value = control.value.toString();
            const scriptPattern =  /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
            const htmlPattern =  /<[^>]*>/g;

            if (scriptPattern.test(value) || htmlPattern.test(value)) {
                return { constainsHtml: true };
            }

            return null;
        };
    }
}