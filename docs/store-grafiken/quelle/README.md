# Quelle der Store-Grafiken

Hier liegt alles, was gebraucht wird, um die Grafiken im Ordner darüber neu zu
bauen – ohne die KI-Hintergründe erneut erzeugen zu müssen (das ist der
teuerste Schritt).

- `konfig.json` – steuert Aufnahme und Aufbau
- `v1.jpg` … `v5.jpg` – Hintergründe der Screenshots (Higgsfield, 9:16)
- `fb.jpg` – Hintergrund der Feature-Grafik (Higgsfield, 21:9)

## Neu bauen

Die App muss dabei über einen lokalen Server laufen, nicht über `file://`:

```bash
cd /pfad/zum/projekt
python3 -m http.server 8125 --bind 127.0.0.1 &

# Rohaufnahmen. Die Sprachvariablen sind nicht schmückendes Beiwerk:
# Ohne sie zeigt Chromium <input type="time"> im 12-Stunden-Format
# ("04:45 PM") statt wie auf einem deutschen Gerät "16:45".
LANG=de_DE.UTF-8 LANGUAGE=de_DE:de LC_ALL=de_DE.UTF-8 \
  node ~/.claude/skills/mercwerk-store-grafiken/scripts/aufnehmen.mjs \
  docs/store-grafiken/quelle/konfig.json

# Grafiken bauen (--nur feature bzw. --nur screenshots für Teilstücke)
python3 ~/.claude/skills/mercwerk-store-grafiken/scripts/storegrafik.py \
  docs/store-grafiken/quelle/konfig.json
```

Die Rohaufnahmen (`roh*.png`) entstehen dabei in diesem Ordner und werden
nicht mit eingecheckt – sie sind aus der App jederzeit reproduzierbar.

## Was in den Bildern zu sehen ist

Ausschließlich **erfundene Daten**: Musterstadt, Beispielheim, Kennzeichen
`PKW Y-123 456`, Kilometerstände 27716/27768. Ein Store-Eintrag ist
öffentlich und bleibt es – echte Kennzeichen, Namen, Dienststellen oder
Orte dürfen dort nicht auftauchen.
