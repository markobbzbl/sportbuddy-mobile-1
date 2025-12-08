import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonAvatar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToast,
  IonSpinner,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person, camera, logOut, save, create, moon, sunny, images } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../services/auth.service';
import { SupabaseService, Profile } from '../services/supabase.service';
import { StorageService } from '../services/storage.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonAvatar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonToast,
    IonSpinner,
    IonText
  ]
})
export class Tab3Page implements OnInit {
  profile: Profile | null = null;
  profileForm: FormGroup;
  isLoading = false;
  isEditing = false;
  avatarUrl: string | null = null;
  errorMessage = '';
  successMessage = '';
  isDarkMode = false;
  userEmail: string = '';

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private storage: StorageService,
    private themeService: ThemeService,
    private router: Router,
    private fb: FormBuilder
  ) {
    addIcons({ person, camera, logOut, save, create, moon, sunny, images });

    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(1)]],
      last_name: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  async ngOnInit() {
    await this.loadProfile();
    this.themeService.darkMode$.subscribe(dark => {
      this.isDarkMode = dark;
    });
  }

  async loadProfile() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.userEmail = user.email || '';

    this.isLoading = true;
    try {
      const profile = await this.supabase.getProfile(user.id);
      if (profile) {
        this.profile = profile;
        this.avatarUrl = profile.avatar_url || null;
        this.profileForm.patchValue({
          first_name: profile.first_name || '',
          last_name: profile.last_name || ''
        });
        // Store offline
        await this.storage.set('offline_profile', profile);
      } else {
        // Try offline storage
        const offlineProfile = await this.storage.get<Profile>('offline_profile');
        if (offlineProfile) {
          this.profile = offlineProfile;
          this.avatarUrl = offlineProfile.avatar_url || null;
          this.profileForm.patchValue({
            first_name: offlineProfile.first_name || '',
            last_name: offlineProfile.last_name || ''
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      // Try offline storage
      const offlineProfile = await this.storage.get<Profile>('offline_profile');
      if (offlineProfile) {
        this.profile = offlineProfile;
        this.avatarUrl = offlineProfile.avatar_url || null;
        this.profileForm.patchValue({
          first_name: offlineProfile.first_name || '',
          last_name: offlineProfile.last_name || ''
        });
      }
    } finally {
      this.isLoading = false;
    }
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        this.avatarUrl = image.dataUrl;
        await this.uploadAvatar(image.dataUrl);
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        this.errorMessage = 'Fehler beim Aufnehmen des Fotos';
      }
    }
  }

  async selectPicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (image.dataUrl) {
        this.avatarUrl = image.dataUrl;
        await this.uploadAvatar(image.dataUrl);
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        this.errorMessage = 'Fehler beim Auswählen des Fotos';
      }
    }
  }

  async uploadAvatar(dataUrl: string) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.isLoading = true;
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

      const { data, error } = await this.supabase.uploadAvatar(user.id, file);
      if (error) throw error;

      if (data?.publicUrl) {
        this.avatarUrl = data.publicUrl;
        await this.supabase.updateProfile(user.id, { avatar_url: data.publicUrl });
        this.successMessage = 'Profilbild erfolgreich aktualisiert';
        await this.loadProfile();
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      this.errorMessage = 'Fehler beim Hochladen des Profilbilds';
    } finally {
      this.isLoading = false;
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.profile) {
      this.profileForm.patchValue({
        first_name: this.profile.first_name || '',
        last_name: this.profile.last_name || ''
      });
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const { data, error } = await this.supabase.updateProfile(user.id, this.profileForm.value);
      if (error) throw error;

      if (data) {
        this.profile = data;
        await this.storage.set('offline_profile', data);
        this.successMessage = 'Profil erfolgreich aktualisiert';
        this.isEditing = false;
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Fehler beim Aktualisieren des Profils';
    } finally {
      this.isLoading = false;
    }
  }

  async signOut() {
    if (!confirm('Möchten Sie sich wirklich abmelden?')) {
      return;
    }

    this.isLoading = true;
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.errorMessage = 'Fehler beim Abmelden';
    } finally {
      this.isLoading = false;
    }
  }

  async toggleDarkMode() {
    await this.themeService.toggleDarkMode();
  }

  getProfileName(): string {
    if (!this.profile) return 'Kein Name';
    const firstName = this.profile.first_name || '';
    const lastName = this.profile.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Kein Name';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
