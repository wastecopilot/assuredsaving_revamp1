# Quality report

How this build was checked: test-driven development, unit and integration tests, a security
review with fixes, and simulated visitors. Everything runs on mocked data, so nothing is sent anywhere.

## 1. Tests (TDD)

Each rule was written as a failing test first, then implemented until it passed.

| Suite | What it proves |
| --- | --- |
| `tests/selection.test.ts` | The official service rules. Covers 33 click sequences recorded from https://www.assuredsaving.com/, an exhaustive 5-click walk that never reaches an invalid combination, and the business-address rule. |
| `tests/copy.test.ts` | Every UI string in English and Spanish is official, word for word. Also checks that the generated copy file is current and that catalog labels point at official keys. |
| `tests/address.test.ts` | The address engine: a street number is required, there are no duplicates, business words are detected, and hostile input is handled. |
| `tests/plans.test.ts` | Price maths, sort order, labels (each given to one plan at most), every allowed selection having its own plans, and "Why This Plan" only stating numbers that are on the card. |
| `tests/schedule.test.ts` | Phone numbers (rejects international or extra digits instead of truncating), email (linear time, no control characters), names (two letters, no invisible characters), time-zone allowlist, and calling hours of 8 AM to 9 PM, Monday to Saturday. |
| `tests/flow.test.tsx` | The whole page driven like a visitor, through to results. Covers the business chooser, the gated buttons, going Back to the address and continuing, and a text audit of every visible text node. |
| `tests/callback.test.tsx` | Both consent boxes start unticked, call consent is required, do-not-call numbers are refused, the number is locked while verifying, consent resets when the number changes, wrong-code and resend limits apply, a time slot is required and resets when the time zone changes, and calling hours are enforced. |

Run them with `npm test`. `npm run check` also typechecks, lints, checks contrast and builds.

## 2. Security review and what was done

