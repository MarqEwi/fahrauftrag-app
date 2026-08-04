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

/* ---------- Darstellen wie im Originalfahrauftrag ---------- */

async function startOriginal(page){
  await page.addInitScript(() => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_zeiten", JSON.stringify(true));
    localStorage.setItem("fa_zeit_original", JSON.stringify(true));
  });
  await page.goto("/");
}

test("Die Original-Option ist ohne Uhrzeiten sichtbar, aber ausgegraut und gesperrt", async ({ page }) => {
  await start(page);
  await zumSchalter(page);

  // Sichtbar von Anfang an – man soll wissen, dass es sie gibt …
  const block = page.locator("#zeitoriginal-block");
  await expect(block).toBeVisible();
  await expect(block).toContainText("Darstellen wie im Originalfahrauftrag");
  // … aber ausgegraut und nicht bedienbar, solange die Uhrzeiten aus sind
  await expect(block).toHaveClass(/gesperrt/);
  await expect(page.locator('#s-zeitoriginal button[data-v="ein"]')).toBeDisabled();

  // Uhrzeiten einschalten gibt die Option frei
  await page.click('#s-zeiten button[data-v="ein"]');
  await expect(block).not.toHaveClass(/gesperrt/);
  await expect(page.locator('#s-zeitoriginal button[data-v="ein"]')).toBeEnabled();
  await page.click('#s-zeitoriginal button[data-v="ein"]');
  expect(await page.evaluate(() => localStorage.getItem("fa_zeit_original"))).toBe("true");

  await page.reload();
  await zumSchalter(page);
  await expect(page.locator('#s-zeitoriginal button[data-v="ein"]')).toHaveClass(/active/);

  // Uhrzeiten wieder aus: die Option sperrt sich, und die Darstellung
  // fällt auf den Normalzustand zurück, ohne die Wahl zu vergessen
  await page.click('#s-zeiten button[data-v="aus"]');
  await expect(block).toHaveClass(/gesperrt/);
  await expect(page.locator("#z-spalte")).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("fa_zeit_original"))).toBe("true");
});

test("Originaldarstellung: Uhrzeit als Spalte im Gitter, Fahrzeit als Textzeile", async ({ page }) => {
  await startOriginal(page);
  await page.fill("#in-ab", "27716");
  await page.fill("#in-rueck", "27768");
  await page.fill("#in-zeit-ab", "16:00");
  await page.fill("#in-zeit-rueck", "16:45");

  // Der bisherige Uhrzeiten-Block verschwindet, die Spalte übernimmt
  await expect(page.locator("#zeitzeile")).toBeHidden();
  await expect(page.locator("#z-spalte")).toBeVisible();
  await expect(page.locator("#sk-z")).toContainText("Uhrzeit");
  await expect(page.locator("#zs-ende")).toHaveText("16:45");      // a) Ende oben
  await expect(page.locator("#zs-beginn")).toHaveText("16:00");    // b) Beginn unten

  // Die Fahrzeit steht als normale Textzeile darunter – ohne eigenes Kästchen
  await expect(page.locator("#zeit-summe")).toBeVisible();
  await expect(page.locator("#zeit-summe")).toContainText("0:45");
  const inKasten = await page.evaluate(() =>
    !!document.getElementById("zeit-summe").closest(".nachweis, .gitterblock"));
  expect(inKasten).toBeFalsy();

  // Die Spalte steht zwischen den Kästchen und dem Nachweis
  const lage = await page.evaluate(() => {
    const g = document.querySelector("#view-home .gitter").getBoundingClientRect();
    const z = document.getElementById("z-spalte").getBoundingClientRect();
    const n = document.querySelector("#view-home .gitterblock .nachweis").getBoundingClientRect();
    return g.right <= z.left && z.right <= n.left;
  });
  expect(lage).toBeTruthy();
});

test("Originaldarstellung: eine einzelne Uhrzeit steht schon in der Spalte", async ({ page }) => {
  await startOriginal(page);
  await page.fill("#in-zeit-ab", "08:00");                          // nur der Beginn
  await expect(page.locator("#zs-beginn")).toHaveText("08:00");
  await expect(page.locator("#zs-ende")).toHaveText("");
  await expect(page.locator("#zeit-summe")).toBeHidden();           // ohne Ende keine Fahrzeit
});

test("Originaldarstellung gilt auch für die Liste im Nachtrag", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_zeiten", JSON.stringify(true));
    localStorage.setItem("fa_zeit_original", JSON.stringify(true));
    localStorage.removeItem("fa_nachtraege");
    localStorage.setItem("fa_nachtrag", JSON.stringify({ start: "27716", aktuell: "27768", modus: "km",
      fahrten: [{ datum: "2026-07-14", strecke: "", art: "km", km: 52, stand: null, zab: "16:00", zende: "16:45" }] }));
  });
  await page.goto("/");
  await page.click("#go-nachtragen");

  const zeile = page.locator("#nt-liste .ntzeile").first();
  await expect(zeile.locator(".zspalte span").nth(0)).toHaveText("16:45");
  await expect(zeile.locator(".zspalte span").nth(1)).toHaveText("16:00");
  await expect(zeile.locator(".zeitsumme")).toContainText("0:45");
  await expect(page.locator("#nt-liste .zeitklein")).toHaveCount(0);   // kein gestapelter Block mehr
});

test("Wird die Option ausgeschaltet, kehrt die bisherige Darstellung zurück", async ({ page }) => {
  await startOriginal(page);
  await page.fill("#in-zeit-ab", "11:30");
  await page.fill("#in-zeit-rueck", "13:45");
  await expect(page.locator("#z-spalte")).toBeVisible();

  await zumSchalter(page);
  await page.click('#s-zeitoriginal button[data-v="aus"]');
  await page.click('#modal-settings [data-close="modal-settings"]');
  await expect(page.locator("#z-spalte")).toBeHidden();
  await expect(page.locator("#zeitzeile")).toBeVisible();
  await expect(page.locator("#z-dauer")).toHaveText("2:15");
});
