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

  await expect(page.locator("#zeitzeile")).toBeVisible();
  // a) Ende steht oben, b) Beginn darunter – wie beim Kilometerraster
  await expect(page.locator("#z-ende")).toHaveText("13:45");
  await expect(page.locator("#z-beginn")).toHaveText("11:30");
  await expect(page.locator("#z-dauer")).toHaveText("2:15");
  await expect(page.locator("#lenkzeit")).toBeHidden();

  // Beide Werte stehen bündig untereinander
  const versatz = await page.evaluate(() => {
    const a = document.getElementById("z-ende").getBoundingClientRect();
    const b = document.getElementById("z-beginn").getBoundingClientRect();
    return { links: Math.abs(a.left - b.left), rechts: Math.abs(a.right - b.right) };
  });
  expect(versatz.links).toBe(0);
  expect(versatz.rechts).toBe(0);
});

test("Eine Fahrt über Mitternacht ergibt keine negative Zeit", async ({ page }) => {
  await start(page, { zeiten: true });
  // Beispiel aus einem echten Blatt: Beginn 23:50, Ende 03:00
  await page.fill("#in-zeit-ab", "23:50");
  await page.fill("#in-zeit-rueck", "03:00");
  await expect(page.locator("#z-dauer")).toHaveText("3:10");
  // Die Annahme wird ausgewiesen, damit ein Zahlendreher nicht durchrutscht
  await expect(page.locator("#z-mitternacht")).toBeVisible();
  await expect(page.locator("#z-mitternacht")).toContainText("über Mitternacht");
});

test("Ab mehr als 4:30 Stunden erscheint der Hinweis auf die Lenkzeiten", async ({ page }) => {
  await start(page, { zeiten: true });

  // Genau 4:30 ist noch kein Hinweis
  await page.fill("#in-zeit-ab", "08:00");
  await page.fill("#in-zeit-rueck", "12:30");
  await expect(page.locator("#z-dauer")).toHaveText("4:30");
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
