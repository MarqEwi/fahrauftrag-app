# Play-Store-Texte – Fahrauftrag Ausfüllhilfe

Alles hier zum Kopieren in die Play Console. Die Texte sind bewusst anders
aufgebaut und anders formuliert als bei BFT Tool, PFT Tool und SGT Rechner:
„wiederholter Inhalt“ ist bei mehreren Apps desselben Entwicklerkontos das
größte Ablehnungsrisiko.

## App-Name (max. 30 Zeichen)

```
Fahrauftrag Ausfüllhilfe
```

(24 Zeichen. Gleicher Name wie Logo, Website und App – ein Name überall.)

## Kurzbeschreibung (max. 80 Zeichen)

```
Kilometerstände richtig ins Kästchenraster des Fahrauftrags eintragen.
```

(70 Zeichen)

## Vollständige Beschreibung (max. 4000 Zeichen)

```
Oben die Rückkehr, darunter die Abfahrt – im Kilometerfeld des Fahrauftrags stehen die beiden Stände genau andersherum, als die Fahrt abläuft. Wer sie vertauscht, trägt rechnerisch eine negative Strecke ein. Genau hier setzt diese Ausfüllhilfe an: Du gibst zwei Zahlen ein, die App rechnet die gefahrenen Kilometer aus und zeigt jede Ziffer an der Stelle, an der sie auf dem Blatt steht.

DAS KÄSTCHENRASTER
Sechs Kästchen je Zeile, rechtsbündig wie auf dem Vordruck. Führende Kästchen bleiben leer und werden nicht mit Nullen gefüllt – eine Kleinigkeit, die beim Ausfüllen von Hand regelmäßig für Rückfragen sorgt. Dieselben Felder lassen sich per Umschalter für Betriebsstunden statt Kilometer nutzen.

WENN ETWAS NICHT ZUSAMMENPASST
Ist der Stand bei der Rückkehr kleiner als bei der Abfahrt, sagt die App das im Klartext – meist sind dann die beiden Zeilen vertauscht. Auch bei null Kilometern und bei ungewöhnlich großen Differenzen kommt ein Hinweis zum Gegenprüfen. Ausgegeben wird nur, was sich aus den Eingaben sicher ergibt; geraten wird nichts.

MEHRERE TAGE AUF EINMAL NACHHOLEN
Der Klassiker: Ein paar Tage nicht eingetragen, und jetzt fehlt die halbe Woche. Trag den letzten eingetragenen Stand und den Stand von heute ein, dazu je Fahrt die gefahrenen Kilometer – die App baut daraus die Kette der Kilometerstände, denn jede Abfahrt ist die Rückkehr der Fahrt davor. Eine große Zahl zeigt jederzeit, wie viel noch offen ist. Hast du dir für eine Fahrt einen Stand notiert, hängt sich die Kette an diesem festen Punkt auf. Jede Zeile lässt sich groß im Kästchenraster anzeigen und Stück für Stück abtragen.

UHRZEITEN, WENN DU SIE BRAUCHST
Zuschaltbar in den Einstellungen, ab Werk aus: Beginn und Ende eintragen, Fahrzeit ablesen – Fahrten über Mitternacht eingerechnet. Beim Nachtragen weist die App auf Überschneidungen, fehlende Pausen, lange Fahrtage und kurze Ruhezeiten hin. Das sind Gedächtnisstützen, keine Prüfung einer Vorschrift: Die App sieht nur die Lücken zwischen den eingetragenen Fahrten und kennt weder Pausen innerhalb einer Fahrt noch Ausnahmen.

VIER DESIGNS
Automatisch, Hell, Dunkel – und Klassisch: Schwarz auf Papierweiß mit Haarlinien und geraden Kanten, angelehnt an die Optik des Vordrucks. Praktisch, wenn man zwischen Bildschirm und Blatt hin- und herschaut.

OHNE KONTO, OHNE SERVER
Alle Eingaben bleiben lokal auf dem Gerät. Kein Konto, keine Anmeldung, kein Tracking; die App läuft vollständig offline.

EINMAL ZAHLEN STATT ABO
Kostenlos trägst du mit Werbung ein und führst ein Blatt mit bis zu fünf nachgetragenen Fahrten. Premium (einmaliger Kauf, kein Abo) entfernt die Werbung, hebt die Grenze auf, erlaubt mehrere Blätter parallel – eines je Fahrzeug – und schaltet die Ausgabe als PDF, Bild und Text sowie das Drucken frei.

WAS DIE APP NICHT IST
Sie ist ein Rechen- und Zuordnungshelfer, kein Formular und kein Ersatz für den amtlichen Vordruck: Eingetragen wird weiterhin von Hand. Sie bildet den Vordruck nicht nach, kennt keine Dienststellen, Fahrzeuge oder Aufträge aus irgendeinem System und sendet nichts an einen Server.

RECHTLICHER HINWEIS
Privates, inoffizielles Projekt – kein Angebot der Bundeswehr und in keiner Weise mit ihr verbunden. „Fahrauftrag“ wird ausschließlich beschreibend verwendet. Für die Richtigkeit der Eintragungen bleibt die fahrzeugführende Person verantwortlich. Alle Angaben ohne Gewähr.
```

