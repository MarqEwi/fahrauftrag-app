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
  await expect(page.locator("#btn-kopieren")).toBeDisabled();

  // Beispielfahrt: 27768 − 27716 = 52
  await page.fill("#in-ab", "27716");
  await page.fill("#in-rueck", "27768");
  await expect(page.locator("#nachweis-wert")).toHaveText("52");
  // Oben die Rückkehr, unten die Abfahrt – rechtsbündig, vorne leer
  expect(await raster(page, "box-rueck")).toBe("_27768");
  expect(await raster(page, "box-ab")).toBe("_27716");
  await expect(page.locator("#merksatz")).toContainText("52 km");
  await expect(page.locator("#fehler")).toBeHidden();
  await expect(page.locator("#btn-kopieren")).toBeEnabled();

  // Vertauschte Zeilen: klare Fehlermeldung statt negativer Strecke
  await page.fill("#in-ab", "27768");
  await page.fill("#in-rueck", "27716");
  await expect(page.locator("#fehler")).toBeVisible();
  await expect(page.locator("#fehler")).toContainText("vertauscht");
  await expect(page.locator("#nachweis-wert")).toHaveText("–");
  await expect(page.locator("#btn-kopieren")).toBeDisabled();

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

test("Der Kopiertext nennt beide Zeilen und die gefahrenen Kilometer", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("fa_onboarding_done", "true"));
  await page.goto("/");
  await page.fill("#in-ab", "27716");
  await page.fill("#in-rueck", "27768");
  await page.fill("#in-strecke", "Musterstadt – Beispielheim");
  const t = await page.evaluate(() => kopierText());
  expect(t).toBe("a) Rückkehr: 027768 | b) Abfahrt: 027716 | gefahrene km: 52 | Musterstadt – Beispielheim");
});

test("Die Einführung erscheint nur beim ersten Start", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#modal-onboarding")).toHaveClass(/open/);
  await page.click("#ob-skip");
  await page.reload();
  await expect(page.locator("#modal-onboarding")).not.toHaveClass(/open/);
});
