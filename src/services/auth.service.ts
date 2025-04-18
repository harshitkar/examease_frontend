import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { UserData } from '../models/user.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5000/auth';
  private currentUserSubject: BehaviorSubject<UserData | null>;
  currentUser$: Observable<UserData | null>;

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<UserData | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  signup(username: string, fullName: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, { username, fullName, email, password });
  }

  login(email: string, password: string): Observable<UserData> {
    return this.http.post<{ message: string; user: any }>(`${this.apiUrl}/login`, { email, password }).pipe(
      map((response) => {
        const userResponse = response.user;
  
        const user: UserData = {
          userId: userResponse._id,
          fullName: userResponse.fullName,
          username: userResponse.username,
          email: userResponse.email,
          password: userResponse.password,
        };
  
        localStorage.setItem('currentUser', JSON.stringify(user));
  
        this.currentUserSubject.next(user);
        console.log('User logged in:', user);
  
        return user;
      })
    );
  }
   

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getUser(): Observable<UserData | null> {
    return this.currentUser$;
  }
}
