// Nachtragen: die Kette aus mehreren Fahrten muss vom letzten eingetragenen
// Stand exakt bis zum aktuellen Stand des Fahrzeugs reichen. Geprüft werden
// die Kettenrechnung, beide Eingabearten (gefahrene km / notierter Stand),
// der Rest-Knopf und die Grenze der freien Version.
import { test, expect } from "@playwright/test";

/* Legt einen Nachtrag direkt im Speicher an – spart Klicks in den Tests.
   Editionen (frei/premium) gibt es nur in der Android-App; im Browser ist
   die App die Vollversion. Tests der freien Grenzen stellen die App
   deshalb mit { app: true } nach. */
async function mitNachtrag(page, nachtrag, { premium = false, app = false } = {}){
  await page.addInitScript(([nt, prem, inApp]) => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.removeItem("fa_nachtraege");   // erzwingt die Übernahme des Altbestands
    localStorage.setItem("fa_nachtrag", JSON.stringify(nt));
    if (prem) localStorage.setItem("fa_edition", JSON.stringify("premium"));
    if (inApp) window.Capacitor = { isNativePlatform: () => true, Plugins: {} };
  }, [nachtrag, premium, app]);
  await page.goto("/");
  await page.click("#go-nachtragen");
}

const KETTE = {
  start: "27716", aktuell: "28361", modus: "km",
  fahrten: [
    { datum: "2026-07-14", strecke: "Musterstadt – Beispielheim", art: "km", km: 230, stand: null },
    { datum: "2026-07-15", strecke: "Beispielheim – Musterheim", art: "stand", km: null, stand: 28093 },
    { datum: "2026-07-16", strecke: "Rückfahrt", art: "km", km: 268, stand: null }
  ]
};

test("Der offene Rest wandert beim Blättern mit", async ({ page }) => {
  await mitNachtrag(page, { ...KETTE, fahrten: KETTE.fahrten.slice(0, 1) });
  await expect(page.locator("#km-sticky")).toBeVisible();
  await expect(page.locator("#ks-label")).toHaveText("noch zu verteilen");
  await expect(page.locator("#ks-wert")).toHaveText("415 km");
});

test("Die Kette rechnet jede Fahrt aus und geht am Ende auf", async ({ page }) => {
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));

  await mitNachtrag(page, KETTE);
  const zeilen = page.locator("#nt-liste .ntzeile");
  await expect(zeilen).toHaveCount(3);

  // Fahrt 1: 27716 + 230 = 27946
  await expect(zeilen.nth(0)).toContainText("27946");
  await expect(zeilen.nth(0)).toContainText("27716");
  await expect(zeilen.nth(0)).toContainText("230");
  // Fahrt 2 war über den notierten Stand angegeben: 28093 − 27946 = 147
  await expect(zeilen.nth(1)).toContainText("147");
  await expect(zeilen.nth(1)).toContainText("Stand notiert");
  // Fahrt 3 endet genau auf dem aktuellen Stand
  await expect(zeilen.nth(2)).toContainText("28361");

  await expect(page.locator("#nt-status")).toHaveClass(/ok/);
  await expect(page.locator("#nt-status")).toContainText("geht auf");
  await expect(page.locator("#nt-bilanz")).toContainText("645");
  expect(errors).toEqual([]);
});

test("Ein offener Rest wird beziffert und nicht heimlich verteilt", async ({ page }) => {
  await mitNachtrag(page, { ...KETTE, fahrten: KETTE.fahrten.slice(0, 2) });

  await expect(page.locator("#nt-status")).toHaveClass(/offen/);
  // Der offene Rest steht hervorgehoben im eigenen Kasten
  await expect(page.locator("#nt-rest-box")).toHaveClass(/offen/);
  await expect(page.locator("#rb-wert")).toHaveText("268 km");
  await expect(page.locator("#rb-sub")).toContainText("377 von 645");
  await expect(page.locator("#nt-rest")).toBeVisible();

  // Die vorhandenen Fahrten bleiben unangetastet …
  await expect(page.locator("#nt-liste .ntzeile").nth(0)).toContainText("230");
  // … erst der ausdrückliche Knopf legt eine neue Zeile mit dem Rest an
  await page.click("#nt-rest");
  await expect(page.locator("#modal-ntfahrt")).toHaveClass(/open/);
  await expect(page.locator("#nt-e-km")).toHaveValue("268");
  await page.fill("#nt-e-datum", "2026-07-16");
  await page.click("#nt-e-save");

  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(3);
  await expect(page.locator("#nt-status")).toHaveClass(/ok/);
  await expect(page.locator("#nt-rest-box")).toHaveClass(/ok/);
  await expect(page.locator("#rb-label")).toHaveText("Nichts mehr offen");
  await expect(page.locator("#nt-rest")).toBeHidden();
});

