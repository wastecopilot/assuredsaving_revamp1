/**
 * Where every UI string comes from: word for word from
 * https://www.assuredsaving.com/ (see data/official-copy.json).
 * Used at build time (scripts/build-copy.ts) and in tests, never in the browser:
 * the app reads only the resolved strings in lib/copy.gen.json via lib/i18n.ts.
 *
 * Each key points at its official source:
 *   d:<path>   the site's text dictionary (en/es)
 *   i:<text>   an inline string from the site's components (en text; es is its pair)
 *   c:<name>   the site's call or SMS consent text
 *   x:<name>   a sentence the site builds around a plan name
 *   n:<slug>   a footer link title
 * A trailing "~" strips the decoration the site adds (a leading emoji or arrow).
 * tests/copy.test.ts checks that every key resolves to official text.
 */
import official from "@/data/official-copy.json";

export type Lang = "en" | "es";

export const SOURCES = {
  /* Brand and shell */
  brand: "d:hero.badge",
  back: "d:common.back",
  startOver: "d:menu.startOver",
  usOnly: "d:location.usOnly",
  scheduleCallback: "d:results.shell.scheduleCallback",
  footerNav: "d:menu.footerNav",
  aboutUs: "d:menu.groups.about",
  help: "d:menu.groups.help",
  legal: "d:menu.groups.legal",
  newTab: "d:menu.newTab",
  disclaimer: "d:menu.disclaimer",
  close: "i:Close",
  stage_intent: "d:common.stepLabels.intent",
  stage_address: "d:common.stepLabels.nameAddress",
  stage_details: "d:common.stepLabels.details",
  nav_advertiser: "n:advertiser-disclosure",
  nav_aria: "n:ai-assistant",
  nav_pricing: "n:pricing-and-availability",
  nav_contact: "n:contact",
  nav_accessibility: "n:accessibility",
  nav_privacyChoices: "n:privacy-choices",
  nav_terms: "n:terms-of-use",
  nav_privacy: "n:privacy-policy",
  nav_consent: "n:communications-consent",
  nav_sms: "n:sms-terms",
  nav_dnc: "n:do-not-call-policy",
  nav_legal: "n:legal",

  /* Services */
  svc_internet: "d:hero.serviceStripInternet",
  svc_tv: "d:hero.serviceStripTV",
  svc_phone: "d:hero.serviceStripLandline",
  svc_mobile: "d:hero.serviceStripMobile",
  svc_security: "d:hero.serviceStripSecurity",
  preset_internet_tv: "d:intent.services.bundle",
  preset_internet_tv_phone: "d:intent.services.classicTriplePlay",
  preset_internet_tv_mobile: "d:intent.services.triplePlay",
  preset_quad: "d:intent.services.quadPlay",
  vertical_internet: "d:results.shell.verticalLabelInternet",
  vertical_tv: "d:results.shell.verticalLabelTv",
  vertical_mobile: "d:results.shell.verticalLabelMobile",
  vertical_security: "d:results.shell.verticalLabelSecurity",
  vertical_phone: "d:results.shell.verticalLabelPhone",
  vertical_bundle: "d:results.shell.verticalLabelBundle",
  vertical_triple: "d:results.shell.verticalLabelTriplePlay",
  vertical_classicTriple: "d:intent.services.classicTriplePlay",
  vertical_quad: "d:results.shell.verticalLabelQuadPlay",

  /* Step 1 */
  intentTitle1: "d:intent.title1",
  intentTitle2: "d:intent.title2",
  serviceLabel: "d:intent.serviceLabel",
  multiSelectHint: "d:intent.multiSelectHint",
  continue: "d:intent.continueCta",
  pickServiceHint: "d:hero.pickServiceHint",
  smartMatch: "d:hero.smartMatch",
  heroDescription: "d:hero.description",
  trust: "d:hero.footer1",
  transparency: "d:hero.footer2",
  speed: "d:hero.footer3",

  /* Name and address */
  nameTitle: "d:name.title",
  namePlaceholder: "d:name.placeholder",
  welcome: "d:results.welcomeGoogleCard",
  nowYourAddress: "d:location.nowYourAddress",
  addrTitle1: "d:location.title1",
  addrTitle2: "d:location.title2",
  addrSubtitle: "d:location.subtitle",
  addrPlaceholder: "d:location.placeholder",
  addrSearchLabel: "d:hero.addressSearchLabel",
  usError: "d:location.usError",
  addressFound: "d:location.addressFound",
  yourAddress: "d:location.yourAddress",
  verified: "d:location.verified",
  tryDifferentAddress: "d:location.tryDifferentAddress~",
  businessAddress: "d:location.businessAddress",
  homeAddress: "d:location.homeAddress",
  businessOnlyTitle: "d:location.businessOnlyTitle",
  businessOnlyBody: "d:location.businessOnlyBody",
  businessOptionInternet: "d:location.businessOptionInternet",
  businessOptionBundle: "d:location.businessOptionBundle",
  checkingCoverage: "d:location.checkingCoverage",

  /* Usage */
  usageTitle: "d:usage.title",
  usageTitleHighlight: "d:usage.titleHighlight",
  selectAll: "d:usage.selectAll",
  devices: "d:usage.devices",
  hundredPlus: "d:usage.hundredPlus",
  usageCta: "d:usage.ctaReady",
  usageCtaWaiting: "d:usage.ctaWaiting",
  usageCtaTv: "d:usage.ctaTV",
  "usage.casual": "d:usage.casual",
  "usage.casualDesc": "d:usage.casualDesc",
  "usage.work": "d:usage.work",
  "usage.workDesc": "d:usage.workDesc",
  "usage.streaming": "d:usage.streaming",
  "usage.streamingDesc": "d:usage.streamingDesc",
  "usage.gaming": "d:usage.gaming",
  "usage.gamingDesc": "d:usage.gamingDesc",
  "usage.businessWork": "d:usage.businessWork",
  "usage.businessWorkDesc": "d:usage.businessWorkDesc",
  "usage.businessStreaming": "d:usage.businessStreaming",
  "usage.businessStreamingDesc": "d:usage.businessStreamingDesc",
  "usage.businessGaming": "d:usage.businessGaming",
  "usage.businessGamingDesc": "d:usage.businessGamingDesc",
  "usage.businessCasual": "d:usage.businessCasual",
  "usage.businessCasualDesc": "d:usage.businessCasualDesc",

  /* TV */
  tvTitlePrefix: "d:tvNeeds.titlePrefix",
  tvTitleBundle: "d:tvNeeds.titleBundle",
  tvTitleTv: "d:tvNeeds.titleTv",
  tvSubtitle: "d:tvNeeds.subtitle",
  watchMost: "d:tvNeeds.watchMost",
  "genre.entertainment": "d:tvNeeds.categories.entertainment",
  "genre.news": "d:tvNeeds.categories.news",
  "genre.sports": "d:tvNeeds.categories.sports",
  "genre.lifestyle": "d:tvNeeds.categories.lifestyle",
  "genre.onDemand": "d:tvNeeds.categories.on_demand",
  international: "d:tvNeeds.international",
  internationalHint: "d:tvNeeds.internationalHint",
  "intl.latino": "d:tvNeeds.intl.latino",
  "intl.southAsian": "d:tvNeeds.intl.south_asian",
  "intl.southeastAsian": "d:tvNeeds.intl.southeast_asian",
  "intl.arabic": "d:tvNeeds.intl.arabic",
  "intl.eastAsian": "d:tvNeeds.intl.east_asian",
  "intl.european": "d:tvNeeds.intl.european",
  yourTvs: "d:tvNeeds.yourTvs",
  howManyTvs: "d:tvNeeds.howManyTvs",
  howManySmart: "d:tvNeeds.howManySmart",
  nonSmartOne: "d:tvNeeds.nonSmartOne",
  nonSmartMany: "d:tvNeeds.nonSmartMany",
  haveInternetBundle: "d:tvNeeds.haveInternetBundle",
  haveInternet: "d:tvNeeds.haveInternet",
  bundleInternetNote: "d:tvNeeds.bundleInternetNote",
  yes: "d:tvNeeds.yes",
  no: "d:tvNeeds.no",
  ctaBundle: "d:tvNeeds.ctaBundle",
  ctaTv: "d:tvNeeds.ctaTv",
  answerToContinue: "d:tvNeeds.answerToContinue",

  /* Live scan */
  agentLive: "d:thinking.heading",
  status0: "d:thinking.status.0",
  status1: "d:thinking.status.1",
  status2: "d:thinking.status.2",
  status3: "d:thinking.status.3",
  status4: "d:thinking.status.4",
  availableNow: "d:thinking.instant.title",
  scanSubtitle: "d:thinking.instant.subtitleNoPrices",
  confirming: "d:thinking.instant.confirming",
  priceFooter: "d:thinking.instant.footer",

  /* Results */
  topMatch: "d:thinking.instant.topPick",
  ourTopPick: "d:results.ourTopPick",
  alsoGreat: "d:results.alsoGreat",
  label_mostAffordable: "d:results.tv.categoryCheapest",
  label_bestValue: "d:results.tv.categoryBestPick",
  label_fastest: "d:results.fastest",
  monthly: "d:results.monthly",
  perMo: "d:thinking.instant.perMo",
  reg: "d:thinking.instant.reg",
  downloadSpeed: "d:results.downloadSpeed",
  uploadSpeed: "d:results.compareDrawerUploadSpeed",
  whyThisPlan: "d:results.whyThisPlan",
  currentPromotion: "d:results.currentPromotion",
  callForPricing: "d:results.callForPricing",
  callForPricingCta: "d:results.callForPricingCta",
  callForPricingBusinessCta: "d:results.callForPricingBusinessCta",
  getStarted: "d:results.getStarted",
  whatsIncluded: "d:results.whatsIncluded",
  noContract: "d:results.noContract",
  contractMonths: "d:results.contractMonths",
  contractTerm: "i:Contract term",
  quickComparison: "d:results.quickComparison",
  provider: "d:results.provider",
  technology: "d:results.technology",
  download: "d:results.download",
  price: "d:results.price",
  promotion: "d:results.promotion",
  bestFor: "d:results.bestFor",
  bestForFiber: "d:results.bestForFiber",
  bestForCable: "d:results.bestForCable",
  bestFor5g: "d:results.bestFor5g",
  bestForOther: "d:results.bestForOther",
  otherPlans: "d:results.otherPlans",
  businessPlansHeading: "d:results.businessPlansHeading",
  businessPlansBadge: "d:results.businessPlansBadge",
  allPlansNudge: "d:results.shell.allPlansNudge",
  showLess: "d:results.showLess",
  filter: "d:results.filter",
  all: "d:results.all",
  showDetails: "d:results.showDetails",
  hideDetails: "d:results.hideDetails",
  plansAvailable: "d:results.plansAvailable",
  planAvailable: "d:results.planAvailable",
  advantage: "d:results.advantage",
  advantageDesc: "d:results.advantageDesc",
  emptyHeadline: "d:results.shell.emptyHeadline",
  emptyStartOver: "d:results.shell.emptyStartOver",
  reasonSuitsMost: "d:results.reasonSuitsMost",
  reasonCheaperThanTop: "d:results.reasonCheaperThanTop",
  reasonMoreExpensive: "d:results.reasonMoreExpensive",
  reasonMatchesTop: "d:results.reasonMatchesTop",
  reasonFasterDownloads: "d:results.reasonFasterDownloads",
  reasonDifferentTech: "d:results.reasonDifferentTech",
  reasonAlsoDelivers: "d:results.reasonAlsoDelivers",
  directvTitle: "d:results.bundle.directvAspirationalTitle",
  directvSubtitle: "d:results.bundle.directvAspirationalSubtitle",
  directvTiers: "d:results.bundle.directvStreamTiersLabel",
  channelsSuffix: "d:results.bundle.directvAspirationalChannelsSuffix",
  tech_fiber: "d:currentPlan.tech.fiber",
  tech_cable: "d:currentPlan.tech.cable",
  tech_fiveG: "d:currentPlan.tech.fiveG",
  tech_satellite: "d:currentPlan.tech.satellite",
  tech_streaming: "d:results.tv.streaming",
  tech_dsl: "d:results.broadband",
  tech_voip: "d:results.digitalVoice",
  tech_landline: "d:phone.homePhone",
  tech_wireless: "d:currentPlan.tech.fiveG",
  tech_monitored: "d:results.shell.verticalLabelSecurity",

  /* Callback */
  cbTitle: "i:Schedule AI Callback",
  cbDesc: "x:callbackDesc",
  cbAria: "i:An AI assistant named Aria will call you. You can ask to speak with a human at any time.",
  cbEmail: "i:Email Address",
  cbPhone: "i:Mobile Phone",
  cbEmailErr: "i:Enter a valid email address",
  cbPhoneErr: "i:Enter a valid US phone number",
  cbPhoneFirst: "i:Enter your phone first",
  cbOptional: "i:(Optional)",
  cbConsentCall: "c:call",
  cbConsentSms: "c:sms",
  cbConsentErrNow: "i:Tick the consent box above to get the call",
  cbConsentErrSchedule: "i:Tick the consent box to schedule the call",
  cbCompleteFirst: "i:Complete phone and preferred time to continue",
  cbAgreeA: "i:By tapping a call button, you agree to our ~",
  cbAgreeB: "i: and acknowledge our ~",
  cbTimezone: "i:Your Timezone",
  cbPreferredTime: "i:Preferred Time (8am - 9pm)",
  cbCallNow: "i:📞 Call Me Now~",
  cbSchedule: "i:📞 Schedule Callback~",
  cbOrSchedule: "i:or schedule",
  cbDnc: "i:This phone number previously asked us not to call it, so we can't schedule a callback to that number. Use a different number, or contact support to opt back in.",
  cbSendCode: "d:results.shell.otpSendCode",
  cbSending: "d:results.shell.otpSending",
  cbSentTo: "d:results.shell.otpSentTo",
  cbCodeLabel: "d:results.shell.otpCodeLabel",
  cbConfirm: "d:results.shell.otpConfirm",
  cbVerifying: "d:results.shell.otpVerifying",
  cbVerified: "d:results.shell.otpVerified",
  cbResendIn: "d:results.shell.otpResendIn",
  cbResend: "d:results.shell.otpResend",
  cbChangeNumber: "d:results.shell.otpChangeNumber",
  cbErrInvalidPhone: "d:results.shell.otpErrInvalidPhone",
  cbErrInvalidCode: "d:results.shell.otpErrInvalidCode",
  cbErrTooMany: "d:results.shell.otpErrTooMany",
  cbErrRateLimited: "d:results.shell.otpErrRateLimited",
  tryAgain: "d:results.shell.emptyTryAgain",
  cbVerifyRequired: "d:results.shell.otpVerifyRequired",
  cbDoneTitle: "d:results.shell.successTitle",
  cbDoneDesc: "d:results.shell.successDesc",
  cbCheckAnother: "d:results.shell.checkAnotherAddress",
} as const;

