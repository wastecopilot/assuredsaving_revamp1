/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script, run outside the app */
// Simulates many randomized visitors against a running build (npm run build && npm start).
// Needs Playwright: npx playwright install chromium && npm i --no-save playwright
// Mocked app only: test values (example.com emails, 555 numbers). Usage: node scripts/simulate.cjs <sessions> <concurrency> <seed>

const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:3000';
const N = Number(process.argv[2] || 200);
const CONC = Number(process.argv[3] || 8);
let seed = Number(process.argv[4] || 42);
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;

const TILES = ['Internet', 'TV', 'Landline', 'Mobile', 'Home Security'];
const PRESETS = ['Internet + TV', 'Internet + TV + Phone', 'Internet + TV + Mobile', 'Quad Play'];
const VALID = new Set(['Internet', 'TV', 'Landline', 'Mobile', 'Home Security', 'Internet+TV', 'Internet+TV+Landline', 'Internet+TV+Mobile', 'Internet+TV+Landline+Mobile']);
const ADDR = ['658', '6585', '6581', '65', '12', '400 Main Street Suite 200', '9 Elm Ave Apt 4', 'Crescent', 'Fannin', 'zzzz', '  ', '<script>alert(1)</script>', '1' + 'x'.repeat(300), '1 Ünïcødé Straße', '77 Tech Park Dr', '‮1 RTL'];
const NAMES = ['Jordan Rivera', 'A', 'Li', 'María José', '<b>x</b>', 'O\'Neil', 'x'.repeat(200), '  Sam  '];
const VIEWPORTS = [[360, 740], [390, 844], [414, 896], [768, 1024], [1280, 800], [1440, 900]];

const stats = { sessions: 0, reachedAddress: 0, reachedUsage: 0, reachedTv: 0, reachedResults: 0, businessChooser: 0, usError: 0, openedDetails: 0, callbackDone: 0, callbackErrorsShown: 0, backPresses: 0, restarts: 0, langSwitches: 0, selections: {} };
const problems = [];
const fail = (id, msg) => problems.push(`#${id}: ${msg}`);

async function selected(p) {
  return p.evaluate((tiles) => tiles.filter((n) => [...document.querySelectorAll('#section-intent button[aria-pressed]')].some((b) => b.textContent.trim() === n && b.getAttribute('aria-pressed') === 'true')), TILES);
}

