# Assured Saving: UI/UX revamp (design preview)

A redesign of the Assured Saving quote flow. Wording and selection rules follow
https://www.assuredsaving.com/; the visual design and UX are new. Everything runs on
mocked sample data: nothing calls a real service, places a call or sends a text.

## What this build follows from the official site

| Area | How |
| --- | --- |
| **Wording** | Every visible string, in English and Spanish, is copied word for word from the official site (`data/official-copy.json`: its text dictionary, component text, and the call and SMS consent text). `lib/copy-sources.ts` maps each UI key to its official source; `npm run copy` writes only the strings the app uses to `lib/copy.gen.json`. Tests fail if any string isn't official or the generated file is stale. |
| **Service selection** | Any one service on its own; combinations only Internet + TV, Internet + TV + Landline, Internet + TV + Mobile, Internet + TV + Landline + Mobile. Home Security is always alone. A service that doesn't fit replaces the selection. Removing Internet or TV also drops Landline and Mobile. Recorded from the live site and covered by 38 tests (`lib/selection.ts`). |
| **Business addresses** | Official rule: "Only Internet and Internet + TV Bundle are available for business addresses." Other selections get the official chooser. |
| **Step labels** | Only the current step's name at the top (Intent, Name & Address, Details), no step numbers. |
| **Callback** | One "Schedule AI Callback" form: Email Address, Mobile Phone with a 6-digit code, call consent (required, unticked), SMS consent (optional), Your Timezone, Preferred Time (8am - 9pm), Call Me Now or Schedule Callback. |

## Design

Flat colours only: no gradients, glows, glass or neon. A solid navy stage for step 1 and the scan,
white step cards after it, one bright blue for actions, and one solid colour per service
(Internet teal, TV red, Landline violet, Mobile amber, Home Security green). Public Sans, 8 to 16px radii,
1px borders. Every text colour pair passes WCAG AA (`npm run contrast`). 44px touch targets, visible focus,
reduced motion respected, responsive from 320px.

## Run it

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build`, then `npm start` | Production build (runs `npm run copy` first) and server |
| `npm test` | Unit and integration tests (Vitest + Testing Library) |
| `npm run copy` | Regenerates `lib/copy.gen.json` from the official copy |
| `npm run contrast` | WCAG AA check of every colour pair in `lib/tokens.ts` |
| `npm run check` | Typecheck, lint, contrast, tests, then a production build |

## How it was refined

1. **Test-driven development.** Tests were written first, then the code to pass them:
   - the official selection rules (each click sequence recorded from the live site);
   - the business-address rule;
   - "every string is official";
   - the address engine;
   - pricing and labels;
   - phone, email and calling-hours checks.
2. **Unit tests** (`tests/selection`, `copy`, `address`, `plans`, `schedule`).
3. **Integration tests** (`tests/flow.test.tsx`, `tests/callback.test.tsx`):
   - the whole page is driven like a visitor, from service selection to results, including the business chooser and the gated buttons;
   - every visible text node is checked against the official copy;
   - the callback form is covered: consent, verification binding, do-not-call, attempt limits, calling hours and time slots.
4. **Security review** by a separate reviewer, then fixes (see `docs/quality.md`).
5. **Simulated visitors.** Hundreds of randomized sessions, on phone and desktop sizes, with hostile inputs. Results are in `docs/quality.md`.

## Deploy to Vercel

Import the repository at https://vercel.com/new and keep the defaults (Next.js). No environment
variables are needed. Security headers are set in `next.config.ts`.
