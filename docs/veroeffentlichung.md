# Veröffentlichung Schritt für Schritt (Fahrauftrag Ausfüllhilfe)

> **Stand:** Die Veröffentlichung im Play Store ist **zurückgestellt**.
> Die App läuft vorerst nur als werbefreie Web-Vollversion (mercwerk.de).
> Diese Checkliste bleibt für später vollständig erhalten; im Code steht
> alles bereit (Test-IDs, TESTING: true).

Einfache Checkliste für alle Schritte außerhalb des Codes. Reihenfolge einhalten –
jeder Block ist unabhängig abhakbar.

## 1. GitHub Pages aktivieren (Web-Version + Datenschutz-URL)

1. Im Browser das Repo öffnen: `github.com/MarqEwi/fahrauftrag-app`
2. Oben auf **Settings** → links auf **Pages**
3. Bei „Build and deployment“: **Deploy from a branch** wählen,
   Branch **main**, Ordner **/ (root)** → **Save**
4. Nach 1–2 Minuten ist die App unter `https://marqewi.github.io/fahrauftrag-app/`
   erreichbar – und die Datenschutzerklärung unter
   `https://marqewi.github.io/fahrauftrag-app/datenschutz.html`

**Hinweis:** Die App läuft bereits unter `https://mercwerk.de/fahrauftrag/` –
dieser Schritt ist damit erledigt. Als Datenschutz-URL für Play Console und
AdMob gilt: `https://mercwerk.de/fahrauftrag/datenschutz.html`.
Die `app-ads.txt` liegt schon auf `https://mercwerk.de/app-ads.txt` und gilt
für alle Apps des AdMob-Kontos.

## 2. AdMob: neue App + Banner anlegen

Werbung läuft **nur in der Android-App**, nicht in der Web-Version auf
mercwerk.de. Solange die App nicht im Play Store ist, verdient sie also
nichts – das Anlegen lohnt sich trotzdem vorab, weil Google für die Freigabe
Tage braucht.

**Niemals** die AdMob-IDs einer anderen App verwenden: Google wertet das als
ungültigen Traffic, und das trifft das ganze Konto.

### 2.1 App anlegen

