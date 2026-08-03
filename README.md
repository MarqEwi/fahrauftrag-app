# Fahrauftrag Ausfüllhilfe (inoffiziell)

Eintraghilfe für die **Kilometerfelder im Fahrauftrag** der Bundeswehr: Den
km-Stand bei der Abfahrt und bei der Rückkehr eingeben – die App rechnet die
gefahrenen Kilometer aus und zeigt im Kästchenraster, welche Zahl in welche
Zeile gehört.

> **Inoffizielle App** – privates Projekt, kein Angebot der Bundeswehr.
> Kein Formular und kein Ersatz für den amtlichen Vordruck; eingetragen wird
> weiterhin von Hand. Alle Angaben ohne Gewähr.

## Wobei die App hilft

Im Kilometerfeld steht die **Rückkehr oben** und die **Abfahrt darunter** –
also genau andersherum, als die Fahrt abläuft. Wer die beiden Zeilen
vertauscht, trägt eine negative Strecke ein. Die App zeigt beide Zahlen an der
Stelle, an der sie auf dem Blatt stehen, und daneben die Differenz.

- Abfahrt- und Rückkehr-km eingeben, gefahrene Kilometer sofort ablesen
- Kästchenraster mit sechs Feldern je Zeile, rechtsbündig wie auf dem Vordruck;
  führende Kästchen bleiben leer statt mit Nullen gefüllt zu werden
- Umschalter **Kilometer / Betriebsstunden** (dieselben Felder, andere Einheit)
- Klare Fehlermeldung, wenn der Rückkehr-Stand kleiner ist als der Abfahrt-Stand –
  meist sind dann die beiden Zeilen vertauscht
- Prüfhinweise bei 0 km und bei ungewöhnlich großen Differenzen
- **Uhrzeiten** (in den Einstellungen zuschaltbar, standardmäßig aus): Beginn und
  Ende eintragen, Fahrzeit wird ausgerechnet – Fahrten über Mitternacht inbegriffen.
  Ab mehr als 4:30 Stunden erscheint ein Hinweis auf die Lenk- und Ruhezeiten
  (eine Gedächtnisstütze, keine Prüfung einer Vorschrift)
- Design zur Wahl: **Automatisch**, **Hell**, **Dunkel** und **Klassisch** –
  Letzteres ist Schwarz auf Papierweiß mit Haarlinien und geraden Kanten,
  angelehnt an die Optik des Vordrucks
- Komplett offline, alle Daten bleiben lokal auf dem Gerät (kein Server, kein Tracking)

## Fahrten nachtragen

Für den Fall, dass mehrere Tage auf einmal nachgeholt werden müssen: Du gibst
den letzten eingetragenen Stand und den Stand von heute an, dazu je Fahrt die
gefahrenen Kilometer – die App baut daraus die Kette der Kilometerstände (jede
Abfahrt ist die Rückkehr der Fahrt davor) und sagt jederzeit, wie viel noch
offen ist. Hast du dir für eine einzelne Fahrt einen Stand notiert, kannst du
statt der Kilometer diesen Stand angeben; die Kette hängt sich dann an diesem
festen Punkt auf.

Sind die **Uhrzeiten** eingeschaltet, lassen sich Beginn und Ende auch je
nachgetragener Fahrt eintragen. Die Liste ordnet sich dann selbst nach Datum;
innerhalb eines Tages bestimmst du die Reihenfolge über die Pfeile an der Zeile.
Die App weist hin auf:

- **Überschneidungen** – zwei Fahrten können nicht gleichzeitig stattfinden
- **fehlende Pausen** – nach spätestens 4:30 Stunden Fahrzeit sind 45 Minuten
  vorgesehen (teilbar in 15 und danach 30 Minuten)
- **lange Tage** – über 9 Stunden Fahrzeit, ab 10 Stunden deutlicher
- **kurze Ruhezeiten** – weniger als 11 Stunden zwischen zwei Tagen

Das sind **Hinweise, keine Prüfung**: Die App sieht nur die Lücken zwischen den
eingetragenen Fahrten. Pausen innerhalb einer Fahrt, andere Arbeitszeit und
Ausnahmen kennt sie nicht.

Zwei Dinge macht die App dabei bewusst **nicht**:

- Sie verteilt einen offenen Rest **nicht selbsttätig** auf die Fahrten. Der
  Rest steht sichtbar da; ein ausdrücklicher Knopf macht daraus eine eigene
  Zeile, die von Hand gefüllt wird.
- Sie gibt **keine lückenhafte Kette** aus. Nach einer fehlerhaften Zeile steht
  keine Abfahrt mehr fest – alle folgenden Zeilen wären geraten.

## Editionen

- **Frei:** mit Werbung, bis zu 5 Fahrten je Nachtrag
- **Premium** (einmalig 2,99 €): werbefrei, beliebig lange Nachträge,
  Ausgabe als PDF, Bild oder Text sowie Drucken

## Technik

- Eine einzige, in sich geschlossene `index.html` (inline CSS/JS, keine externen Abhängigkeiten)
- `npm run sync` kopiert die Web-Dateien nach `www/` (Quelle für die Capacitor-App)
- Service Worker (`sw.js`) wird nur auf `github.io` registriert, nicht in der App
- Native Brücke mit Feature-Detection (`window.Capacitor`): Datei-Export und Drucken laufen im
  Browser über `a.download`/`window.print()`, in der Android-App über Capacitor-Plugins
- Plugins werden ausschließlich über `window.Capacitor.Plugins.<Name>` angesprochen
  (kein Bundler, daher kein `Capacitor.registerPlugin`)
- localStorage-Schlüssel tragen durchgehend das Präfix `fa_`, damit sich die
  Web-Versionen der App-Familie unter derselben Origin nicht überschreiben

## Was die App bewusst nicht tut

- Sie bildet **den Vordruck nicht nach.** Das Kästchenraster ist eine eigene,
  vereinfachte Darstellung als Eintraghilfe – kein ausfüllbares Formular.
- Sie kennt **keine Dienststellen, Fahrzeuge oder Aufträge** aus irgendeinem System.
- Sie sendet **nichts** an einen Server.

## Web-Version

Die App läuft als Web-Version unter: <https://marqewi.github.io/fahrauftrag-app/>
(GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root)
