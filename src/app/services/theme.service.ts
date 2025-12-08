import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public darkMode$: Observable<boolean> = this.darkModeSubject.asObservable();

  constructor(private storage: StorageService) {
    this.initTheme();
  }

  async initTheme() {
    const savedTheme = await this.storage.get<boolean>('darkMode');
    if (savedTheme !== null) {
      this.setDarkMode(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDarkMode(prefersDark);
    }
  }

  async toggleDarkMode() {
    const current = this.darkModeSubject.value;
    await this.setDarkMode(!current);
  }

  async setDarkMode(enabled: boolean) {
    this.darkModeSubject.next(enabled);
    document.body.classList.toggle('dark', enabled);
    await this.storage.set('darkMode', enabled);
  }

  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}

