# Farben – Logo und App

Zum Nachbauen für die Schwester-Apps. Alle Werte sind die **verbindlichen**
Zahlen aus Code und Vorlage, nicht mit der Pipette aus dem PNG gegriffen:
Das Logo stammt aus einer KI-Erzeugung und hat im Bild ein leichtes Rauschen
(Flächenpixel schwanken zwischen `#555E27` und `#585F2A`). Wer aus der Datei
pickt, erwischt einen Zufallswert.

## Logo – drei Farben, mehr nicht

| Rolle | Wert | Verwendung |
|---|---|---|
| Fläche | `#585F2A` | Hintergrund der Kachel; steht so in `android/app/src/main/res/values/ic_launcher_background.xml` |
| Schrift | `#F2EFE2` | Wortmarke, warmes Creme statt Reinweiß |
| Piktogramm | `#000000` | Tacho, reines Schwarz |

Das Verhältnis trägt das Logo: eine große ruhige Fläche, ein schwarzes Motiv,
ein heller Schriftzug davor. Für eine Schwester-App reicht es, das
Piktogramm zu tauschen.

## Akzentfarben der App

Der Olivton des Logos ist bewusst **dunkler und kräftiger** als der Akzent in
der App – im Icon steht er großflächig, in der App nur auf Knöpfen.

| Marke | Hell | Dunkel |
|---|---|---|
| `--accent` (Knöpfe, Kopfzeile) | `#4A6234` | `#8FA96D` |
| `--accent2` (Links, Ergebniszahl) | `#3F5530` | `#A9C189` |
| `--bg` (Seitengrund) | `#F1F2EC` | `#14170F` |
| `--bg2` (Karten, Felder) | `#FFFFFF` | `#1E2219` |
| `--bg3` (abgesetzte Flächen) | `#E9EBE2` | `#272C20` |
| `--text` | `#171A15` | `#E9ECDF` |
| `--text2` (gedämpft) | `#5F6659` | `#A3AA95` |

## Flecktarn-Hintergrund

Das Polygon-Muster stammt aus dem PFT Tool und liegt als Inline-SVG in der
`index.html` (`--camo`). Darunter ein Grundton, der nur greift, wenn die
Grafik fehlt:

| | Wert |
|---|---|
| Grundton hell | `#3F4A33` |
| Grundton dunkel | `#232A1C` |
| Kartenfläche hell (`--panel`) | `rgba(255,255,255,.93)` |
| Kartenfläche dunkel (`--panel`) | `rgba(24,28,19,.93)` |

Die halbtransparenten Karten sind kein Schmuck: Ohne sie ist vom Muster
nichts zu sehen, mit voller Transparenz wird die Schrift unlesbar.

## Klassisch (Optik des Vordrucks)

Kein Oliv, kein Muster – Papier:

| Marke | Wert |
|---|---|
| Grund | `#E8E6DE` |
| Karten | `#FBFAF5` |
| Linien und Schrift | `#000000` |
