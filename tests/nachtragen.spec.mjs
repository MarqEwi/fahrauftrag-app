// Nachtragen: die Kette aus mehreren Fahrten muss vom letzten eingetragenen
// Stand exakt bis zum aktuellen Stand des Fahrzeugs reichen. Geprüft werden
// die Kettenrechnung, beide Eingabearten (gefahrene km / notierter Stand),
// der Rest-Knopf und die Grenze der freien Version.
import { test, expect } from "@playwright/test";

/* Legt einen Nachtrag direkt im Speicher an – spart Klicks in den Tests. */
async function mitNachtrag(page, nachtrag, { premium = false } = {}){
  await page.addInitScript(([nt, prem]) => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_nachtrag", JSON.stringify(nt));
    if (prem) localStorage.setItem("fa_edition", JSON.stringify("premium"));
  }, [nachtrag, premium]);
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
  await expect(page.locator("#nt-status")).toContainText("268");
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
  await expect(page.locator("#nt-rest")).toBeHidden();
});

test("Zu viele Kilometer werden als Fehler gemeldet", async ({ page }) => {
  await mitNachtrag(page, {
    ...KETTE,
    fahrten: [{ datum: "2026-07-14", strecke: "", art: "km", km: 900, stand: null }]
  });
  await expect(page.locator("#nt-status")).toHaveClass(/schlecht/);
  await expect(page.locator("#nt-status")).toContainText("mehr");
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

test("Die freie Version deckelt den Nachtrag bei fünf Fahrten", async ({ page }) => {
  const fuenf = Array.from({ length: 5 }, (_, i) => (
    { datum: "2026-07-1" + i, strecke: "", art: "km", km: 10, stand: null }
  ));
  await mitNachtrag(page, { start: "1000", aktuell: "2000", modus: "km", fahrten: fuenf });
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(5);

  await page.click("#nt-add");
  await expect(page.locator("#modal-premium")).toHaveClass(/open/);
  await expect(page.locator("#modal-ntfahrt")).not.toHaveClass(/open/);
  await expect(page.locator("#nt-limit-info")).toContainText("bis zu 5");
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

test("Die Ausgabe des Nachtrags enthält die Kette, nicht die Fahrtenliste", async ({ page }) => {
  await page.addInitScript(nt => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_edition", JSON.stringify("premium"));
    localStorage.setItem("fa_nachtrag", JSON.stringify(nt));
    localStorage.setItem("fa_fahrten", JSON.stringify([
      { datum: "2026-01-01", name: "", strecke: "Andere Fahrt", ab: 100, rueck: 111, modus: "km" }
    ]));
  }, KETTE);
  await page.goto("/");
  await page.click("#go-nachtragen");
  await page.click("#nt-export");
  await expect(page.locator("#modal-export")).toHaveClass(/open/);

  const pdf = await page.evaluate(() => buildListPdfBlob().text());
  expect(pdf).toContain("Nachgetragene Fahrten");
  expect(pdf).toContain("27946");
  expect(pdf).not.toContain("Andere Fahrt");
});
