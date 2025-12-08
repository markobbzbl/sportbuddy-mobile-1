import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService, Profile } from './supabase.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$: Observable<any> = this.currentUserSubject.asObservable();

  private currentProfileSubject = new BehaviorSubject<Profile | null>(null);
  public currentProfile$: Observable<Profile | null> = this.currentProfileSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private storage: StorageService
  ) {
    this.initAuth();
  }

  async initAuth() {
    try {
      const { data: { session } } = await this.supabase.getSession();
      if (session?.user) {
        this.currentUserSubject.next(session.user);
        await this.loadProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Don't block app startup if auth init fails
    }
  }

  async signUp(email: string, password: string, firstName: string, lastName: string) {
    const { data, error } = await this.supabase.signUp(email, password, firstName, lastName);
    if (error) {
      throw error;
    }
    if (data.user) {
      this.currentUserSubject.next(data.user);
      // Profile is created automatically by trigger, but we load it
      await this.loadProfile(data.user.id);
    }
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.signIn(email, password);
    if (error) {
      throw error;
    }
    if (data.user) {
      this.currentUserSubject.next(data.user);
      await this.loadProfile(data.user.id);
    }
    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.signOut();
    if (!error) {
      this.currentUserSubject.next(null);
      this.currentProfileSubject.next(null);
      await this.storage.remove('offline_profile');
      await this.storage.remove('offline_training_offers');
    }
    return { error };
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  getCurrentProfile() {
    return this.currentProfileSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  private async loadProfile(userId: string) {
    try {
      const profile = await this.supabase.getProfile(userId);
      if (profile) {
        this.currentProfileSubject.next(profile);
        await this.storage.set('offline_profile', profile);
      }
    } catch (error) {
      // Try to load from offline storage
      const offlineProfile = await this.storage.get<Profile>('offline_profile');
      if (offlineProfile) {
        this.currentProfileSubject.next(offlineProfile);
      }
    }
  }
}