test("Zu viele Kilometer werden als Fehler gemeldet", async ({ page }) => {
  await mitNachtrag(page, {
    ...KETTE,
    fahrten: [{ datum: "2026-07-14", strecke: "", art: "km", km: 900, stand: null }]
  });
  await expect(page.locator("#nt-status")).toHaveClass(/schlecht/);
  await expect(page.locator("#nt-status")).toContainText("mehr");
  await expect(page.locator("#rb-label")).toHaveText("Zu viel verteilt");
  await expect(page.locator("#rb-wert")).toHaveText("255 km");
});

test("Ein Zwischenstand vor dem Beginn der Fahrt ist ein Fehler", async ({ page }) => {
  await mitNachtrag(page, {
    ...KETTE,
    fahrten: [
      { datum: "2026-07-14", strecke: "", art: "km", km: 230, stand: null },
      { datum: "2026-07-15", strecke: "", art: "stand", km: null, stand: 27800 }
    ]
  });
  await expect(page.locator("#nt-liste .ntzeile").nth(1)).toContainText("liegt vor dem Stand");
  await expect(page.locator("#nt-status")).toHaveClass(/schlecht/);
  // Ohne saubere Kette gibt es auch nichts auszugeben
  await expect(page.locator("#nt-ausgabe")).toBeHidden();
});

test("Vertauschte Stände im Rahmen werden erkannt", async ({ page }) => {
  await mitNachtrag(page, { start: "28361", aktuell: "27716", modus: "km", fahrten: [] });
  await expect(page.locator("#nt-status")).toHaveClass(/schlecht/);
  await expect(page.locator("#nt-status")).toContainText("vertauscht");
});

test("Eine fertige Zeile lässt sich im Kästchengitter ansehen und kopieren", async ({ page }) => {
  await mitNachtrag(page, KETTE);
  await page.click("#nt-liste .ntzeile >> nth=0");
  await expect(page.locator("#modal-zeile")).toHaveClass(/open/);

  const raster = id => page.$$eval("#" + id + " span",
    els => els.map(e => e.textContent === "" ? "_" : e.textContent).join(""));
  expect(await raster("z-box-rueck")).toBe("_27946");
  expect(await raster("z-box-ab")).toBe("_27716");
  await expect(page.locator("#z-nachweis")).toHaveText("230");
  await expect(page.locator("#z-rechnung")).toContainText("230 km");
});

test("Die freie Version der App deckelt den Nachtrag bei fünf Fahrten", async ({ page }) => {
  const fuenf = Array.from({ length: 5 }, (_, i) => (
    { datum: "2026-07-1" + i, strecke: "", art: "km", km: 10, stand: null }
  ));
  await mitNachtrag(page, { start: "1000", aktuell: "2000", modus: "km", fahrten: fuenf }, { app: true });
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(5);

  await page.click("#nt-add");
  await expect(page.locator("#modal-premium")).toHaveClass(/open/);
  await expect(page.locator("#modal-ntfahrt")).not.toHaveClass(/open/);
  await expect(page.locator("#nt-limit-info")).toContainText("bis zu 5");
});

