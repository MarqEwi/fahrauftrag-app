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
- Kästchenraster mit sechs Feldern je Zeile, rechtsbündig wie auf dem Vordruck
- Umschalter **Kilometer / Betriebsstunden** (dieselben Felder, andere Einheit)
- Warnung, wenn der Rückkehr-Stand kleiner ist als der Abfahrt-Stand
- Startort/Zielort als freiwillige Notiz
- Komplett offline, alle Daten bleiben lokal auf dem Gerät (kein Server, kein Tracking)

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
