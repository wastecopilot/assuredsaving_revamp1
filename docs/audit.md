## Original audit (one-pager revamp)

## Sources studied

| Input | What it actually is | How it was used |
| --- | --- | --- |
| `reference-ui/` (14 screenshots) | The current live product flow on assuredsaving.com: landing, services, name and address, address found plus usage, TV preferences, the loading agent, results, the plan details dialog and the "Schedule AI Callback" dialog. | Current UX and its weak points. The screenshots contain one real person's name, email and phone number. Those details are not reproduced anywhere. |
| `assuredsaving-onepager/` in this folder | **Not the original one-pager.** It is a bright step-by-step rebuild I made in an earlier task in this session. | Read as a previous attempt only. Its structure (steps swapped in place) is not the structure asked for here. |
| `../assuredsaving one pager/` (Next.js 14 code, git commit "complete one-page assured saving app…") | **The real existing one-pager**, the code behind https://assuredsaving.vercel.app/. | **Source of truth** for sections, order, content and flow. All 19 source files were read. |
| `assuredsaving_uiux_refined` | Not found under that exact name. The match is `assuredsaving uiux refined/`: 57 AI-generated concept images. | Extra visual reference only. Taken from it: bright light canvases, one colour per service, chunky rounded tiles, gradient bundle chips, a live-agent loader with named stages, and top-pick cards. Rejected: dark neon, fake stats, metallic cards and 3D clay. |
| https://assuredsaving.vercel.app/ | Live one-pager. | Captured with Playwright (Chromium, scratch folder) at 1440px and 390px. Only service tiles and Continue were pressed. Its content matches the code. |
| https://www.assuredsaving.com/ | Live product. | Studied read-only at 1440px and 390px, plus its footer and legal pages. No name, phone or email was typed and nothing was submitted. |

## The one-pager: sections in order

The page never navigates. Each section unlocks below the previous one and the page scrolls to it. A sticky header shows: Back, a progress line, the visitor's name pill, the step label (INTENT, NAME & ADDRESS, USAGE, TV SETUP, LIVE SCAN, RESULTS), ENG/ESP, US ONLY and the STEP number.

