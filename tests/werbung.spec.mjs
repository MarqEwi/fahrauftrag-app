// Werbung und Kauf laufen nur in der Android-App – im Browser bleiben Fehler
// darin unsichtbar. Diese Tests stellen die App-Umgebung mit Schein-Plugins
// nach und prüfen, dass die Module die Plugins wirklich aufrufen: Banner,
// Tastatur-Verhalten, Einwilligung, Premium-Abschaltung und der Kauf.
import { test, expect } from "@playwright/test";

/* App-Umgebung mit Schein-AdMob. Das Plugin protokolliert Aufrufe und feuert
   die echten Events nach – auch die Höhe 0 beim Verstecken, die ohne Schutz
   den HTML-Platzhalter einspringen ließe. */
async function mitAdMob(page, { consent = null, premium = false } = {}){
  await page.addInitScript(([consentInfo, prem]) => {
    localStorage.setItem("fa_onboarding_done", "true");
    if (prem) localStorage.setItem("fa_edition", JSON.stringify("premium"));
    window.__ads = [];
    let sizeCb = null;
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: { AdMob: {
        initialize: async () => ({}),
        requestConsentInfo: async () => consentInfo ||
          ({ status: "NOT_REQUIRED", canRequestAds: true, privacyOptionsRequirementStatus: "NOT_REQUIRED" }),
        showConsentForm: async () => { window.__ads.push("showConsentForm");
          return { status: "OBTAINED", canRequestAds: true, privacyOptionsRequirementStatus: "REQUIRED" }; },
        showBanner: async () => { window.__ads.push("showBanner");
          setTimeout(() => sizeCb && sizeCb({ width: 320, height: 50 }), 10); return {}; },
        hideBanner: async () => { window.__ads.push("hideBanner");
          setTimeout(() => sizeCb && sizeCb({ width: 0, height: 0 }), 10); return {}; },
        resumeBanner: async () => { window.__ads.push("resumeBanner");
          setTimeout(() => sizeCb && sizeCb({ width: 320, height: 50 }), 10); return {}; },
        removeBanner: async () => { window.__ads.push("removeBanner");
          setTimeout(() => sizeCb && sizeCb({ width: 0, height: 0 }), 10); return {}; },
        addListener: (ev, cb) => { if (ev === "bannerAdSizeChanged") sizeCb = cb; return { remove(){} }; }
      } }
    };
  }, [consent, premium]);
  await page.goto("/");
}

const aufrufe = page => page.evaluate(() => window.__ads);

test("Die freie App fordert das Banner an und reserviert den Platz", async ({ page }) => {
  await mitAdMob(page);
  await expect.poll(() => aufrufe(page)).toContain("showBanner");
  await expect(page.locator("body")).toHaveClass(/native-ads/);
  // Das echte Banner läuft – der HTML-Platzhalter tritt zurück
  await expect(page.locator("#adbar")).toBeHidden();
  const h = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--native-ad-h").trim());
  expect(h).toBe("50px");
});

test("Bei offener Tastatur versteckt sich das Banner, ohne dass das Layout springt", async ({ page }) => {
  await mitAdMob(page);
  await expect.poll(() => aufrufe(page)).toContain("showBanner");

  // Fokus in ein Eingabefeld: Banner weg, aber der reservierte Platz bleibt
  await page.focus("#in-ab");
  await expect.poll(() => aufrufe(page)).toContain("hideBanner");
  await page.waitForTimeout(80);        // das Höhe-0-Event ist dann durch
  await expect(page.locator("body")).toHaveClass(/native-ads/);
  await expect(page.locator("#adbar")).toBeHidden();
  const h = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--native-ad-h").trim());
  expect(h).toBe("50px");

  // Feldwechsel: die Tastatur bleibt offen, das Banner darf nicht aufblitzen
  await page.focus("#in-rueck");
  await page.waitForTimeout(500);
  expect(await aufrufe(page)).not.toContain("resumeBanner");

  // Fokus weg: das Banner kommt zurück
  await page.evaluate(() => document.activeElement.blur());
  await expect.poll(() => aufrufe(page)).toContain("resumeBanner");
});

test("Premium entfernt das Banner", async ({ page }) => {
  await mitAdMob(page);
  await expect.poll(() => aufrufe(page)).toContain("showBanner");

  await page.evaluate(() => Edition.set("premium"));
  await expect.poll(() => aufrufe(page)).toContain("removeBanner");
  await page.waitForTimeout(80);
  await expect(page.locator("body")).not.toHaveClass(/native-ads/);
  await expect(page.locator("#adbar")).toBeHidden();   // Premium: auch kein Platzhalter
});