(rund 3400 Zeichen)

## Grafiken

Alle fertig unter `docs/store-grafiken/`:

| Was | Datei |
|---|---|
| App-Symbol 512×512 | `icons/icon-512.png` |
| Feature-Grafik 1024×500 | `docs/store-grafiken/feature-grafik.png` |
| Screenshots 1080×1920 | `docs/store-grafiken/screenshot-1.png` … `-5.png` |
| Produktsymbol Premium 512×512 | `docs/store-grafiken/produktsymbol-premium-512.png` |

Die Screenshots zeigen der Reihe nach: Kästchenraster · Fehlermeldung bei
vertauschten Zeilen · Nachtragen mit aufgehender Kette · offener Rest ·
Uhrzeiten in der Vordruck-Darstellung. Alle Daten darin sind erfunden
(Musterstadt, Beispielheim, `PKW Y-123 456`).

Neu bauen lassen sie sich mit `docs/store-grafiken/quelle/` – siehe die
README dort.

## Formulare (Kurzreferenz)

| Formular | Antwort |
|---|---|
| Anzeigen | **Ja, enthält Werbung** |
| Werbe-ID | **Ja**, Zweck „Werbung“ |
| Zielgruppe | **18+**, „spricht Kinder an?“ → Nein |
| Gesundheits-Erklärung | **Keine** Gesundheitsfunktionen (die App misst nichts am Menschen) |
| Datenschutz-URL | `https://mercwerk.de/fahrauftrag/datenschutz.html` |
| Kategorie | Produktivität |

**Data Safety** – mit AdMob gilt **nicht** „keine Daten“. Erhoben und geteilt
werden vier Datenarten:

- Geräte- oder andere IDs (Werbe-ID)
- Standort → ungefährer Standort
- App-Aktivität → App-Interaktionen
- App-Informationen und Leistung → Absturzprotokolle, Diagnose

Für alle vier gleich: **erhoben und geteilt**, **erforderlich**, Zweck
**Werbung und Analyse** (bei den IDs zusätzlich Betrugsprävention und
Sicherheit), **nicht** sitzungsspezifisch. Verschlüsselt bei der Übertragung:
ja. Löschfunktion: nein.

Die App selbst überträgt nichts – die vier Punkte betreffen ausschließlich
das Werbe-SDK.

## In-App-Produkt

| Feld | Wert |
|---|---|
| Produkt-ID | `premium_unlock` (exakt so, später nicht änderbar) |
| Kaufoptions-ID | `premium-unlock` (nur Bindestriche erlaubt) |
| Preis | 2,99 € |
| Einstufung | Digitale Inhalte |
