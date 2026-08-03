// Ausgabe- und Drucken-Tests für den nativen Zweig (Android-App).
// Hintergrund: In der App funktionieren weder Blob-Downloads (a.download) noch
// window.print(). Beides muss deshalb über die Capacitor-Plugins Filesystem und
// Share laufen. Dieser Test stellt eine App-Umgebung nach und prüft, dass die
// Plugins tatsächlich aufgerufen werden – ein stiller Ausfall fällt damit auf.
import { test, expect } from "@playwright/test";

const NACHTRAG = {
  start: "27716", aktuell: "27825", modus: "km",
  fahrten: [
    { datum: "2026-07-14", strecke: "Musterstadt – Beispielheim", art: "km", km: 52, stand: null },
    { datum: "2026-07-15", strecke: "Beispielheim – Musterstadt", art: "km", km: 57, stand: null }
  ]
};

/* Simuliert die Android-App: natives Capacitor mit Filesystem- und
   Share-Plugin, Premium freigeschaltet, ein fertiger Nachtrag. */
async function appUmgebung(page, { plugins = true } = {}){
  await page.addInitScript(([nachtrag, mitPlugins]) => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_edition", JSON.stringify("premium"));
    localStorage.removeItem("fa_nachtraege");   // erzwingt die Übernahme des Altbestands
    localStorage.setItem("fa_nachtrag", JSON.stringify(nachtrag));
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
  }, [NACHTRAG, plugins]);
}

async function imNachtrag(page){
  await page.goto("/");
  await page.click('#rubriken button[data-view="nachtragen"]');
  await expect(page.locator("#nt-liste .ntzeile")).toHaveCount(NACHTRAG.fahrten.length);
}

test("Ausgabe in der App schreibt die Datei und öffnet das Teilen-Menü", async ({ page }) => {
  await appUmgebung(page);
  await imNachtrag(page);

  for (const [knopf, endung] of [["#exp-pdf", ".pdf"], ["#exp-img", ".png"], ["#exp-txt", ".txt"]]){
    await page.evaluate(() => { window.__calls = []; });
    await page.click("#nt-export");
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
  await imNachtrag(page);

  await page.click("#nt-print");
  await expect.poll(async () => (await page.evaluate(() => window.__calls)).map(c => c.fn))
    .toEqual(["writeFile", "getUri", "share"]);
  const calls = await page.evaluate(() => window.__calls);
  expect(calls.find(c => c.fn === "writeFile").path).toContain(".pdf");
  // In der App heißt der Knopf passend zum Teilen-Menü
  await expect(page.locator("#nt-print-label")).toHaveText("Drucken / Teilen");
});

test("Fehlendes Plugin meldet sich, statt stillschweigend nichts zu tun", async ({ page }) => {
  await appUmgebung(page, { plugins: false });
  await imNachtrag(page);

  let hinweis = null;
  page.on("dialog", async d => { hinweis = d.message(); await d.dismiss(); });
  await page.click("#nt-export");
  await page.click("#exp-pdf");
  await expect.poll(() => hinweis).toContain("nicht verfügbar");
});

test("Im Browser bleibt der Download-Weg erhalten", async ({ page }) => {
  await page.addInitScript(nachtrag => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_edition", JSON.stringify("premium"));
    localStorage.removeItem("fa_nachtraege");   // erzwingt die Übernahme des Altbestands
    localStorage.setItem("fa_nachtrag", JSON.stringify(nachtrag));
  }, NACHTRAG);
  await imNachtrag(page);

  await page.click("#nt-export");
  const download = page.waitForEvent("download");
  await page.click("#exp-txt");
  expect((await download).suggestedFilename()).toContain(".txt");
});

test("Die erzeugte PDF ist gültig und enthält die Kette", async ({ page }) => {
  await appUmgebung(page);
  await imNachtrag(page);

  const pdf = await page.evaluate(() => buildListPdfBlob().text());
  expect(pdf.startsWith("%PDF-1.4")).toBeTruthy();
  expect(pdf).toContain("%%EOF");
  expect(pdf).toContain("27716");     // Abfahrt-Stand der ersten Fahrt
  expect(pdf).toContain("Nachgetragene Fahrten");
});
