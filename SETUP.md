# MeetMeFit Setup Guide

## Schnellstart

### 1. Dependencies installieren
```bash
npm install
```

### 2. Supabase konfigurieren

1. Gehen Sie zu [supabase.com](https://supabase.com) und erstellen Sie ein neues Projekt
2. Öffnen Sie den SQL Editor in Ihrem Supabase Dashboard
3. Kopieren Sie den Inhalt von `supabase-schema.sql` und führen Sie ihn aus
4. Gehen Sie zu Project Settings > API
5. Kopieren Sie:
   - Project URL
   - anon/public key

6. Aktualisieren Sie `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'IHRE_SUPABASE_URL',
  supabaseAnonKey: 'IHR_SUPABASE_ANON_KEY'
};
```

7. Aktualisieren Sie auch `src/environments/environment.prod.ts` mit denselben Werten

### 3. App starten (Browser)
```bash
npm start
```

Die App öffnet sich automatisch im Browser auf `http://localhost:4200`

### 4. Für Android Emulator

1. **Build erstellen:**
```bash
npm run build
```

2. **Capacitor synchronisieren:**
```bash
npx cap sync
```

3. **Android Studio öffnen:**
```bash
npx cap open android
```

4. **Im Android Studio:**
   - Warten Sie, bis Gradle Sync abgeschlossen ist
   - Erstellen Sie einen Android Virtual Device (AVD) falls noch nicht vorhanden
   - Klicken Sie auf "Run" (grüner Play-Button)
   - Wählen Sie Ihren Emulator aus

### 5. Erste Schritte in der App

1. **Registrierung:**
   - Öffnen Sie die App
   - Klicken Sie auf "Registrieren"
   - Geben Sie Name, E-Mail und Passwort ein
   - Nach der Registrierung werden Sie automatisch angemeldet

2. **Profilbild hinzufügen:**
   - Gehen Sie zum "Profil" Tab
   - Klicken Sie auf das Kamera-Icon
   - Nehmen Sie ein Foto auf oder wählen Sie eines aus der Galerie

3. **Trainingsangebot erstellen:**
   - Gehen Sie zum "Feed" Tab
   - Klicken Sie auf das "+" Icon unten rechts
   - Füllen Sie das Formular aus:
     - Sportart auswählen
     - Ort eingeben
     - Datum & Uhrzeit wählen
     - Optional: Beschreibung hinzufügen
   - Klicken Sie auf "Erstellen"

4. **Nahegelegene Angebote finden:**
   - Gehen Sie zum "In der Nähe" Tab
   - Die App fragt nach Standortberechtigung
   - Sie sehen alle Trainingsangebote in einem 10km Radius

## Troubleshooting

### "Supabase URL nicht konfiguriert" Fehler
- Überprüfen Sie `src/environments/environment.ts`
- Stellen Sie sicher, dass die Werte korrekt sind (ohne Anführungszeichen um die Platzhalter)

### Geolocation funktioniert nicht im Browser
- Im Browser benötigt Geolocation HTTPS (außer localhost)
- Für Tests können Sie `http://localhost:4200` verwenden
- In Produktion muss HTTPS aktiviert sein

### Camera Plugin Fehler
- Im Browser: Funktioniert nur über HTTPS oder localhost
- Im Emulator: Stellen Sie sicher, dass der Emulator eine Kamera-Simulation unterstützt
- Auf echtem Gerät: Überprüfen Sie die App-Berechtigungen

### "Cannot find module" Fehler
- Führen Sie `npm install` erneut aus
- Löschen Sie `node_modules` und `package-lock.json`, dann `npm install`

### Build Fehler
- Stellen Sie sicher, dass alle Dependencies installiert sind: `npm install`
- Überprüfen Sie TypeScript-Version: `npx tsc --version`
- Sollte mindestens Version 5.0 sein

## Nächste Schritte

- **Icons anpassen:** Platzieren Sie Ihre Icons in `resources/` und führen Sie `ionic resources` aus
- **Splash Screen:** Anpassen in `resources/`
- **App-Name ändern:** In `capacitor.config.ts` und `package.json`
- **Theming:** Anpassen in `src/theme/variables.scss`

## Wichtige Dateien

- `src/environments/environment.ts` - Supabase Konfiguration
- `supabase-schema.sql` - Datenbankschema
- `capacitor.config.ts` - App-Konfiguration
- `src/app/services/` - Alle Services (Auth, Supabase, Storage, Theme)

## Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole auf Fehler
2. Überprüfen Sie die Supabase Logs im Dashboard
3. Stellen Sie sicher, dass alle RLS-Policies korrekt gesetzt sind