test("Verlangt Google eine Einwilligung, kommt sie vor dem Banner", async ({ page }) => {
  await mitAdMob(page, { consent: { status: "REQUIRED", isConsentFormAvailable: true,
    canRequestAds: true, privacyOptionsRequirementStatus: "REQUIRED" } });
  await expect.poll(() => aufrufe(page)).toContain("showBanner");
  const calls = await aufrufe(page);
  expect(calls.indexOf("showConsentForm")).toBeLessThan(calls.indexOf("showBanner"));
  // Google verlangt die Widerrufs-Möglichkeit: der Knopf ist sichtbar
  await page.click("#btn-settings");
  await page.click('#modal-settings summary:has-text("Über diese App")');
  await expect(page.locator("#ads-privacy-btn")).toBeVisible();
});

test("Ohne Einwilligung bleibt das Banner aus – die App läuft weiter", async ({ page }) => {
  await mitAdMob(page, { consent: { status: "REQUIRED", isConsentFormAvailable: false,
    canRequestAds: false, privacyOptionsRequirementStatus: "NOT_REQUIRED" } });
  await page.fill("#in-ab", "27716");
  await page.fill("#in-rueck", "27768");
  await expect(page.locator("#nachweis-wert")).toHaveText("52");   // App funktioniert
  await page.waitForTimeout(300);
  expect(await aufrufe(page)).not.toContain("showBanner");
});

/* ---------- Kauf ---------- */

/* Schein-CdvPurchase: liefert ein Produkt mit Angebot; order() führt zum
   approved-Ereignis wie im echten Ablauf. */
async function mitBilling(page, { mitAngebot = true } = {}){
  await page.addInitScript(angebot => {
    localStorage.setItem("fa_onboarding_done", "true");
    window.__buy = [];
    window.Capacitor = { isNativePlatform: () => true, Plugins: {} };
    const handler = {};
    const produkt = {
      id: "premium_unlock", canPurchase: true,
      pricing: { price: "2,99 €" },
      getOffer: () => angebot ? {
        order: () => { window.__buy.push("order");
          setTimeout(() => handler.approved && handler.approved({
            finish(){ window.__buy.push("finish"); } }), 20);
          return Promise.resolve(); }
      } : null
    };
    window.CdvPurchase = { store: {
      DEBUG: 4, verbosity: 0,
      register: p => { window.__buy.push("register:" + p[0].id + ":" + p[0].type); },
      error(){}, get: () => produkt, owned: () => false,
      when(){ return {
        productUpdated(cb){ handler.productUpdated = cb; return this; },
        approved(cb){ handler.approved = cb; return this; },
        receiptUpdated(cb){ handler.receiptUpdated = cb; return this; }
      }; },
      initialize(){ window.__buy.push("initialize");
        setTimeout(() => handler.productUpdated && handler.productUpdated(produkt), 10); },
      restorePurchases(){ window.__buy.push("restore"); }
    }, ProductType: { NON_CONSUMABLE: "non consumable" }, Platform: { GOOGLE_PLAY: "google-play" } };
  }, mitAngebot);
  await page.goto("/");
  // Billing.init wartet auf deviceready – das Ereignis kommt hier von Hand
  await page.evaluate(() => document.dispatchEvent(new Event("deviceready")));
}

test("Der Kauf durchläuft register, order, approved – und schaltet Premium frei", async ({ page }) => {
  await mitBilling(page);
  await expect.poll(() => page.evaluate(() => window.__buy)).toContain("initialize");
  expect(await page.evaluate(() => window.__buy)).toContain("register:premium_unlock:non consumable");

  // Kaufdialog öffnen: der Knopf zeigt den echten Preis aus dem Store
  await page.click("#btn-settings");
  await page.click("#acc-premium summary");
  await page.click("#s-premium");
  await expect(page.locator("#premium-buy")).toContainText("2,99 €");
  await page.click("#premium-buy");

  await expect.poll(() => page.evaluate(() => window.__buy)).toContain("finish");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("fa_edition"))).toBe("\"premium\"");
  await expect(page.locator("#premium-buy-area")).toContainText("Premium ist aktiv");
});

test("Ohne Angebot meldet sich der Kauf-Knopf, statt still zu scheitern", async ({ page }) => {
  await mitBilling(page, { mitAngebot: false });
  await expect.poll(() => page.evaluate(() => window.__buy)).toContain("initialize");

  let hinweis = null;
  page.on("dialog", async d => { hinweis = d.message(); await d.dismiss(); });
  await page.click("#btn-settings");
  await page.click("#acc-premium summary");
  await page.click("#s-premium");
  await page.click("#premium-buy");
  await expect.poll(() => hinweis).toContain("nicht verfügbar");
  expect(await page.evaluate(() => localStorage.getItem("fa_edition"))).not.toBe("\"premium\"");
});

test("Käufe wiederherstellen ruft das Plugin auf", async ({ page }) => {
  await mitBilling(page);
  await expect.poll(() => page.evaluate(() => window.__buy)).toContain("initialize");
  await page.click("#btn-settings");
  await page.click("#acc-premium summary");
  await page.click("#s-premium");
  await page.click("#premium-restore");
  await expect.poll(() => page.evaluate(() => window.__buy)).toContain("restore");
});