async function session(id, browser) {
  const [w, h] = pick(VIEWPORTS);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768, reducedMotion: chance(0.5) ? 'reduce' : 'no-preference', bypassCSP: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(15000);
  p.on('pageerror', (e) => fail(id, `page error: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && fail(id, `console error: ${m.text().slice(0, 160)}`));
  const log = [];
  try {
    await p.goto(BASE, { waitUntil: 'load', timeout: 30000 });
    await p.waitForFunction(() => document.querySelector('#section-intent button[aria-pressed]') && Object.keys(document.querySelector('#section-intent button[aria-pressed]')).some((k) => k.startsWith('__react')));
    stats.sessions++;
    if (chance(0.25)) {
      await p.getByRole('button', { name: 'ESP' }).click();
      stats.langSwitches++;
      await p.getByRole('button', { name: 'ENG' }).click();
    }
    // Step 1: random clicks, check the selection is always an official combination
    const clicks = 1 + Math.floor(rnd() * 6);
    for (let i = 0; i < clicks; i++) {
      const what = chance(0.2) ? pick(PRESETS) : pick(TILES);
      if (PRESETS.includes(what)) await p.getByRole('button', { name: what, exact: true }).click();
      else await p.locator('#section-intent').getByRole('button', { name: what, exact: true }).click();
      const sel = await selected(p);
      log.push(`${what}=>${sel.join('+')}`);
      if (!VALID.has(sel.join('+'))) fail(id, `invalid selection ${sel.join('+')} after ${log.join(' > ')}`);
    }
    if (chance(0.1)) {
      // try continuing with nothing selected is impossible after a click; just double-click continue
      await p.locator('#section-intent').getByRole('button', { name: 'Continue' }).dblclick();
    } else await p.locator('#section-intent').getByRole('button', { name: 'Continue' }).click();
    const sel = (await selected(p)).join('+');
    stats.selections[sel] = (stats.selections[sel] || 0) + 1;

    // Name
    const name = await p.waitForSelector('input[autocomplete="name"]');
    stats.reachedAddress++;
    const nm = pick(NAMES);
    await name.fill(nm);
    if (nm.trim().length < 2) {
      if (await p.locator('#addr').count()) fail(id, 'address shown for a 1-letter name');
      await name.fill('Jordan Rivera');
    }
    // Address: maybe a bad query first
    const box = p.locator('#addr');
    await box.waitFor();
    let q = pick(ADDR);
    await box.fill(q);
    await p.waitForTimeout(120);
    let options = await p.getByRole('option').count();
    if (!options) {
      const err = await p.getByText('US addresses only — please pick from the list').count();
      if (q.trim() && !err) fail(id, `no suggestions and no error for "${q.slice(0, 30)}"`);
      if (err) stats.usError++;
      q = pick(['658', '6585', '6581', '6580', '6584']);
      await box.fill(q);
      await p.waitForTimeout(120);
    }
    if (chance(0.3)) {
      await box.press('ArrowDown');
      await box.press('Enter');
    } else await p.getByRole('option').nth(Math.floor(rnd() * Math.min(3, await p.getByRole('option').count()))).click();

    const chooser = p.getByRole('group', { name: 'Business address detected' });
    await p.waitForTimeout(250);
    if (await chooser.count()) {
      stats.businessChooser++;
      await chooser.getByRole('button', { name: pick(['Internet', 'Internet + TV Bundle']), exact: true }).click();
    }
    const services = (await selected(p)).join('+');
    const business = await p.locator('#section-address').getByText('Business Address').count();
    if (business && !['Internet', 'Internet+TV'].includes(services)) fail(id, `business address continued with ${services}`);

    // Usage (internet only)
    if (services.includes('Internet')) {
      await p.waitForSelector('#section-usage', { timeout: 8000 });
      stats.reachedUsage++;
      const waiting = p.locator('#section-usage').getByRole('button', { name: 'Pick how you use the internet' });
      if (!(await waiting.isDisabled())) fail(id, 'usage CTA enabled with nothing picked');
      const tiles = p.locator('#section-usage button[aria-pressed]');
      const n = 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) await tiles.nth(Math.floor(rnd() * 4)).click();
      if (!(await p.locator('#section-usage button[aria-pressed="true"]').count())) await tiles.first().click();
      if (chance(0.3)) await p.locator('#section-usage input[type=range]').fill(String(5 + Math.floor(rnd() * 95)));
      if (chance(0.1)) {
        await p.getByRole('button', { name: 'Back', exact: true }).click();
        stats.backPresses++;
        await p.waitForTimeout(150);
        await p.locator('#section-address').getByRole('button', { name: 'Continue', exact: true }).click();
        await p.waitForSelector('#section-usage');
        if (!(await p.locator('#section-usage button[aria-pressed="true"]').count())) await p.locator('#section-usage button[aria-pressed]').first().click();
      }
      await p.locator('#section-usage').getByRole('button', { name: /Continue|Find TV Plans/ }).click();
    }
    // TV
    if (services.includes('TV')) {
      await p.waitForSelector('#section-tv', { timeout: 8000 });
      stats.reachedTv++;
      const cta = p.locator('#section-tv').getByRole('button', { name: 'Answer "do you have internet" above to continue' });
      if (!(await cta.isDisabled())) fail(id, 'TV CTA enabled before answering');
      const chips = p.locator('#section-tv [aria-pressed]');
      for (let i = 0; i < Math.floor(rnd() * 4); i++) await chips.nth(Math.floor(rnd() * (await chips.count()))).click();
      await p.getByRole('radio', { name: pick(['Yes', 'No']), exact: true }).click();
      await p.locator('#section-tv').getByRole('button', { name: /Find my/ }).click();
    }
    // Maybe restart mid-scan
    if (chance(0.05)) {
      await p.getByRole('button', { name: /Start a new search/ }).click();
      stats.restarts++;
      if ((await selected(p)).length) fail(id, 'start over kept services');
      await ctx.close();
      return;
    }
    await p.waitForSelector('#section-results', { timeout: 12000 });
    stats.reachedResults++;
    const heading = await p.locator('#section-results h2').innerText();
    if (!/\d+ plans? available/.test(heading)) fail(id, `results heading odd: ${heading}`);
    const cards = await p.locator('[data-plan-card]').count();
    if (!cards) fail(id, `no plan cards for ${services}`);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) fail(id, `horizontal overflow ${over}px at ${w}px`);

    if (chance(0.5)) {
      await p.locator('[data-plan-card]').first().getByRole('button', { name: /Show details/ }).click();
      await p.getByRole('dialog').waitFor();
      stats.openedDetails++;
      await p.keyboard.press('Escape');
      await p.waitForTimeout(300);
      if (await p.getByRole('dialog').count()) fail(id, 'details did not close on Escape');
    }
    if (chance(0.6)) {
      await p.locator('[data-plan-card]').first().getByRole('button', { name: /Get Started|Call for Pricing/ }).click();
      const d = p.getByRole('dialog');
      await d.waitFor();
      // Submitting empty must show errors, never succeed
      await d.getByRole('button', { name: 'Call Me Now' }).click();
      if (await d.getByText("You're All Set!").count()) fail(id, 'callback succeeded with an empty form');
      else stats.callbackErrorsShown++;
      await d.getByLabel('Email Address').fill(pick(['jordan@example.com', 'bad-email', 'a@b.co']));
      const phone = pick(['2125550142', '3125550199', '2125550000', '123']);
      await d.getByLabel('Mobile Phone').fill(phone);
      const send = d.getByRole('button', { name: 'Send Code' });
      if (await send.isEnabled()) {
        await send.click();
        await p.waitForTimeout(700);
        const codeBox = d.getByLabel('Enter the 6-digit code');
        if (await codeBox.count()) {
          await codeBox.fill(pick(['123456', '000000', '42']));
          await d.getByRole('button', { name: 'Confirm' }).click();
          await p.waitForTimeout(600);
        }
      }
      if (chance(0.7)) await d.locator('#cb-call').check();
      if (chance(0.4)) await d.locator('#cb-sms').check();
      await d.getByRole('button', { name: pick(['Call Me Now', 'Schedule Callback']) }).click();
      const done = await d.getByText("You're All Set!").count();
      const verified = await d.getByText('Verified ✓').count();
      const consent = await d.locator('#cb-call').isChecked().catch(() => true);
      if (done) {
        stats.callbackDone++;
        if (phone.endsWith('0000')) fail(id, 'do-not-call number got a callback');
      }
      if (done && (!consent)) fail(id, 'callback done without consent');
      if (!done && verified && consent && (await d.getByLabel('Email Address').inputValue().catch(() => '')) === 'jordan@example.com') {
        // could be "Schedule Callback" with no time picked; that's expected to block
      }
      await p.keyboard.press('Escape');
    }
  } catch (e) {
    fail(id, `stuck: ${e.message.split('\n')[0].slice(0, 200)} | path ${log.join(' > ')}`);
    try { await p.screenshot({ path: `sim-fail-${id}.png` }); } catch {}
  }
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  const t0 = Date.now();
  let next = 0;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (next < N) await session(next++, browser);
  }));
  await browser.close();
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  const out = { secs, ...stats, problems: [...new Set(problems)] };
  fs.writeFileSync('sim-report.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ ...out, problems: out.problems.slice(0, 40), problemCount: out.problems.length }, null, 1));
})();
