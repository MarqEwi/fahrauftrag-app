// Uhrzeiten im Nachtrag: Reihenfolge nach Datum, Handsortierung am selben
// Tag, Überschneidungen und die Hinweise zu den Lenk- und Ruhezeiten.
import { test, expect } from "@playwright/test";

async function mitFahrten(page, fahrten, { zeiten = true, start = "10000", aktuell = "20000" } = {}){
  await page.addInitScript(([f, z, st, ak]) => {
    localStorage.setItem("fa_onboarding_done", "true");
    localStorage.setItem("fa_zeiten", JSON.stringify(z));
    localStorage.setItem("fa_nachtrag", JSON.stringify({ start: st, aktuell: ak, modus: "km", fahrten: f }));
  }, [fahrten, zeiten, start, aktuell]);
  await page.goto("/");
  await page.click("#go-nachtragen");
}

const fahrt = (datum, km, zab, zende, strecke = "") => (
  { datum, strecke, art: "km", km, stand: null, zab, zende }
);

const koepfe = page => page.$$eval("#nt-liste .ntkopf", els => els.map(e => e.textContent.trim()));
const hinweise = page => page.$$eval("#nt-zeithinweise li", els => els.map(e => e.textContent));

test("Die Fahrten ordnen sich selbst nach Datum", async ({ page }) => {
  await mitFahrten(page, [
    fahrt("2026-07-16", 100, "08:00", "09:00", "Dritte"),
    fahrt("2026-07-14", 100, "08:00", "09:00", "Erste"),
    fahrt("2026-07-15", 100, "08:00", "09:00", "Zweite")
  ]);
  const k = await koepfe(page);
  expect(k[0]).toContain("Erste");
  expect(k[1]).toContain("Zweite");
  expect(k[2]).toContain("Dritte");
});

test("Am selben Tag lässt sich die Reihenfolge von Hand ändern", async ({ page }) => {
  await mitFahrten(page, [
    fahrt("2026-07-14", 100, "08:00", "09:00", "Zuerst"),
    fahrt("2026-07-14", 100, "10:00", "11:00", "Danach")
  ]);
  expect((await koepfe(page))[0]).toContain("Zuerst");

  await page.click("#nt-liste [data-runter='0']");
  expect((await koepfe(page))[0]).toContain("Danach");

  // und wieder zurück
  await page.click("#nt-liste [data-hoch='1']");
  expect((await koepfe(page))[0]).toContain("Zuerst");
});

test("Über einen Tageswechsel hinweg ist das Tauschen gesperrt", async ({ page }) => {
  await mitFahrten(page, [
    fahrt("2026-07-14", 100, "08:00", "09:00", "Montag"),
    fahrt("2026-07-15", 100, "08:00", "09:00", "Dienstag")
  ]);
  // Der Sortierlauf würde den Tausch sofort rückgängig machen – deshalb aus
  await expect(page.locator("#nt-liste [data-runter='0']")).toBeDisabled();
  await expect(page.locator("#nt-liste [data-hoch='1']")).toBeDisabled();
});

test("Ohne Uhrzeiten bleibt das Sortieren von Hand möglich", async ({ page }) => {
  await mitFahrten(page, [
    { datum: "", strecke: "Ohne Datum A", art: "km", km: 100, stand: null },
    { datum: "", strecke: "Ohne Datum B", art: "km", km: 100, stand: null }
  ], { zeiten: false });
  await expect(page.locator("#nt-zeithinweise")).toBeEmpty();
  await page.click("#nt-liste [data-runter='0']");
  expect((await koepfe(page))[0]).toContain("Ohne Datum B");
});

test("Überschneidende Zeiten werden deutlich gemeldet", async ({ page }) => {
  await mitFahrten(page, [
    fahrt("2026-07-14", 100, "08:00", "10:00"),
    fahrt("2026-07-14", 100, "09:30", "11:00")     // beginnt vor dem Ende der ersten
  ]);
  const h = await hinweise(page);
  expect(h.join(" ")).toContain("überschneiden");
  await expect(page.locator("#nt-zeithinweise .zeithinweise")).toHaveClass(/hart/);
});

