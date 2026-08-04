// Rechenkern-Tests: prüfen die Fachlogik FA der echten Seite.
// Die Regeln stehen als Festlegungen im Kopf der index.html; hier wird jede
// einzeln geprüft – besonders die Grenzfälle, die auf dem Papier zu falschen
// Einträgen führen (vertauschte Zeilen, zu viele Stellen, leere Kästchen).
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("fa_onboarding_done", "true"));
  await page.goto("/");
});

test("Differenz: Rückkehr minus Abfahrt", async ({ page }) => {
  const f = await page.evaluate(() => [
    FA.auswerten("27716", "27768").diff,   // Beispiel aus einem echten Blatt: 52
    FA.auswerten("0", "1").diff,
    FA.auswerten("999998", "999999").diff,
    FA.auswerten("27768", "27768").diff    // gleiche Stände sind erlaubt
  ]);
  expect(f).toEqual([52, 1, 1, 0]);
});

test("Rückkehr kleiner als Abfahrt ist ein Fehler, keine negative Strecke", async ({ page }) => {
  const r = await page.evaluate(() => FA.auswerten("27768", "27716"));
  expect(r.diff).toBeNull();
  expect(r.fertig).toBeFalsy();
  expect(r.fehler).toContain("kleiner");
  // Der Hinweis auf vertauschte Zeilen ist der eigentliche Zweck der Meldung
  expect(r.fehler).toContain("vertauscht");
});

test("Eingaben werden geprüft: Ziffern, sechs Stellen, leere Felder", async ({ page }) => {
  const r = await page.evaluate(() => ({
    leer:      FA.parse(""),
    text:      FA.parse("abc"),
    komma:     FA.parse("27,5"),
    punkte:    FA.parse("27.768"),        // Tausenderpunkte sind erlaubt
    grenze:    FA.parse("999999"),
    zuGross:   FA.parse("1000000")
  }));
  expect(r.leer.leer).toBeTruthy();
  expect(r.leer.fehler).toBeNull();
  expect(r.text.fehler).toContain("Ziffern");
  expect(r.komma.fehler).toContain("Ziffern");
  expect(r.punkte.wert).toBe(27768);
  expect(r.grenze.wert).toBe(999999);
  expect(r.zuGross.fehler).toContain("sechs Stellen");
});

test("Unvollständige Eingabe ergibt weder Fehler noch Ergebnis", async ({ page }) => {
  const r = await page.evaluate(() => FA.auswerten("27716", ""));
  expect(r.fehler).toBeNull();
  expect(r.fertig).toBeFalsy();
  expect(r.diff).toBeNull();
});

test("Kästchen: sechs Stellen, rechtsbündig, vorne leer statt Null", async ({ page }) => {
  const k = await page.evaluate(() => ({
    fuenf:  FA.kaestchen(27768),
    sechs:  FA.kaestchen(128025),
    eins:   FA.kaestchen(7),
    null0:  FA.kaestchen(0),
    leer:   FA.kaestchen(null)
  }));
  expect(k.fuenf).toEqual(["", "2", "7", "7", "6", "8"]);
  expect(k.sechs).toEqual(["1", "2", "8", "0", "2", "5"]);
  expect(k.eins).toEqual(["", "", "", "", "", "7"]);
  expect(k.null0).toEqual(["", "", "", "", "", "0"]);
  expect(k.leer).toEqual(["", "", "", "", "", ""]);
});

test("Der Kopiertext nutzt dagegen führende Nullen", async ({ page }) => {
  const s = await page.evaluate(() => [FA.mitNullen(27768), FA.mitNullen(0), FA.mitNullen(null)]);
  expect(s).toEqual(["027768", "000000", ""]);
});

test("Prüfhinweise bei 0 und bei sehr großer Differenz", async ({ page }) => {
  const r = await page.evaluate(() => ({
    gleich: FA.auswerten("27768", "27768"),
    gross:  FA.auswerten("10000", "20000"),
    normal: FA.auswerten("27716", "27768")
  }));
  expect(r.gleich.hinweis).toContain("gleich");
  expect(r.gleich.fertig).toBeTruthy();      // Hinweis, aber kein Fehler
  expect(r.gross.hinweis).toContain("Ungewöhnlich");
  expect(r.gross.fertig).toBeTruthy();
  expect(r.normal.hinweis).toBeNull();
});

test("Betriebsstunden rechnen gleich, nur Beschriftung und Einheit wechseln", async ({ page }) => {
  const m = await page.evaluate(() => ({
    km:  { einheit: FA.modus("km").einheit,  nachweis: FA.modus("km").nachweis },
    std: { einheit: FA.modus("std").einheit, nachweis: FA.modus("std").nachweis },
    unbekannt: FA.modus("quatsch").einheit
  }));
  expect(m.km.einheit).toBe("km");
  expect(m.std.einheit).toBe("h");
  expect(m.std.nachweis).toContain("BetrStd");
  expect(m.unbekannt).toBe("km");            // unbekannter Wert fällt auf km zurück
});
