// Ausgabe- und Drucken-Tests für den nativen Zweig (Android-App).
// Hintergrund: In der App funktionieren weder Blob-Downloads (a.download) noch
// window.print(). Beides muss deshalb über die Capacitor-Plugins Filesystem und
// Share laufen. Dieser Test stellt eine App-Umgebung nach und prüft, dass die
// Plugins tatsächlich aufgerufen werden – ein stiller Ausfall fällt damit auf.
import { test, expect } from "@playwright/test";

const FAHRTEN = [
  { datum: "2026-07-14", name: "Mustermann", strecke: "Musterstadt – Beispielheim", ab: 27716, rueck: 27768, modus: "km" },
  { datum: "2026-07-15", name: "Musterfrau", strecke: "Beispielheim – Musterstadt", ab: 27768, rueck: 27825, modus: "km" }
];

/* Simuliert die Android-App: natives Capacitor mit Filesystem- und
   Share-Plugin, Premium freigeschaltet, zwei Fahrten in der Liste. */
async function appUmgebung(page, { plugins = true } = {}){
  await page.addInitScript(([fahrten, mitPlugins]) => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_edition", JSON.stringify("premium"));
    localStorage.setItem("fa_fahrten", JSON.stringify(fahrten));
    window.__calls = [];
    const Plugins = mitPlugins ? {
      Filesystem: {
        writeFile: async o => { window.__calls.push({ fn: "writeFile", path: o.path, directory: o.directory, bytes: (o.data || "").length }); return {}; },
        getUri: async o => { window.__calls.push({ fn: "getUri", path: o.path }); return { uri: "file:///cache/" + o.path }; }
      },
      Share: {
        share: async o => { window.__calls.push({ fn: "share", title: o.title, file: (o.files || [])[0] }); return {}; }
      }
    } : {};
    window.Capacitor = { isNativePlatform: () => true, Plugins };
  }, [FAHRTEN, plugins]);
}

async function inFahrtenListe(page){
  await page.goto("/");
  await page.click("#go-fahrten");
  await expect(page.locator("#f-liste .fahrt")).toHaveCount(FAHRTEN.length);
}

test("Ausgabe in der App schreibt die Datei und öffnet das Teilen-Menü", async ({ page }) => {
  await appUmgebung(page);
  await inFahrtenListe(page);

  for (const [knopf, endung] of [["#exp-pdf", ".pdf"], ["#exp-img", ".png"], ["#exp-txt", ".txt"]]){
    await page.evaluate(() => { window.__calls = []; });
    await page.click("#f-export");
    await page.click(knopf);
    await expect.poll(async () => (await page.evaluate(() => window.__calls)).map(c => c.fn))
      .toEqual(["writeFile", "getUri", "share"]);
    const calls = await page.evaluate(() => window.__calls);
    const write = calls.find(c => c.fn === "writeFile");
    expect(write.path).toContain(endung);
    expect(write.directory).toBe("CACHE");
    expect(write.bytes).toBeGreaterThan(0);          // Datei ist nicht leer
    expect(calls.find(c => c.fn === "share").file).toBe("file:///cache/" + write.path);
  }
});

test("Drucken erzeugt in der App ein PDF und teilt es", async ({ page }) => {
  await appUmgebung(page);
  await inFahrtenListe(page);

  await page.click("#f-print");
  await expect.poll(async () => (await page.evaluate(() => window.__calls)).map(c => c.fn))
    .toEqual(["writeFile", "getUri", "share"]);
  const calls = await page.evaluate(() => window.__calls);
  expect(calls.find(c => c.fn === "writeFile").path).toContain(".pdf");
  // In der App heißt der Knopf passend zum Teilen-Menü
  await expect(page.locator("#f-print-label")).toHaveText("Drucken / Teilen");
});

test("Fehlendes Plugin meldet sich, statt stillschweigend nichts zu tun", async ({ page }) => {
  await appUmgebung(page, { plugins: false });
  await inFahrtenListe(page);

  let hinweis = null;
  page.on("dialog", async d => { hinweis = d.message(); await d.dismiss(); });
  await page.click("#f-export");
  await page.click("#exp-pdf");
  await expect.poll(() => hinweis).toContain("nicht verfügbar");
});

test("Im Browser bleibt der Download-Weg erhalten", async ({ page }) => {
  await page.addInitScript(fahrten => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_edition", JSON.stringify("premium"));
    localStorage.setItem("fa_fahrten", JSON.stringify(fahrten));
  }, FAHRTEN);
  await inFahrtenListe(page);

  await page.click("#f-export");
  const download = page.waitForEvent("download");
  await page.click("#exp-txt");
  expect((await download).suggestedFilename()).toContain(".txt");
});

test("Die erzeugte PDF ist gültig und enthält die Fahrten", async ({ page }) => {
  await appUmgebung(page);
  await inFahrtenListe(page);

  const pdf = await page.evaluate(() => buildListPdfBlob().text());
  expect(pdf.startsWith("%PDF-1.4")).toBeTruthy();
  expect(pdf).toContain("%%EOF");
  expect(pdf).toContain("27716");     // Abfahrt-Stand der ersten Fahrt
  expect(pdf).toContain("Fahrtenliste");
});