test("Ohne 45-Minuten-Pause erscheint der Hinweis, mit Pause nicht", async ({ page }) => {
  // 2:30 + 2:15 = 4:45 Fahrzeit, dazwischen nur 15 Minuten
  await mitFahrten(page, [
    fahrt("2026-07-14", 100, "06:00", "08:30"),
    fahrt("2026-07-14", 100, "08:45", "11:00")
  ]);
  expect((await hinweise(page)).join(" ")).toContain("ohne eine Pause von 45 Minuten");

  // Dieselben Fahrten mit 45 Minuten dazwischen: kein Hinweis
  await mitFahrten(page, [
    fahrt("2026-07-14", 100, "06:00", "08:30"),
    fahrt("2026-07-14", 100, "09:15", "11:30")
  ]);
  expect(await hinweise(page)).toEqual([]);
});

test("Die Aufteilung 15 + 30 Minuten zählt als Pause", async ({ page }) => {
  // 2:00 + 1:30 + 1:45 = 5:15 Fahrzeit, dazwischen 15 und danach 30 Minuten
  await mitFahrten(page, [
    fahrt("2026-07-14", 100, "06:00", "08:00"),
    fahrt("2026-07-14", 100, "08:15", "09:45"),
    fahrt("2026-07-14", 100, "10:15", "12:00")
  ]);
  expect(await hinweise(page)).toEqual([]);
});

test("Mehr als neun Stunden Fahrzeit an einem Tag fallen auf", async ({ page }) => {
  // 4:30 + 5:00 = 9:30 an einem Tag
  await mitFahrten(page, [
    fahrt("2026-07-14", 300, "05:00", "09:30"),
    fahrt("2026-07-14", 300, "10:30", "15:30")
  ]);
  expect((await hinweise(page)).join(" ")).toContain("über 9 Stunden");
});

test("Über zehn Stunden wird deutlicher benannt", async ({ page }) => {
  // 5:00 + 6:00 = 11:00 an einem Tag
  await mitFahrten(page, [
    fahrt("2026-07-14", 300, "05:00", "10:00"),
    fahrt("2026-07-14", 300, "11:00", "17:00")
  ]);
  expect((await hinweise(page)).join(" ")).toContain("mehr als die 10 Stunden");
});

test("Eine zu kurze Ruhezeit zwischen zwei Tagen fällt auf", async ({ page }) => {
  await mitFahrten(page, [
    fahrt("2026-07-14", 100, "18:00", "22:00"),
    fahrt("2026-07-15", 100, "05:00", "07:00")     // nur 7 Stunden dazwischen
  ]);
  expect((await hinweise(page)).join(" ")).toContain("tägliche Ruhezeit");
});

test("Die Hinweise sagen ausdrücklich, dass sie keine Prüfung sind", async ({ page }) => {
  await mitFahrten(page, [
    fahrt("2026-07-14", 100, "06:00", "08:30"),
    fahrt("2026-07-14", 100, "08:45", "11:00")
  ]);
  await expect(page.locator("#nt-zeithinweise .fuss")).toContainText("keine Prüfung");
});

test("Die Uhrzeiten stehen an der Fahrt und überstehen den Neustart", async ({ page }) => {
  await mitFahrten(page, [fahrt("2026-07-14", 230, "11:30", "13:45", "Musterstadt – Beispielheim")]);
  await expect(page.locator("#nt-liste .ntzeiten")).toContainText("11:30");
  await expect(page.locator("#nt-liste .ntzeiten")).toContainText("13:45");
  await expect(page.locator("#nt-liste .ntzeiten")).toContainText("2:15 h");

  await page.reload();
  await page.click("#go-nachtragen");
  await expect(page.locator("#nt-liste .ntzeiten")).toContainText("2:15 h");
});

test("Ist die Option aus, tauchen weder Felder noch Hinweise auf", async ({ page }) => {
  await mitFahrten(page, [
    fahrt("2026-07-14", 100, "06:00", "08:30"),
    fahrt("2026-07-14", 100, "08:45", "11:00")
  ], { zeiten: false });
  await expect(page.locator("#nt-zeithinweise")).toBeEmpty();
  await expect(page.locator("#nt-liste .ntzeiten")).toHaveCount(0);
  await page.click("#nt-add");
  await expect(page.locator("#nt-e-zeiten")).toBeHidden();
});
