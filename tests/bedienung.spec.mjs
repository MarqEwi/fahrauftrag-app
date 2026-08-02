// Bedienung: Info-Dialog, Rubriken-Navigation und Verhalten der Zurück-Taste.
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

test("Zurück schließt Fenster, geht zur Startseite und warnt vor dem Verlassen", async ({ page }) => {
  await appUmgebung(page);
  await page.goto("/");
  expect(await page.evaluate(() => window.__back.events)).toContain("backButton");

  // Unterseite öffnen und darin ein Fenster
  await page.click('#rubriken button[data-view="nachtragen"]');
  await page.click("#btn-settings");
  await expect(page.locator("#modal-settings")).toHaveClass(/open/);

  // 1× zurück: Fenster zu, Seite bleibt
  await zurueck(page);
  await expect(page.locator("#modal-settings")).not.toHaveClass(/open/);
  await expect(page.locator("#view-nachtragen")).toHaveClass(/active/);

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
  await page.click('#rubriken button[data-view="nachtragen"]');
  await page.click("#nt-add");                      // Editor einer nachzutragenden Fahrt
  await expect(page.locator("#modal-ntfahrt")).toHaveClass(/open/);
  await zurueck(page);
  await expect(page.locator("#modal-ntfahrt")).not.toHaveClass(/open/);
  await expect(page.locator("#view-nachtragen")).toHaveClass(/active/);
});

test("Zurück beendet die Einführung, statt sie beim Neustart erneut zu zeigen", async ({ page }) => {
  await appUmgebung(page, { onboardingFertig: false });
  await page.goto("/");
  await expect(page.locator("#modal-onboarding")).toHaveClass(/open/);
  await zurueck(page);
  await expect(page.locator("#modal-onboarding")).not.toHaveClass(/open/);
  expect(await page.evaluate(() => localStorage.getItem("fa_onboarding_done"))).toBe("true");
});