export type Key = keyof typeof SOURCES;
export const KEYS = Object.keys(SOURCES) as Key[];

type Tree = { [k: string]: string | Tree };
const dict = official.dict as unknown as Record<Lang, Tree>;
const inline = official.inline as Record<string, string>;
const consent = official.consent as Record<string, Record<Lang, string>>;
const composed = official.composed as unknown as Record<string, Record<Lang, string>>;
const nav = official.nav as Record<string, Record<Lang, { title: string }>>;

const strip = (s: string) => s.replace(/^(📞\s|←\s)/, "").replace(/\s→$/, "").trim();

export function resolve(lang: Lang, src: string): string {
  const clean = src.endsWith("~");
  const ref = clean ? src.slice(0, -1) : src;
  const kind = ref.slice(0, 2);
  const id = ref.slice(2);
  let out: string | undefined;
  if (kind === "d:") {
    let node: string | Tree | undefined = dict[lang];
    for (const part of id.split(".")) node = typeof node === "object" ? node[part] : undefined;
    out = typeof node === "string" ? node : undefined;
  } else if (kind === "i:") out = lang === "en" ? id : inline[id];
  else if (kind === "c:") out = consent[id]?.[lang];
  else if (kind === "x:") out = composed[id]?.[lang];
  else if (kind === "n:") out = nav[id]?.[lang]?.title;
  if (out === undefined) throw new Error(`Missing official text for ${src} (${lang})`);
  return clean ? strip(out) : out;
}

/** Every key resolved in both languages: what scripts/build-copy.ts writes to lib/copy.gen.json. */
export function resolveAll(): Record<Lang, Record<Key, string>> {
  const out = { en: {}, es: {} } as Record<Lang, Record<Key, string>>;
  for (const lang of ["en", "es"] as const) for (const k of Object.keys(SOURCES) as Key[]) out[lang][k] = resolve(lang, SOURCES[k]);
  return out;
}
