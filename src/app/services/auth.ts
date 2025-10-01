import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  register(user: any) {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(user: any) {
    const formData = new FormData();
    formData.append('username', user.email);
    formData.append('password', user.password);
    return this.http.post(`${this.apiUrl}/login`, formData);
  }
}
