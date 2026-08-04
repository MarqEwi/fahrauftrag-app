// Smoke-Test: App lädt fehlerfrei, die Ausfüllhilfe rechnet und zeigt das
// Kästchenraster richtig an, und im localStorage stehen nur eigene Schlüssel.
import { test, expect } from "@playwright/test";

/* Die Ziffern eines Kästchen-Rasters als String, leere Kästchen als "_". */
const raster = (page, id) => page.$$eval("#" + id + " span",
  els => els.map(e => e.textContent === "" ? "_" : e.textContent).join(""));

test("App lädt ohne Konsolenfehler und rechnet die gefahrenen Kilometer", async ({ page }) => {
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));

  await page.goto("/");
  await expect(page).toHaveTitle(/Fahrauftrag Ausfüllhilfe/);
  await page.click("#ob-skip");

  // Leerer Zustand: sechs leere Kästchen je Zeile, kein Ergebnis
  expect(await raster(page, "box-rueck")).toBe("______");
  expect(await raster(page, "box-ab")).toBe("______");
  await expect(page.locator("#nachweis-wert")).toHaveText("–");

  // Beispielfahrt: 27768 − 27716 = 52
  await page.fill("#in-ab", "27716");
  await page.fill("#in-rueck", "27768");
  await expect(page.locator("#nachweis-wert")).toHaveText("52");
  // Oben die Rückkehr, unten die Abfahrt – rechtsbündig, vorne leer
  expect(await raster(page, "box-rueck")).toBe("_27768");
  expect(await raster(page, "box-ab")).toBe("_27716");
  await expect(page.locator("#merksatz")).toContainText("52 km");
  await expect(page.locator("#fehler")).toBeHidden();

  // Vertauschte Zeilen: klare Fehlermeldung statt negativer Strecke
  await page.fill("#in-ab", "27768");
  await page.fill("#in-rueck", "27716");
  await expect(page.locator("#fehler")).toBeVisible();
  await expect(page.locator("#fehler")).toContainText("vertauscht");
  await expect(page.locator("#nachweis-wert")).toHaveText("–");

  // Betriebsstunden: gleiche Rechnung, andere Einheit
  await page.fill("#in-ab", "1240");
  await page.fill("#in-rueck", "1246");
  await expect(page.locator("#nachweis-einheit")).toHaveText("km");
  await page.click('#s-modus button[data-v="std"]');
  await expect(page.locator("#nachweis-einheit")).toHaveText("h");
  await expect(page.locator("#nachweis-wert")).toHaveText("6");
  await expect(page.locator("#lbl-ab")).toContainText("Betriebsstunden");
  await page.click('#s-modus button[data-v="km"]');

  // Im localStorage stehen nur eigene Schlüssel
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.every(k => k.startsWith("fa_"))).toBeTruthy();
  expect(keys.some(k => k.startsWith("sgt_") || k.startsWith("pft_") || k.startsWith("bft_"))).toBeFalsy();

  expect(errors).toEqual([]);
});

test("Die Einführung erscheint nur beim ersten Start", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#modal-onboarding")).toHaveClass(/open/);
  await page.click("#ob-skip");
  await page.reload();
  await expect(page.locator("#modal-onboarding")).not.toHaveClass(/open/);
});

test("Die Einführung führt bis zum letzten Schritt und nennt die Uhrzeiten", async ({ page }) => {
  await page.goto("/");
  const schritte = await page.locator(".ob-step").count();
  const punkte = page.locator("#ob-dots i");
  await expect(punkte).toHaveCount(schritte);       // je Schritt ein Punkt

  for (let i = 0; i < schritte - 1; i++){
    await expect(page.locator(`.ob-step.active[data-step="${i}"]`)).toBeVisible();
    await expect(punkte.nth(i)).toHaveClass(/on/);
    await expect(page.locator("#ob-next")).toHaveText("Weiter");
    await page.click("#ob-next");
  }

  // Der Uhrzeit-Schritt sagt, wo man die Felder findet
  const uhr = page.locator(".ob-step", { hasText: "Uhrzeiten" });
  await expect(uhr).toContainText("Einstellungen");

  // Letzter Schritt: der Knopf beendet die Einführung, statt weiterzublättern
  await expect(page.locator("#ob-next")).toHaveText("Los geht's!");
  await page.click("#ob-next");
  await expect(page.locator("#modal-onboarding")).not.toHaveClass(/open/);
  expect(await page.evaluate(() => localStorage.getItem("fa_onboarding_done"))).toBe("true");
});