A separate reviewer acting as a penetration tester read the code and tried to break it. Each point is listed with the decision.

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | A phone could inherit "Verified" from a code check on a different number (timing race), and the do-not-call check was skipped at submit | Medium (High with a backend) | **Fixed.** Every send and verify is tied to the number it started for. The field locks while busy. Submit requires the verified number to match and re-checks do-not-call. Tested. |
| 2 | No security headers, so the consent form could be framed (clickjacking) | Medium | **Fixed** in `next.config.ts`: CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, COOP, and no `X-Powered-By`. |
| 3 | Calling hours were not enforced for "Call Me Now" | Medium | **Fixed** in the browser: outside 8 AM to 9 PM (Mon to Sat) in the chosen zone, "Call Me Now" asks for a preferred time. State-specific windows (for example Florida's 8 PM) and the server-side dial-time check are **for the backend**. |
| 4 | International or mistyped numbers were truncated into a different US number | Medium | **Fixed.** Numbers must be exactly 10 digits, or 11 starting with 1. Impossible area codes and exchanges are rejected. |
| 5 | A stale or hidden time slot could be submitted after changing the time zone | Low-Medium | **Fixed.** Changing the zone clears the day and time, and submit re-checks the slot against fresh times. |
| 6 | Resend cooldown was cosmetic and wrong codes were unlimited | Low (High with SMS) | **Fixed** in the UI: a 30 s cooldown per number (which survives "Change number"), at most 3 codes per number, and at most 5 wrong codes, using the official error text. Server rate limits and bot protection are **for the backend**. |
| 7 | The do-not-call message could be used to look up whether a number opted out | Backend | **Noted.** It's the official text. With a real list, show it only after verification and rate-limit. |
| 8 | Address type and time zone are decided in the browser | Backend | **Noted.** A future API must re-derive them server-side. |
| 9 | Consent should be bound to the number it was given for | Backend | **Fixed** in the UI: consent resets when the verified number changes. Storing consent records (text hash, time, number) is **for the backend**. |
| 10 | Spellcheck can send names and addresses to cloud services | Low | **Fixed.** `spellCheck={false}` on the name, address and email fields. |
| 11 | Invisible and bidi-control characters were accepted in names | Low | **Fixed.** Text is cleaned, and a name needs two letters. |
| 12 | The email regex was quadratic on hostile input | Low | **Fixed.** It is now linear with length limits, and tested at 100k characters in under 50 ms. |
| 13 | `X-Powered-By` header | Low | **Fixed** (`poweredByHeader: false`). |
| 14 | No error boundary; a bad time zone crashed the page | Low | **Fixed.** Added `app/error.tsx` with the official "Try again" and "Start a new search", and a time-zone allowlist. |
| 15 | Dependency advisories | Info | **Fixed** for development tools (Vitest 5, audit fixes). One remains: postcss bundled inside Next.js, build-time only, and its fix needs Next 16. |
| 16 | No tests for the callback form | Info | **Fixed.** Added `tests/callback.test.tsx` (10 tests). |
| 17 | Sample addresses look real | Info | **Kept.** They are the original one-pager's sample addresses. |

## 3. Simulated visitors

`scripts/simulate.cjs` (Playwright, run against the production build: `node scripts/simulate.cjs 300 4 777`). Each visitor:
- uses a random phone, tablet or desktop size, and random reduced motion;
- sometimes switches language;
- clicks services and bundles at random, checking after every click that the selection is an official combination;
- types a random name (including 1 letter, HTML, a 200-character string, apostrophes and accents);
- types a random address (including no street number, script tags, 300 characters, Unicode and right-to-left control characters);
- picks a suggestion by click or keyboard, and handles the business chooser;
- picks usage tiles and moves the slider, sometimes pressing Back;
- answers the TV questions;
- sometimes restarts mid-scan;
- checks the results heading and plan cards, and that the page has no horizontal overflow;
- opens and closes details;
- tries the callback with empty, invalid and valid values, wrong codes and do-not-call numbers.

What the runs found, and what changed:

| Run | Result | Fixes |
| --- | --- | --- |
| Pilot, 24 visitors | Long unbroken names and addresses widened the page on phones. | Long text now wraps everywhere; header chips truncate. |
| 300 visitors | No invalid selections. Screen-reader-only labels in the header chip bar escaped its clipping and widened phone pages. Long addresses squeezed the "Address Found" card. Most other errors were test-harness issues (Playwright's eval blocked by our new CSP, an ambiguous "Back" selector). | The chip bar became a positioning context. The address is clamped to two lines and the badge wraps. The harness was fixed. |
| 300 visitors | 0 page errors, 0 overflow, 0 invalid selections. 6 sessions got stuck after pressing **Back** from usage: the address step had no way forward once an address was chosen. | Added the official "Continue" button on a verified address. Integration test added. |
| 300 visitors | 10 sessions stalled. On tablets the address-type badge in the header chip bar overlapped the services. | Badge shows its icon only below desktop width, and the address chip clips. |
| 300 visitors, lighter load | 12 sessions stalled, all at business addresses that started with a service other than Internet. **Bug:** after choosing "Internet" in the business chooser, the next step was computed from the old selection, so usage was skipped and the scan started. A related bug: moving focus to the next step's heading could take focus away from a field the visitor was already typing in, and those keystrokes were lost. | The next step is now computed from the new selection, and focus never moves away from a field being typed in. An integration test for each. |
| **300 visitors (final)** | **0 problems.** 300 of 300 reached the address step, 252 the usage step, 116 the TV step and 284 the results. The other 16 restarted mid-scan on purpose. 163 business choosers, 49 official "US addresses only" errors on bad input, and 181 callback attempts blocked by validation. No callback succeeded because the run happened outside calling hours and the simulation doesn't pick a time; the success path is covered by `tests/callback.test.tsx`. Every one of the 300 selections was an official combination. | |