| # | Section (`id`) | Content |
| --- | --- | --- |
| 1 | Hero / Intent (`section-intent`) | Pill with "ASSURED SAVING" and ENG/ESP. Wordmark "Assured / Saving" with a sparkle. "Let's Get the / Right Deal". "SELECT THE SERVICES YOU ARE LOOKING FOR". "Select Individual Service or The bundle by selecting the combination". Tiles: Internet, TV, Mobile, Security, Home Phone. Presets: Internet + TV, Internet + TV + Phone, Internet + TV + Mobile, Quad Play. "BUNDLE MODE" chip. CONTINUE. Trust · Transparency · Speed. The price disclaimer. |
| 2 | Name & address (`section-address`) | "STEP 2", "Please enter your full name.", a welcome card, the name field, "NOW, YOUR ADDRESS", "What's your address?", "We'll check which providers serve your exact address.", "Search USA address...". Suggestions: 5 static addresses plus synthesized matches. An "ADDRESS FOUND" card with a street-view illustration and a RESIDENTIAL/BUSINESS tag, then "YOUR ADDRESS". |
| 3 | Usage (`section-usage`) | "How do you use the internet?", "Select all that apply". Office Operations (Email, cloud apps, VoIP), Media & Streaming (Video conf, presentations), Data-Heavy (Large uploads, backups), Basic Business (Web browsing, email). "CONNECTED DEVICES" slider, default 15. |
| 4 | TV setup (`section-tv`, only when TV or a bundle applies) | "Let's find your perfect bundle", "A few quick questions so we match the right channels + delivery for this address.". What do you watch most? (Entertainment, News, Sports, Lifestyle, On-demand). International channels? (Latino, South Asian, Southeast Asian, Arabic, East Asian, European). Your TVs (how many, how many smart). Do you have internet today? Yes / No. "FIND MY BUNDLE". |
| 5 | Live scan (`section-scan`) | "ASSURED SAVING AGENT — LIVE", a % orb, and 5 status lines (locating carriers, pulling inventory from 6 providers, comparing bundle savings, checking promos and Auto Pay, finalizing). A sponsored ad slot. "AVAILABLE AT YOUR ADDRESS RIGHT NOW" with carrier chips (#1 to #3). A top-pick preview with a "96% Reliability" bar. "CONFIRMING LIVE PRICES...". Restart scan. |
| 6 | Results (`section-results`) | Category badge ("INTERNET + TV BUNDLES" or "INTERNET PLANS"). "{n} bundles found for {address}". A top-match note. "OUR TOP PICKS" with BEST VALUE, ALSO CONSIDER and PREMIUM badges, ranks, price, "Call for pricing", box included, sports tags, "Save $X/mo vs separate", "Save $5/mo with Auto Pay", Details and Get This Bundle. "See all {n} plans". "Add DIRECTV to your bundle" with 5 tiers (Most Popular, "Reverts to $X/mo after the intro..."). "ALL BUNDLES ({n})" with "FILTER BY CARRIER" and "Show {n} more". A fee disclaimer with "Verified" date. "HOW WE GOT THESE RESULTS". |
| Modal | Plan details | Bundle, carrier, plan note, MONTHLY PRICE, savings lines, "BEST", internet and TV legs, WHAT IS INCLUDED, contract term, Close, Schedule Callback. |
| Modal | Schedule AI Callback | Subtitle, Aria AI notice, EMAIL ADDRESS, MOBILE PHONE, YOUR TIMEZONE, a long TCPA consent paragraph (implied consent by tapping), Call Me Now, OR SCHEDULE, "PREFERRED TIME (8AM - 9PM)", Verified / Awaiting verification, Change number, Schedule Callback, and a confirmation screen. |

## UX problems found, and the fix for each

| # | Problem | Where | Fix in the revamp |
| --- | --- | --- | --- |
| 1 | The same plans appear in "Top picks" and again in "All bundles". | Results | Top picks are ranks 1 to 3. "See all plans" shows only the rest (rank 4 and on). A carrier filter shows one combined list instead. Each plan renders once. |
| 2 | "Why this plan" and plan notes are hand-written text kept apart from the plan numbers, so they drift. The top-match note says "$15/mo in bundle savings" while the same card says "Save $14.98/mo vs separate". | Results, details | `whyThisPlan()` builds the sentence from the plan's own speed, technology, channels, price, promo, data cap and contract. A script checks every plan. |
| 3 | Labels are hard-coded. "BEST VALUE" sits on a $110 plan, "PREMIUM" on #2 and "ALSO CONSIDER" on a no-price plan. | Results | Labels are computed: **Most Affordable** (lowest all-in), **Best Value** (lowest all-in per Mbps, or per channel for TV, on a different plan) and **Fastest** (highest download, on a different plan). Each label goes to one plan at most. |
| 4 | Ranks #1, #3, #2 are shown left to right. | Results | Rank is the position in the sort shown, and the sort is named. |
| 5 | The headline price leaves out the Broadcast TV fee, which is mentioned only in a footnote. | Results, details | The headline is the all-in monthly price: plan, plus required fees and equipment, minus promo. A fee breakdown sits one click away, and the price after the promo is shown at the same size. |
| 6 | "Save $14.98/mo vs separate" and Auto Pay savings appear without knowing the visitor's bill. | Results, details | Savings appear only after the visitor enters their current bill in "Compare with my bill". |
| 7 | A fixed "96% Reliability" bar appears on the scan preview. | Live scan | Removed. Each plan has a plain-language technology note: fiber, cable, 5G, DSL, satellite lag and weather, and data caps. |
| 8 | Business addresses get home wording, and usage tiles are business-only for everyone. | Usage, results | Business and home each get their own usage tiles (home tiles come from the live product). Plan notes switch to business wording and show static IP and support where relevant. |
| 9 | Four of six plans are "Call for pricing" with no reason. | Results | A dedicated quote card says why there is no price and offers "Get a quote". These plans are listed after the priced ones. |
| 10 | A requested bundle is silently downgraded (Internet + TV + Mobile shown as Internet + TV). | Results | A clear notice names the missing service, what is shown instead, and the next step. |
| 11 | Callback consent is implied by tapping a button inside a dense paragraph. "Preferred time (8AM - 9PM)" doesn't match the calling hours (Mon to Sat, 9 AM to 8 PM). Errors are unclear. | Callback | Steps: details, consent (AI-call box **unchecked**, optional SMS box separate), verify phone (mocked code with resend timer), then call now or schedule. The picker only offers Mon to Sat, 9 AM to 8 PM in the chosen time zone. Errors are inline and specific, and the do-not-call state offers a support route. |
| 12 | Tiny letter-spaced caps, low-contrast grey on navy, weak hierarchy. | Everywhere | A light, bright theme. A 16px+ body text and a big friendly display face. Every text colour pair is AA-checked by `npm run contrast`. |
| 13 | A real person's name and email are pre-filled in the code and on the live page. | Address | The fields start empty. |
| 14 | A sponsored ad slot sits in the middle of the scan. | Live scan | Removed from the preview, because it isn't part of the user task. |
| 15 | The 5 scan stages claim "live inventory from 6 providers". | Live scan | Honest wording that describes what the page does (finding providers, checking promos and fees, ranking by all-in price). |
| 16 | A DIRECTV tier is flagged "Most Popular" with no data behind it. The intro price is big and "Reverts to…" is tiny. | DIRECTV tiers | No popularity claim. The intro price and the price after it are shown at the same size. |

## Design plan

- **Look:** a warm white canvas with soft colour glows. Primary electric violet `#5B3DF5`, with coral, sunny yellow, mint and electric blue in support. Each service owns one colour across tiles, chips and stripes. Text is dark ink on bright surfaces.
- **Type:** Bricolage Grotesque for display (big and friendly) and Inter for body, both through next/font.
- **Layout:** the same single scroll with sections unlocking in order. Each section is a large rounded "stage" card with a numbered colour badge, and a sticky header shows progress.
- **Motion:** spring pop on tiles, sections rise in, count-up on prices, and the progress bar fills. All of it respects `prefers-reduced-motion`.