test("Im Browser ist die App die Vollversion: keine Werbung, keine Grenze", async ({ page }) => {
  const fuenf = Array.from({ length: 5 }, (_, i) => (
    { datum: "2026-07-1" + i, strecke: "", art: "km", km: 10, stand: null }
  ));
  await mitNachtrag(page, { start: "1000", aktuell: "2000", modus: "km", fahrten: fuenf });

  await expect(page.locator("#adbar")).toBeHidden();          // keine Werbeleiste
  await expect(page.locator("#nt-limit-info")).toBeEmpty();   // kein Editions-Hinweis
  await expect(page.locator("#nt-blatt-star")).toBeHidden();  // keine Premium-Sterne

  // Die sechste Fahrt geht ohne Premium-Fenster
  await page.click("#nt-add");
  await expect(page.locator("#modal-ntfahrt")).toHaveClass(/open/);
  await expect(page.locator("#modal-premium")).not.toHaveClass(/open/);

  // In den Einstellungen taucht der Premium-Bereich gar nicht auf
  await page.click('#modal-ntfahrt [data-close="modal-ntfahrt"] >> nth=0');
  await page.click("#btn-settings");
  await expect(page.locator("#acc-premium")).toBeHidden();
});

test("Mit Premium geht der Nachtrag über fünf Fahrten hinaus", async ({ page }) => {
  const fuenf = Array.from({ length: 5 }, (_, i) => (
    { datum: "2026-07-1" + i, strecke: "", art: "km", km: 10, stand: null }
  ));
  await mitNachtrag(page, { start: "1000", aktuell: "2000", modus: "km", fahrten: fuenf }, { premium: true });
  await page.click("#nt-add");
  await expect(page.locator("#modal-ntfahrt")).toHaveClass(/open/);
  await page.fill("#nt-e-km", "40");
  await page.click("#nt-e-save");
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(6);
});

test("Der Nachtrag übersteht einen Neustart der App", async ({ page }) => {
  await mitNachtrag(page, KETTE);
  await page.reload();
  await page.click("#go-nachtragen");
  await expect(page.locator("#nt-start")).toHaveValue("27716");
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(3);
  await expect(page.locator("#nt-status")).toHaveClass(/ok/);
});

test("Die Ausgabe des Nachtrags enthält die Kette", async ({ page }) => {
  await page.addInitScript(nt => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_edition", JSON.stringify("premium"));
    localStorage.removeItem("fa_nachtraege");   // erzwingt die Übernahme des Altbestands
    localStorage.setItem("fa_nachtrag", JSON.stringify(nt));
  }, KETTE);
  await page.goto("/");
  await page.click("#go-nachtragen");
  await page.click("#nt-export");
  await expect(page.locator("#modal-export")).toHaveClass(/open/);

  const pdf = await page.evaluate(() => buildListPdfBlob().text());
  expect(pdf).toContain("Nachgetragene Fahrten");
  expect(pdf).toContain("27946");
});

test("Löschen und Verwerfen funktionieren ohne Browser-Bestätigungsdialog", async ({ page }) => {
  // confirm() wird in mancher Umgebung stumm verworfen – die App darf sich
  // deshalb nicht darauf verlassen. Bestätigt wird per zweitem Tipp.
  await mitNachtrag(page, KETTE);

  // Fahrt löschen: Zeile öffnen -> bearbeiten -> zweimal tippen
  await page.click("#nt-liste .ntzeile >> nth=0");
  await page.click("#z-edit");
  await page.click("#nt-e-del");
  await expect(page.locator("#nt-e-del")).toContainText("Wirklich");
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(3);   // noch nichts passiert
  await page.click("#nt-e-del");
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(2);

  // Nachtrag verwerfen: ebenfalls zweistufig
  await page.click("#nt-clear");
  await expect(page.locator("#nt-clear")).toContainText("Wirklich");
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(2);   // noch nichts passiert
  await page.click("#nt-clear");
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(0);
  await expect(page.locator("#nt-start")).toHaveValue("");
});

