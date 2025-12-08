import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  IonAvatar,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { location, navigate, person } from 'ionicons/icons';
import { SupabaseService, TrainingOffer, Profile } from '../services/supabase.service';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    CommonModule,
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
    IonAvatar,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent
  ]
})
export class Tab2Page implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  nearbyOffers: TrainingOffer[] = [];
  isLoading = false;
  currentLocation: { lat: number; lng: number } | null = null;
  errorMessage = '';
  map: any = null;

  constructor(private supabase: SupabaseService) {
    addIcons({ location, navigate, person });
  }

  async ngOnInit() {
    await this.loadCurrentLocation();
    await this.loadNearbyOffers();
  }

  async loadCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      this.currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error: any) {
      console.error('Error getting location:', error);
      // Default to Berlin if geolocation fails
      this.currentLocation = { lat: 52.5200, lng: 13.4050 };
      this.errorMessage = 'Standort konnte nicht ermittelt werden. Zeige Standardposition (Berlin).';
    }
  }

  async loadNearbyOffers() {
    if (!this.currentLocation) {
      await this.loadCurrentLocation();
    }

    if (!this.currentLocation) {
      this.errorMessage = 'Standort erforderlich, um nahegelegene Angebote anzuzeigen.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const { data, error } = await this.supabase.getNearbyTrainingOffers(
        this.currentLocation.lat,
        this.currentLocation.lng,
        10 // 10km radius
      );

      if (error) throw error;

      if (data) {
        this.nearbyOffers = data;
      }
    } catch (error: any) {
      console.error('Error loading nearby offers:', error);
      this.errorMessage = 'Fehler beim Laden der nahegelegenen Angebote';
    } finally {
      this.isLoading = false;
    }
  }

  async handleRefresh(event: any) {
    await this.loadCurrentLocation();
    await this.loadNearbyOffers();
    event.target.complete();
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  getDistance(offer: TrainingOffer): number {
    if (!this.currentLocation || !offer.latitude || !offer.longitude) return 0;
    return this.calculateDistance(
      this.currentLocation.lat,
      this.currentLocation.lng,
      offer.latitude,
      offer.longitude
    );
  }

  async openInMaps(offer: TrainingOffer) {
    if (!offer.latitude || !offer.longitude) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${offer.latitude},${offer.longitude}`;
    window.open(url, '_blank');
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
}