1. [admob.google.com](https://admob.google.com) öffnen und mit **demselben
   Google-Konto** anmelden wie bei BFT, PFT und SGT.
2. Links **Apps** → **App hinzufügen**.
3. Plattform: **Android**.
4. „Ist deine App im Google Play Store oder in einem anderen App-Store
   verfügbar?“ → **Nein**. (Die App ist noch nicht veröffentlicht. Nach der
   Veröffentlichung lässt sie sich nachträglich mit dem Store-Eintrag
   verknüpfen – dafür ist kein neuer Anzeigenblock nötig.)
5. App-Name eintragen: **Fahrauftrag Ausfüllhilfe** → **App hinzufügen**.
6. Auf der nächsten Seite steht die **App-ID** im Format
   `ca-app-pub-…~…` (mit **Tilde ~**). Diese Nummer kopieren und
   aufbewahren.

### 2.2 Banner-Anzeigenblock anlegen

1. In der neu angelegten App links auf **Anzeigenblöcke** →
   **Anzeigenblock hinzufügen**.
2. Format **Banner** wählen.
3. Name: **Fahrauftrag Banner unten**. Alle weiteren Einstellungen
   (Anzeigentyp, Aktualisierungsrate) unverändert lassen.
4. **Anzeigenblock erstellen**. Danach erscheint die
   **Anzeigenblock-ID** im Format `ca-app-pub-…/…` (mit **Schrägstrich /**).
   Auch diese kopieren.

Die beiden IDs werden oft verwechselt: **Tilde = App**, **Schrägstrich =
Anzeigenblock**. Beide werden gebraucht.

### 2.3 Einwilligung nach DSGVO einrichten

1. Links **Datenschutz & Mitteilungen** → **Europäische Vorschriften (DSGVO)**.
2. Die neue App auswählen → **Meldung erstellen**.
3. Datenschutz-URL eintragen:
   `https://mercwerk.de/fahrauftrag/datenschutz.html`
4. Die Option **„Nicht einwilligen“ einschalten** – ein gleichwertiger
   Ablehnen-Knopf ist in der EU rechtlich nötig.
5. „Schließen (nicht einwilligen)“ ausgeschaltet lassen, damit es bei zwei
   klaren Knöpfen bleibt.
6. **Veröffentlichen**.

Die App kommt mit beiden Antworten zurecht: Bei Ablehnung bleibt das Banner
aus, alles andere funktioniert normal weiter.

### 2.4 Was danach im Code passiert

Mit den beiden IDs werden eingetragen:

- **App-ID** (`~`) → `android/app/src/main/AndroidManifest.xml`, ersetzt die
  Google-Test-App-ID `ca-app-pub-3940256099942544~3347511713`.
  Fehlt dieser Eintrag, **stürzt die App beim Start ab**.
- **Anzeigenblock-ID** (`/`) → `index.html` bei `ADS_CONF.BANNER_ID`,
  gleichzeitig `TESTING: false`.

### 2.5 Was danach normal ist und nicht repariert werden muss

| Beobachtung | Bedeutung |
|---|---|
| `code 3` / „Account not approved yet“ | Prüfzeit für neue Apps, Stunden bis wenige Tage. Danach laufen die Banner von selbst. |
| „Anzeigenbereitstellung begrenzt“ | Dasselbe – hebt sich nach der Prüfung auf. |
| Auf dem eigenen Gerät erscheinen **Testanzeigen**, obwohl `TESTING: false` | Absicht von Google, schützt vor versehentlichen Klicks auf die eigenen Anzeigen. Echte Nutzer sehen echte Anzeigen. |
| app-ads.txt „konnte nicht bestätigt werden“ | Der Crawl steht noch aus (bis 24 h, gelegentlich Tage). Die Datei auf `https://mercwerk.de/app-ads.txt` ist geprüft und korrekt. |

**Niemals die eigenen Anzeigen anklicken** – das führt zur Kontosperrung.

## 3. Play Console: App anlegen

1. [play.google.com/console](https://play.google.com/console) → **App erstellen**
2. Name: **Fahrauftrag Ausfüllhilfe km** (27 Zeichen) ·
   Sprache Deutsch · **App** · **Kostenlos**
3. Store-Eintrag: Texte aus `docs/store-texte.md` einfügen,
   Icon `icons/icon-512.png`, Feature-Grafik 1024×500
   (`docs/store-grafiken/feature-grafik-1024x500.png`; Hintergrundfarbe des Logos: `#585F2A`)
4. **Data Safety** ausfüllen (siehe Kurzreferenz in `docs/store-texte.md`);
   die vier AdMob-Datentypen bleiben unverändert, weil die App selbst nichts überträgt
5. Anzeigen: **Ja** · Werbe-ID: **Ja** · Zielgruppe: **18+**
6. Datenschutz-URL: `https://mercwerk.de/fahrauftrag/datenschutz.html`

## 4. Einmalkauf-Produkt anlegen

Play Console → deine App → **Monetarisieren → Produkte → In-App-Produkte** →
**Produkt erstellen**.

**Schritt 1 – Produktdetails:**

| Feld | Wert |
|---|---|
| Produkt-ID | `premium_unlock` (muss exakt so lauten – steht so im Code) |
| Tags | leer lassen |
| Name (max. 55) | `Premium freischalten` |
| Beschreibung (max. 200) | `Entfernt die Werbung, hebt das Limit von 5 Fahrten auf, erlaubt mehrere Blätter parallel und schaltet die Ausgabe als PDF, Bild oder Text sowie das Drucken frei. Einmaliger Kauf, kein Abo.` |
| Symbol | `docs/store-grafiken/produktsymbol-premium-512.png` (optional; enthält bewusst keinen Text und kein Branding – das App-Icon ist hier nicht zulässig) |
| Produktsteuerkategorie | Voreinstellung **Verkäufe digitaler Apps** beibehalten |
| Altersfreigabe | leer lassen (erbt die Einstufung der App) |
| Beschränkungen des Zahlungsortes | unverändert lassen |

**Schritt 2 – Verfügbarkeit und Preisgestaltung:**

1. Kaufoption anlegen mit der ID `premium-unlock`
2. Preis **2,99 €** setzen (Google rechnet die übrigen Währungen automatisch um)
3. Produkt und Kaufoption **aktivieren**

Wichtig: Die Produkt-ID `premium_unlock` steht so in `index.html`
(`Billing.PRODUCT`). Ein Tippfehler führt dazu, dass der Kauf-Knopf in der App
meldet, der Kauf sei nicht verfügbar.

## 5. Signieren & hochladen (Android Studio) – ausführlich

### 5.1 Projekt auf den PC holen und vorbereiten

1. Ordner für das Projekt wählen und in der Eingabeaufforderung (cmd) öffnen.
   Beim **ersten Mal** klonen:
   ```
   git clone https://github.com/MarqEwi/fahrauftrag-app.git
   cd fahrauftrag-app
   ```
   Wenn der Ordner schon existiert, stattdessen nur aktualisieren:
   ```
   cd fahrauftrag-app
   git checkout main
   git pull
   ```
2. Abhängigkeiten installieren (nur nötig, wenn `node_modules` fehlt oder sich
   `package.json` geändert hat). Das `postinstall` mit patch-package läuft
   dabei automatisch mit – es behebt einen Build-Fehler des AdMob-Plugins:
   ```
   npm install
   ```
3. Web-Dateien in die App kopieren – **vor jedem Build**:
   ```
   npm run cap:sync
   ```

### 5.2 Keystore hinterlegen (einmalig pro PC)

1. Die vorhandene Keystore-Datei (derselbe Schlüssel wie bei BFT, PFT und SGT –
   **niemals einen neuen erzeugen**, sonst lässt sich die App später nicht mehr
   aktualisieren) in den Ordner `android/` kopieren, z. B. als `android.keystore`.
2. Im Ordner `android/` die Datei `keystore.properties.example` kopieren und die
   Kopie in `keystore.properties` umbenennen (die Endung `.example` entfällt).
3. Diese Datei im Editor öffnen und die vier Werte eintragen:
   ```
   storeFile=android.keystore
   storePassword=<Keystore-Passwort>
   keyAlias=<Alias des Schlüssels>
   keyPassword=<Passwort des Schlüssels>
   ```
   `keystore.properties` und `*.keystore` stehen in `.gitignore` und landen
   deshalb nie auf GitHub.

### 5.3 Signiertes App Bundle bauen

1. Android Studio öffnen (aus dem Projektordner heraus geht auch
   `npm run cap:open`) und den Ordner `android` als Projekt laden.
   Beim ersten Start dauert die Gradle-Synchronisierung ein paar Minuten.
2. Menü **Build → Generate Signed App Bundle / APK…**
3. **Android App Bundle** auswählen → *Next*.
4. Keystore-Angaben eintragen (dieselben wie in `keystore.properties`):
   Key store path, Passwörter, Alias → *Next*.
5. Build-Variante **release** wählen → *Create*.
6. Nach dem Build erscheint unten rechts eine Meldung mit „locate“. Die Datei
   liegt unter:
   ```
   android/app/release/app-release.aab
   ```

### 5.4 In der Play Console hochladen

1. Play Console → deine App → links **Testen und veröffentlichen → Tests →
   Interner Test** (empfohlen für den ersten Upload; für die Monetarisierung
   genügt ein Bundle in irgendeinem Track).
2. **Neuen Release erstellen**.
3. Beim ersten Mal fragt Google nach der **Play App-Signatur**: die
   Standardeinstellung („Von Google Play verwalteter Signaturschlüssel“)
   einfach bestätigen. Dein Keystore ist dann der Upload-Schlüssel.
4. Die Datei `app-release.aab` hochladen.
5. Release-Name kann bleiben; unter „Versionshinweise“ z. B. eintragen:
   `Erste Version der Fahrauftrag Ausfüllhilfe.`
6. **Speichern → Release überprüfen → Freigabe starten**.

Nach diesem Upload kennt die Play Console den Paketnamen
`de.mercwerk.fahrauftragausfuellhilfe`, und das In-App-Produkt aus Schritt 4 lässt sich
anlegen.

### 5.5 Bei jedem weiteren Upload

In `android/app/build.gradle` den `versionCode` um 1 erhöhen (aktuell `1`),
bei sichtbaren Änderungen zusätzlich den `versionName` anpassen. Danach wieder
`npm run cap:sync` und neu bauen.

## 5.6 Vor der Veröffentlichung: auf dem Handy testen

1. **Lizenztester eintragen**, damit Testkäufe nichts kosten:
   Play Console → ganz links oben aufs Haus (Alle Apps) → **Einstellungen →
   Lizenztests** → eigene Google-Adresse hinzufügen → Lizenzantwort
   **RESPOND_NORMALLY** → speichern.
2. Im internen Test den **Einladungslink** öffnen (Reiter „Tester“), auf dem
   Handy mit demselben Google-Konto annehmen und die App installieren.
3. Auf dem Gerät prüfen:
   - App startet ohne Absturz (heißt: die AdMob-App-ID im Manifest stimmt)
   - Werbeleiste unten erscheint (oder bleibt leer, solange die AdMob-App noch
     in Prüfung ist – siehe Abschnitt 2)
   - Premium-Kauf lässt sich öffnen, Preis wird angezeigt, Kauf schaltet
     werbefrei; „Käufe wiederherstellen“ funktioniert
   - Diagnose bei Problemen: in den Einstellungen 5× auf die Versionsnummer
     tippen, dann erscheinen Werbe- und Kauf-Status als Textzeilen

## 5.7 In die Produktion veröffentlichen

1. Play Console → **Testen und veröffentlichen → Produktion → Neuen Release
   erstellen**.
2. Statt neu hochzuladen: **„App-Bundles hinzufügen“ → aus der Bibliothek** das
   bereits hochgeladene Bundle (versionCode 1) auswählen. Alternativ lässt sich
   der interne Test über **„Release hochstufen → Produktion“** direkt übernehmen.
3. Länder/Regionen auswählen (z. B. alle, oder nur Deutschland/Österreich/Schweiz).
4. Versionshinweise eintragen, **Speichern → Release überprüfen →
   Freigabe starten**.
5. Die Prüfung durch Google dauert bei neuen Apps üblicherweise einige Stunden
   bis wenige Tage. Danach ist die App im Play Store sichtbar.

Hinweis: Falls die Play Console vor der Produktion einen **geschlossenen Test
mit 12 Testern über 14 Tage** verlangt, betrifft das neuere private
Entwicklerkonten. Dann zuerst diesen Test durchlaufen lassen; an der App selbst
ändert sich dadurch nichts.

## 6. Nach der AdMob-Freigabe

**Stand jetzt stehen im Code noch Googles Test-IDs** (`TESTING: true` in
`ADS_CONF`, Test-App-ID im `AndroidManifest.xml`). Sobald die eigene AdMob-App
nach Schritt 2 angelegt ist, beide IDs eintragen und `TESTING` auf `false`
setzen – erst dann verdient die App etwas.

Danach passiert die Freigabe allein auf Googles Seite – ein neuer Build ist
dafür **nicht** nötig. Sobald AdMob die App freigegeben hat, erscheinen die
Banner von selbst.

**Niemals** die AdMob-IDs des SGT Rechners in dieser App verwenden: Google
wertet das als ungültigen Traffic und das trifft das ganze Konto.