test("Ein einzelner Tipp auf Löschen richtet nichts an", async ({ page }) => {
  await mitNachtrag(page, KETTE);
  await page.click("#nt-liste .ntzeile >> nth=0");
  await page.click("#z-edit");
  await page.click("#nt-e-del");                       // nur einmal
  await page.click('[data-close="modal-ntfahrt"]');
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(3);
  // Beim nächsten Öffnen ist der Knopf wieder entschärft
  await page.click("#nt-liste .ntzeile >> nth=0");
  await page.click("#z-edit");
  await expect(page.locator("#nt-e-del")).toHaveText("Diese Fahrt löschen");
});

/* ---------- Blätter: eines je Fahrzeug, frei genau eines ---------- */

test("Ein Altbestand wird als erstes Blatt übernommen", async ({ page }) => {
  await mitNachtrag(page, KETTE);
  await expect(page.locator("#nt-blatt option")).toHaveCount(1);
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(3);
  const gespeichert = await page.evaluate(() => ({
    neu: JSON.parse(localStorage.getItem("fa_nachtraege")),
    alt: localStorage.getItem("fa_nachtrag")
  }));
  expect(gespeichert.neu.blaetter.length).toBe(1);
  expect(gespeichert.neu.blaetter[0].fahrten.length).toBe(3);
  expect(gespeichert.alt).toBeNull();               // alter Schlüssel ist entfernt
});

test("Ohne Premium bleibt es in der App bei einem Blatt", async ({ page }) => {
  await mitNachtrag(page, KETTE, { app: true });
  await page.click("#nt-blatt-neu");
  await expect(page.locator("#modal-premium")).toHaveClass(/open/);
  await expect(page.locator("#nt-blatt option")).toHaveCount(1);
});

test("Mit Premium: zweites Blatt anlegen, benennen, wechseln – Daten bleiben getrennt", async ({ page }) => {
  await mitNachtrag(page, KETTE, { premium: true });
  await page.click("#nt-blatt-neu");
  await expect(page.locator("#nt-blatt option")).toHaveCount(2);
  // Das neue Blatt ist leer und aktiv
  await expect(page.locator("#nt-start")).toHaveValue("");
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(0);

  await page.fill("#nt-blatt-name", "LKW Y-123");
  await expect(page.locator("#nt-blatt option >> nth=1")).toHaveText("LKW Y-123");
  await page.fill("#nt-start", "500");
  await page.fill("#nt-aktuell", "800");

  // Zurück zum ersten Blatt: die alte Kette ist unverändert da
  await page.selectOption("#nt-blatt", "0");
  await expect(page.locator("#nt-start")).toHaveValue("27716");
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(3);

  // Und wieder zum zweiten: auch dessen Stand ist noch da
  await page.selectOption("#nt-blatt", "1");
  await expect(page.locator("#nt-start")).toHaveValue("500");
  await expect(page.locator("#nt-aktuell")).toHaveValue("800");

  // Dauerhaft gespeichert (der Test-Helfer setzt beim reload den Altbestand
  // zurück, deshalb wird hier der Speicher selbst geprüft)
  const d = await page.evaluate(() => JSON.parse(localStorage.getItem("fa_nachtraege")));
  expect(d.blaetter.length).toBe(2);
  expect(d.blaetter[1].name).toBe("LKW Y-123");
  expect(d.blaetter[1].start).toBe("500");
  expect(d.blaetter[0].fahrten.length).toBe(3);
});

test("Bei mehreren Blättern löscht der rote Knopf nur das aktive", async ({ page }) => {
  await mitNachtrag(page, KETTE, { premium: true });
  await page.click("#nt-blatt-neu");
  await page.fill("#nt-start", "500");
  await expect(page.locator("#nt-clear")).toHaveText("Dieses Blatt löschen");
  await page.click("#nt-clear");
  await expect(page.locator("#nt-clear")).toContainText("Noch einmal tippen");
  await page.click("#nt-clear");
  // Das zweite Blatt ist weg, das erste samt Kette wieder aktiv
  await expect(page.locator("#nt-blatt option")).toHaveCount(1);
  await expect(page.locator("#nt-start")).toHaveValue("27716");
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(3);
  await expect(page.locator("#nt-clear")).toHaveText("Nachtrag verwerfen");
});
