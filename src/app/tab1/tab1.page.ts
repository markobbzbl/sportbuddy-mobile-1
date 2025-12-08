import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonAvatar,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonSpinner,
  IonButtons,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, location, time, person, create, trash, close } from 'ionicons/icons';
import { SupabaseService, TrainingOffer, Profile } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
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
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonAvatar,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonModal,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToast,
    IonSpinner,
    IonButtons,
    IonText
  ]
})
export class Tab1Page implements OnInit {
  trainingOffers: TrainingOffer[] = [];
  isLoading = false;
  isModalOpen = false;
  isEditMode = false;
  editingOffer: TrainingOffer | null = null;
  offerForm: FormGroup;
  errorMessage = '';
  successMessage = '';

  sportTypes = [
    'Fußball',
    'Basketball',
    'Tennis',
    'Joggen',
    'Fahrrad fahren',
    'Schwimmen',
    'Volleyball',
    'Badminton',
    'Tischtennis',
    'Fitness',
    'Yoga',
    'Andere'
  ];

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private storage: StorageService,
    private fb: FormBuilder
  ) {
    addIcons({ add, location, time, person, create, trash, close });

    this.offerForm = this.fb.group({
      sport_type: ['', Validators.required],
      location: ['', Validators.required],
      latitude: [0],
      longitude: [0],
      date_time: ['', Validators.required],
      description: ['']
    });
  }

  async ngOnInit() {
    await this.loadTrainingOffers();
  }

  async loadTrainingOffers() {
    this.isLoading = true;
    try {
      const { data, error } = await this.supabase.getTrainingOffers();
      if (error) throw error;

      if (data) {
        this.trainingOffers = data;
        // Store offline
        await this.storage.set('offline_training_offers', data);
      } else {
        // Try to load from offline storage
        const offlineOffers = await this.storage.get<TrainingOffer[]>('offline_training_offers');
        if (offlineOffers) {
          this.trainingOffers = offlineOffers;
        }
      }
    } catch (error: any) {
      console.error('Error loading training offers:', error);
      // Try offline storage
      const offlineOffers = await this.storage.get<TrainingOffer[]>('offline_training_offers');
      if (offlineOffers) {
        this.trainingOffers = offlineOffers;
        this.errorMessage = 'Offline-Modus: Zeige gespeicherte Angebote';
      } else {
        this.errorMessage = 'Fehler beim Laden der Trainingsangebote';
      }
    } finally {
      this.isLoading = false;
    }
  }

  async handleRefresh(event: any) {
    await this.loadTrainingOffers();
    event.target.complete();
  }

  openCreateModal() {
    this.isEditMode = false;
    this.editingOffer = null;
    this.offerForm.reset();
    this.isModalOpen = true;
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            // Default to Berlin if geolocation fails
            resolve({ lat: 52.5200, lng: 13.4050 });
          }
        );
      } else {
        // Default to Berlin if geolocation not available
        resolve({ lat: 52.5200, lng: 13.4050 });
      }
    });
  }

  async onSubmitOffer() {
    if (this.offerForm.invalid) {
      this.markFormGroupTouched(this.offerForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('Nicht angemeldet');
      }

      const formValue = this.offerForm.value;
      
      // Get current location if not set
      if (!formValue.latitude || !formValue.longitude) {
        const location = await this.getCurrentLocation();
        formValue.latitude = location.lat;
        formValue.longitude = location.lng;
      }

      if (this.isEditMode && this.editingOffer) {
        // Update existing offer
        const { error } = await this.supabase.updateTrainingOffer(
          this.editingOffer.id,
          formValue
        );
        if (error) throw error;
        this.successMessage = 'Trainingsangebot erfolgreich aktualisiert';
      } else {
        // Create new offer
        const { error } = await this.supabase.createTrainingOffer({
          user_id: user.id,
          ...formValue
        });
        if (error) throw error;
        this.successMessage = 'Trainingsangebot erfolgreich erstellt';
      }

      await this.loadTrainingOffers();
      this.isModalOpen = false;
      this.offerForm.reset();
    } catch (error: any) {
      this.errorMessage = error.message || 'Fehler beim Speichern des Trainingsangebots';
    } finally {
      this.isLoading = false;
    }
  }

  openEditModal(offer: TrainingOffer) {
    this.isEditMode = true;
    this.editingOffer = offer;
    this.offerForm.patchValue({
      sport_type: offer.sport_type,
      location: offer.location,
      latitude: offer.latitude || 0,
      longitude: offer.longitude || 0,
      date_time: offer.date_time ? new Date(offer.date_time).toISOString().slice(0, 16) : '',
      description: offer.description || ''
    });
    this.isModalOpen = true;
  }

  async deleteOffer(offer: TrainingOffer) {
    if (!confirm('Möchten Sie dieses Trainingsangebot wirklich löschen?')) {
      return;
    }

    this.isLoading = true;
    try {
      const { error } = await this.supabase.deleteTrainingOffer(offer.id);
      if (error) throw error;
      this.successMessage = 'Trainingsangebot erfolgreich gelöscht';
      await this.loadTrainingOffers();
    } catch (error: any) {
      this.errorMessage = error.message || 'Fehler beim Löschen des Trainingsangebots';
    } finally {
      this.isLoading = false;
    }
  }

  canEditOrDelete(offer: TrainingOffer): boolean {
    const user = this.authService.getCurrentUser();
    return user?.id === offer.user_id;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getProfileName(profile?: Profile): string {
    if (!profile) return 'Unbekannt';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unbekannt';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getMinDateTime(): string {
    return new Date().toISOString().slice(0, 16);
  }

  closeModal() {
    this.isModalOpen = false;
    this.offerForm.reset();
    this.editingOffer = null;
    this.isEditMode = false;
  }
}
