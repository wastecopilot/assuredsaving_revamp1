# Assured Saving: enterprise UI/UX revamp (design preview)

A professional, enterprise-grade redesign of the Assured Saving one-pager (https://assuredsaving.vercel.app/). It keeps the same steps, order, content and address flow as the original:

1. Services and bundles
2. Name and address (home or business is detected from the address)
3. Usage (when Internet is chosen)
4. TV setup (when TV is chosen)
5. Live scan
6. Results, with a comparison table
7. Plan details and the Aria callback

Everything runs on mocked sample data (`data/sample.ts` and `data/catalog.ts`). Nothing calls a real service, places a call or sends a text. The research and the fix plan are in [`docs/audit.md`](docs/audit.md).

## How this design differs from the bright one-pager revamp

| Area | Enterprise revamp |
| --- | --- |
| Layout | A quote workspace: steps in the main column and a sticky **Your quote** summary on large screens that fills in as you go, with a callback button and Start over. |
| Header | A navy utility bar (secure, US-only, ENG/ESP) above a white app bar with a step tracker on desktop and a "Step x of y" label with a progress bar on phones. |
| Visual language | Geist type, a crisp azure primary (#135DF0) on cool gray canvas, navy accents, thin borders, 8 to 16px radii and subtle shadows. Service colors stay bright for recognition. |
| Step 1 | Compact service rows with checkboxes and bundle options with radio indicators, in one selection panel with a footer action bar. |
| Results | Top 3 picks as cards, then a real comparison `<table>` (caption, column and row headers) on tablet and desktop with all-in price, price after promo, contract and actions per row. Phones keep cards. |
| Trust | Three trust cards (independent comparison, all-in pricing, quick answers). No invented ratings, stats or testimonials. |

## Run it

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build`, then `npm start` | Production build and server |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run contrast` | Checks every text color pair in `lib/tokens.ts` against WCAG AA |
| `npm run verify:data` | Checks the price math, label rules, sort order, fallback notices and "Why this plan" text for every plan, in English and Spanish, for home and business |
| `npm run check` | All of the above, then a production build |

## Deploy to Vercel

1. Push this folder to a new GitHub repository.
2. Open https://vercel.com/new and import the repository. If the repository contains other folders, set **Root Directory** to `assuredsaving-enterprise`.
3. Keep the defaults (Next.js). No environment variables are needed.
4. Click **Deploy**.

Next.js is on 15.5.29 and React on 19.1.10, so the Vercel check for CVE-2025-66478 passes.

## UX fixes

| Problem in the current one-pager | Fix |
| --- | --- |
| The same plans appear in "Top picks" and again in "All bundles" | Top picks are ranks 1 to 3. "See all" lists only the rest. A carrier filter shows one list. Each plan appears once. |
| Hand-written plan notes drift from the numbers ("$15/mo savings" next to "$14.98") | "Why this plan" is generated from each plan's own fields. A script checks every plan. |
| Hard-coded BEST VALUE, PREMIUM and ALSO CONSIDER labels | Computed labels: **Most Affordable**, **Best Value** and **Fastest**, each on one plan at most, with the rules shown on the page. No "Premium" or "Most Popular" claims. |
| Ranks shown out of order (#1, #3, #2) | Rank is the position in the all-in price sort. |
| Headline price leaves out the Broadcast TV fee | The all-in monthly price (plan + required fees − promo) is big. The price after the promo is shown at the same size. The fee breakdown is in Details. |
| "Save $X vs separate" shown without knowing your bill | Savings appear only after you enter your bill in "Compare with my bill". |
| Fixed "96% Reliability" bar | Removed. Each plan has a plain technology note instead (fiber, cable, 5G, DSL, satellite lag and weather, data caps). |
| Home wording on business addresses, and business-only usage tiles for everyone | Home and business each get their own usage tiles and plan wording. Static IP and support details show for business. |
| "Call for pricing" with no explanation | A dedicated card explains why there's no price and offers "Get a quote". These plans are listed last and earn no labels. |
| A requested bundle silently downgraded | A clear notice says what's missing and what is shown instead. |
| Consent implied by a dense paragraph, and "8AM–9PM" doesn't match calling hours | The callback runs in steps: details, consent (AI-call box **unchecked**, optional SMS consent separate), phone verification (mocked), then call now or schedule. Times are limited to Mon to Sat, 9 AM to 8 PM in the chosen time zone. Errors are inline, and a do-not-call state offers a support route. |
| Tiny, letter-spaced, low-contrast text | Light theme, bigger type, and AA-checked colors. |
| A real person's name and email pre-filled | The fields start empty. |
| Visitor has to know whether their address is home or business | Detected automatically: each suggestion carries its type, shown as a label on the "Address found" card. There is no manual switch. |
| Sponsored ad slot during the scan | Removed. |

## Design system

- **Tokens:** everything lives in `lib/tokens.ts`: colors (an electric-violet primary, plus blue, coral, violet, mint and sunny yellow, one per service), type scale, an 8px grid, radius, shadows and motion. `layout.tsx` writes them as CSS variables.
- **Fonts:** Bricolage Grotesque for display and Inter for body, through next/font.
- **Components:** in `components/ui`: Button, Input, Select, Checkbox, SegmentedControl, Badge, Chip, Slider, Skeleton, EmptyState, Modal, Drawer and Toast. PlanCard is in `components/sections`.
- **Motion:** the hero uses CSS (tile pop, rise). The later sections load on demand with Framer Motion. All motion respects `prefers-reduced-motion`.
- **ENG/ESP:** a dictionary toggle in `lib/i18n.ts`.

## Demo tips

### Address flow

The address flow is the same as the original one-pager (`wastecopilot/assuredsaving`, `getAddressSuggestions` and `AddressVerification`), ported into `lib/address.ts` and `components/sections/Steps.tsx`:

1. Enter your name. The address search appears once the name is valid.
2. Type any part of an address. The five fixed sample addresses match first. If fewer than 3 match, suggestions are built from what you typed, using the same five sample locations. A bare house number such as `658` goes in front of the sample street.
3. Each suggestion carries its own type, **residential** or **business**. Typed text with words like Suite, Floor, Office, Plaza, Center, Commerce or Business is always business.
4. Picking a suggestion (click, or Enter for the first one) verifies it, shows the "Address found" card with the detected type, and unlocks the next section straight away.
5. Editing or clearing a verified address folds the sections below it back up.

This is mocked, with no real lookup. A live site would get the address and its type from an address service.

Try `658`, `Fannin` or `500 Main St Suite 200`. Choose **Internet + TV + Mobile** to see the "bundle not available" notice.

In the callback:
- Any 6-digit code verifies, and `000000` shows the wrong-code message.
- A mobile number ending in `0000` shows the do-not-call message.
