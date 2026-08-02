// Bedienung: Info-Dialog, Fahrtenliste und Verhalten der Zurück-Taste.
import { test, expect } from "@playwright/test";

/* Simuliert die Android-App mit dem App-Plugin, damit sich die Zurück-Taste
   auslösen lässt und exitApp beobachtbar ist. */
async function appUmgebung(page, { onboardingFertig = true } = {}){
  await page.addInitScript(fertig => {
    if (fertig) localStorage.setItem("fa_onboarding_done", "true");
    window.__back = { exits: 0, events: [] };
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        App: {
          addListener: (ev, cb) => {
            window.__back.events.push(ev);
            if (ev === "backButton") window.__backCb = cb;
            return { remove(){} };
          },
          exitApp: () => { window.__back.exits++; }
        }
      }
    };
  }, onboardingFertig);
}
const zurueck = page => page.evaluate(() => window.__backCb && window.__backCb());

test("Der Info-Dialog erklärt beide Zeilen und die Nachweis-Spalte", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("fa_onboarding_done", "true"));
  await page.goto("/");
  await page.click("#info-feld");
  await expect(page.locator("#modal-info")).toHaveClass(/open/);
  const txt = page.locator("#info-content");
  await expect(txt).toContainText("Rückkehr");
  await expect(txt).toContainText("Abfahrt");
  await expect(txt).toContainText("rechtsbündig");
  await expect(txt).toContainText("Betriebsstunden");
  await page.click('[data-close="modal-info"]');
  await expect(page.locator("#modal-info")).not.toHaveClass(/open/);
});

test("Fahrt merken, bearbeiten und löschen", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("fa_onboarding_done", "true"));
  await page.goto("/");

  await page.fill("#in-ab", "27716");
  await page.fill("#in-rueck", "27768");
  await page.fill("#in-strecke", "Musterstadt – Beispielheim");
  await page.click("#btn-speichern");

  await page.click("#go-fahrten");
  await expect(page.locator("#f-liste .fahrt")).toHaveCount(1);
  await expect(page.locator("#f-liste .fahrt").first()).toContainText("Musterstadt");
  await expect(page.locator("#f-liste .fahrt").first()).toContainText("52");

  // Bearbeiten: Rückkehr-Stand ändern, Nachweis muss folgen
  await page.click("#f-liste [data-edit]");
  await expect(page.locator("#modal-editor")).toHaveClass(/open/);
  await page.fill("#e-rueck", "27800");
  await expect(page.locator("#e-vorschau")).toContainText("84");
  await page.click("#e-save");
  await expect(page.locator("#f-liste .fahrt").first()).toContainText("84");

  // Löschen
  page.once("dialog", d => d.accept());
  await page.click("#f-liste [data-del]");
  await expect(page.locator("#f-liste .fahrt")).toHaveCount(0);
  await expect(page.locator("#f-empty")).toBeVisible();
});

test("Der Stand der letzten Fahrt lässt sich als neue Abfahrt übernehmen", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_fahrten", JSON.stringify([
      { datum: "2026-07-14", name: "", strecke: "", ab: 27716, rueck: 27768, modus: "km" }
    ]));
  });
  await page.goto("/");
  await page.click("#btn-uebernehmen");
  await expect(page.locator("#in-ab")).toHaveValue("27768");
  await expect(page.locator("#in-rueck")).toHaveValue("");
});

test("Die freie Version begrenzt die Liste und bietet Premium an", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_fahrten", JSON.stringify([
      { datum: "2026-07-01", name: "", strecke: "", ab: 100, rueck: 150, modus: "km" },
      { datum: "2026-07-02", name: "", strecke: "", ab: 150, rueck: 200, modus: "km" },
      { datum: "2026-07-03", name: "", strecke: "", ab: 200, rueck: 250, modus: "km" }
    ]));
  });
  await page.goto("/");
  await page.fill("#in-ab", "250");
  await page.fill("#in-rueck", "300");
  await page.click("#btn-speichern");
  // Statt einer vierten Fahrt erscheint das Premium-Fenster
  await expect(page.locator("#modal-premium")).toHaveClass(/open/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("fa_fahrten")).length)).toBe(3);
});

test("Zurück schließt Fenster, geht zur Startseite und warnt vor dem Verlassen", async ({ page }) => {
  await appUmgebung(page);
  await page.goto("/");
  expect(await page.evaluate(() => window.__back.events)).toContain("backButton");

  // Unterseite öffnen und darin ein Fenster
  await page.click("#go-fahrten");
  await page.click("#btn-settings");
  await expect(page.locator("#modal-settings")).toHaveClass(/open/);

  // 1× zurück: Fenster zu, Seite bleibt
  await zurueck(page);
  await expect(page.locator("#modal-settings")).not.toHaveClass(/open/);
  await expect(page.locator("#view-fahrten")).toHaveClass(/active/);

  // 2× zurück: zurück zur Startseite
  await zurueck(page);
  await expect(page.locator("#view-home")).toHaveClass(/active/);

  // 3× zurück: Hinweis statt Beenden
  await zurueck(page);
  await expect(page.locator("#toast")).toBeVisible();
  await expect(page.locator("#toast")).toContainText("erneut");
  expect(await page.evaluate(() => window.__back.exits)).toBe(0);

  // 4× zurück (innerhalb der Frist): App wird beendet
  await zurueck(page);
  expect(await page.evaluate(() => window.__back.exits)).toBe(1);
});

test("Zurück schließt zuerst das zuletzt geöffnete Fenster", async ({ page }) => {
  await appUmgebung(page);
  await page.goto("/");
  await page.click("#go-fahrten");
  await page.click("#f-add");                       // Fahrt-Editor
  await expect(page.locator("#modal-editor")).toHaveClass(/open/);
  await zurueck(page);
  await expect(page.locator("#modal-editor")).not.toHaveClass(/open/);
  await expect(page.locator("#view-fahrten")).toHaveClass(/active/);
});

test("Zurück beendet die Einführung, statt sie beim Neustart erneut zu zeigen", async ({ page }) => {
  await appUmgebung(page, { onboardingFertig: false });
  await page.goto("/");
  await expect(page.locator("#modal-onboarding")).toHaveClass(/open/);
  await zurueck(page);
  await expect(page.locator("#modal-onboarding")).not.toHaveClass(/open/);
  expect(await page.evaluate(() => localStorage.getItem("fa_onboarding_done"))).toBe("true");
});
