// Uhrzeiten: standardmäßig aus, in den Einstellungen zuschaltbar.
// Geprüft werden die Fahrzeit-Rechnung (auch über Mitternacht), der Hinweis
// auf die Lenk- und Ruhezeiten ab 4:30 Stunden und dass ohne die Einstellung
// nichts von alldem auftaucht.
import { test, expect } from "@playwright/test";

async function start(page, { zeiten = null } = {}){
  await page.addInitScript(z => {
    localStorage.setItem("fa_onboarding_done", "true");
    if (z !== null) localStorage.setItem("fa_zeiten", JSON.stringify(z));
  }, zeiten);
  await page.goto("/");
}

/* Einstellungen öffnen und den Abschnitt "Uhrzeiten" aufklappen. */
async function zumSchalter(page){
  await page.click("#btn-settings");
  await page.click('#modal-settings summary:has-text("Uhrzeiten")');
  await expect(page.locator("#s-zeiten")).toBeVisible();
}

test("Standardmäßig sind die Uhrzeiten aus", async ({ page }) => {
  await start(page);
  await expect(page.locator("#zeit-felder")).toBeHidden();
  await expect(page.locator("#in-zeit-ab")).toBeHidden();
  // Auch der Schalter steht auf Aus
  await zumSchalter(page);
  await expect(page.locator('#s-zeiten button[data-v="aus"]')).toHaveClass(/active/);
});

test("Der Schalter blendet die Felder ein und merkt sich das", async ({ page }) => {
  await start(page);
  await zumSchalter(page);
  await page.click('#s-zeiten button[data-v="ein"]');
  await expect(page.locator("#zeit-felder")).toBeVisible();

  await page.reload();
  await expect(page.locator("#zeit-felder")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("fa_zeiten"))).toBe("true");
});

test("Die Fahrzeit wird ausgerechnet und in der Reihenfolge des Blattes gezeigt", async ({ page }) => {
  await start(page, { zeiten: true });
  await page.fill("#in-zeit-ab", "11:30");
  await page.fill("#in-zeit-rueck", "13:45");

  const zz = page.locator("#zeitzeile");
  await expect(zz).toBeVisible();
  await expect(zz).toContainText("13:45");     // a) Ende steht vorn, wie oben im Feld
  await expect(zz).toContainText("11:30");
  await expect(zz).toContainText("2:15 h");
  await expect(page.locator("#lenkzeit")).toBeHidden();
});

test("Eine Fahrt über Mitternacht ergibt keine negative Zeit", async ({ page }) => {
  await start(page, { zeiten: true });
  // Beispiel aus einem echten Blatt: Beginn 23:50, Ende 03:00
  await page.fill("#in-zeit-ab", "23:50");
  await page.fill("#in-zeit-rueck", "03:00");
  await expect(page.locator("#zeitzeile")).toContainText("3:10 h");
  // Die Annahme wird ausgewiesen, damit ein Zahlendreher nicht durchrutscht
  await expect(page.locator("#zeitzeile")).toContainText("über Mitternacht");
});

test("Ab mehr als 4:30 Stunden erscheint der Hinweis auf die Lenkzeiten", async ({ page }) => {
  await start(page, { zeiten: true });

  // Genau 4:30 ist noch kein Hinweis
  await page.fill("#in-zeit-ab", "08:00");
  await page.fill("#in-zeit-rueck", "12:30");
  await expect(page.locator("#zeitzeile")).toContainText("4:30 h");
  await expect(page.locator("#lenkzeit")).toBeHidden();

  // Eine Minute darüber schon
  await page.fill("#in-zeit-rueck", "12:31");
  await expect(page.locator("#lenkzeit")).toBeVisible();
  await expect(page.locator("#lenkzeit")).toContainText("Lenk- und Ruhezeiten");
});

test("Die Rechnung selbst kennt die Grenzfälle", async ({ page }) => {
  await start(page, { zeiten: true });
  const r = await page.evaluate(() => ({
    normal:  FA.dauer("08:00", "12:30"),
    nacht:   FA.dauer("23:50", "03:00"),
    gleich:  FA.dauer("09:00", "09:00"),
    leer:    FA.dauer("", "12:30"),
    quatsch: FA.dauer("25:00", "12:30"),
    grenze:  FA.dauer("08:00", "12:30").lang,
    drueber: FA.dauer("08:00", "12:31").lang
  }));
  expect(r.normal.minuten).toBe(270);
  expect(r.nacht.minuten).toBe(190);
  expect(r.nacht.ueberMitternacht).toBeTruthy();
  expect(r.gleich.minuten).toBe(0);
  expect(r.leer).toBeNull();
  expect(r.quatsch).toBeNull();
  expect(r.grenze).toBeFalsy();      // 4:30 ist die Grenze, nicht darüber
  expect(r.drueber).toBeTruthy();
});

test("Leeren räumt auch die Uhrzeiten ab", async ({ page }) => {
  await start(page, { zeiten: true });
  await page.fill("#in-zeit-ab", "08:00");
  await page.fill("#in-zeit-rueck", "12:00");
  await expect(page.locator("#zeitzeile")).toBeVisible();
  await page.click("#btn-leeren");
  await expect(page.locator("#in-zeit-ab")).toHaveValue("");
  await expect(page.locator("#zeitzeile")).toBeHidden();
});
