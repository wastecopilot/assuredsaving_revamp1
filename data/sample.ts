/**
 * ============================================================================
 *  SAMPLE DATA · DESIGN PREVIEW ONLY
 * ============================================================================
 *  Every address, plan, price, fee, speed and tier here is illustrative sample
 *  data for the design preview. Nothing is a live offer. Provider names are
 *  plain text only. All money values are in cents.
 * ============================================================================
 */

import { T, type ServiceId, type Tech, type Text } from "./catalog";

/** The small catalog (services, presets, addresses, options) lives in catalog.ts so the first screen does not load every plan. */
export * from "./catalog";

/* ------------------------------------------------------------------ */
/*  Plans                                                              */
/* ------------------------------------------------------------------ */
export interface Charge {
  label: Text;
  cents: number;
}
export type Pricing =
  | { kind: "priced"; planCents: number; promo?: { creditCents: number; months: number }; fees: Charge[]; oneTime: Charge[] }
  | { kind: "quote"; reason: Text };

export interface Plan {
  id: string;
  provider: string;
  name: string;
  services: ServiceId[];
  tech: Tech;
  orbit?: "geo" | "leo";
  downloadMbps?: number;
  /** Low end of the typical range for 5G and satellite. */
  downloadMinMbps?: number;
  uploadMbps?: number;
  dataCapGB?: number;
  channels?: number;
  lines?: number;
  pricing: Pricing;
  contractMonths: number;
  includes: Text[];
  /** Extra facts shown only for business addresses. */
  business?: { staticIp: Text; support: Text };
}

const $ = (d: number) => Math.round(d * 100);
const fee = {
  btv: (c: number): Charge => ({ label: T("Broadcast TV fee", "Cargo por TV local"), cents: $(c) }),
  rsn: (c: number): Charge => ({ label: T("Regional sports fee", "Cargo por deportes regionales"), cents: $(c) }),
  box: (c: number): Charge => ({ label: T("TV box, first TV", "Decodificador, primer TV"), cents: $(c) }),
  gateway: (c: number): Charge => ({ label: T("Wi-Fi gateway rental", "Alquiler de módem Wi-Fi"), cents: $(c) }),
  modem: (c: number): Charge => ({ label: T("Modem rental", "Alquiler de módem"), cents: $(c) }),
  dish: (c: number): Charge => ({ label: T("Satellite equipment lease", "Alquiler de equipo satelital"), cents: $(c) }),
  line: (c: number): Charge => ({ label: T("Phone line fee", "Cargo de línea telefónica"), cents: $(c) }),
};
const install = (c: number, en = "Installation", es = "Instalación"): Charge => ({ label: T(en, es), cents: $(c) });
const NO_CONTRACT = T("No annual contract", "Sin contrato anual");
const BIZ_CABLE = { staticIp: T("Static IP available for $20/mo", "IP fija disponible por $20/mes"), support: T("24/7 business support line", "Soporte para negocios 24/7") };
const BIZ_FIBER = { staticIp: T("1 static IP included", "1 IP fija incluida"), support: T("24/7 business technical support", "Soporte técnico para negocios 24/7") };
const BIZ_5G = { staticIp: T("Static IP not available", "IP fija no disponible"), support: T("Business support, 7 days a week", "Soporte para negocios, 7 días") };

export const PLANS: Plan[] = [
  /* ---------- Internet ---------- */
  { id: "att-1g", provider: "AT&T", name: "Fiber 1 GIG", services: ["internet"], tech: "fiber", downloadMbps: 1000, uploadMbps: 1000, pricing: { kind: "priced", planCents: $(80), fees: [], oneTime: [install(0)] }, contractMonths: 0, includes: [T("Wi-Fi 7 gateway included", "Módem Wi-Fi 7 incluido"), T("No data cap", "Sin límite de datos"), NO_CONTRACT], business: BIZ_FIBER },
  { id: "att-300", provider: "AT&T", name: "Fiber 300", services: ["internet"], tech: "fiber", downloadMbps: 300, uploadMbps: 300, pricing: { kind: "priced", planCents: $(55), fees: [], oneTime: [install(0)] }, contractMonths: 0, includes: [T("Wi-Fi gateway included", "Módem Wi-Fi incluido"), T("No data cap", "Sin límite de datos"), NO_CONTRACT], business: BIZ_FIBER },
  { id: "spec-500", provider: "Spectrum", name: "Internet Premier", services: ["internet"], tech: "cable", downloadMbps: 500, uploadMbps: 20, pricing: { kind: "priced", planCents: $(80), promo: { creditCents: $(30), months: 12 }, fees: [], oneTime: [install(0, "Self-install kit", "Kit de autoinstalación")] }, contractMonths: 0, includes: [T("Modem included", "Módem incluido"), T("No data cap", "Sin límite de datos"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "xf-400", provider: "Xfinity", name: "Connect More 400", services: ["internet"], tech: "cable", downloadMbps: 400, uploadMbps: 20, dataCapGB: 1200, pricing: { kind: "priced", planCents: $(70), promo: { creditCents: $(30), months: 12 }, fees: [fee.gateway(15)], oneTime: [install(0, "Self-install kit", "Kit de autoinstalación")] }, contractMonths: 0, includes: [T("1.2 TB monthly data", "1.2 TB de datos al mes"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "tm-5g", provider: "T-Mobile", name: "5G Home Internet", services: ["internet"], tech: "fiveG", downloadMinMbps: 133, downloadMbps: 415, uploadMbps: 55, pricing: { kind: "priced", planCents: $(60), fees: [], oneTime: [] }, contractMonths: 0, includes: [T("5G gateway included", "Módem 5G incluido"), T("Self-setup in minutes", "Instalación propia en minutos"), NO_CONTRACT], business: BIZ_5G },
  { id: "ctl-dsl", provider: "CenturyLink", name: "Simply Internet", services: ["internet"], tech: "dsl", downloadMbps: 40, uploadMbps: 5, pricing: { kind: "priced", planCents: $(55), fees: [fee.modem(15)], oneTime: [install(0, "Self-install kit", "Kit de autoinstalación")] }, contractMonths: 0, includes: [T("No data cap", "Sin límite de datos"), T("Price stays the same", "El precio no cambia"), NO_CONTRACT] },
  { id: "hughes", provider: "HughesNet", name: "Select", services: ["internet"], tech: "satellite", orbit: "geo", downloadMbps: 50, uploadMbps: 5, dataCapGB: 100, pricing: { kind: "priced", planCents: $(75), promo: { creditCents: $(25), months: 12 }, fees: [fee.dish(14.99)], oneTime: [install(0, "Professional installation", "Instalación profesional")] }, contractMonths: 24, includes: [T("100 GB priority data each month", "100 GB de datos prioritarios al mes"), T("Professional installation", "Instalación profesional")] },
  { id: "viasat", provider: "Viasat", name: "Unleashed", services: ["internet"], tech: "satellite", orbit: "geo", downloadMinMbps: 25, downloadMbps: 100, uploadMbps: 3, pricing: { kind: "quote", reason: T("Viasat sets this price by satellite beam, based on free capacity over your address, so it's confirmed by phone.", "Viasat fija este precio según el haz satelital y la capacidad libre sobre tu dirección, así que se confirma por teléfono.") }, contractMonths: 0, includes: [T("Professional installation", "Instalación profesional")] },

  /* ---------- Internet + TV ---------- */
  { id: "spec-it", provider: "Spectrum", name: "Internet Premier + TV Select", services: ["internet", "tv"], tech: "cable", downloadMbps: 500, uploadMbps: 20, channels: 125, pricing: { kind: "priced", planCents: $(145), promo: { creditCents: $(45), months: 12 }, fees: [fee.btv(24.99), fee.box(11.99)], oneTime: [install(0, "Self-install kit", "Kit de autoinstalación")] }, contractMonths: 0, includes: [T("125+ channels with locals", "Más de 125 canales con locales"), T("Spectrum TV app", "App Spectrum TV"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "spec-git", provider: "Spectrum", name: "Internet Gig + TV Select", services: ["internet", "tv"], tech: "cable", downloadMbps: 1000, uploadMbps: 35, channels: 125, pricing: { kind: "priced", planCents: $(175), promo: { creditCents: $(45), months: 12 }, fees: [fee.btv(24.99), fee.box(11.99)], oneTime: [install(0, "Self-install kit", "Kit de autoinstalación")] }, contractMonths: 0, includes: [T("125+ channels with locals", "Más de 125 canales con locales"), T("Advanced Wi-Fi router", "Router Wi-Fi avanzado"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "att-dtv", provider: "AT&T", name: "Fiber 300 + DIRECTV Entertainment", services: ["internet", "tv"], tech: "fiber", downloadMbps: 300, uploadMbps: 300, channels: 90, pricing: { kind: "priced", planCents: $(134.99), promo: { creditCents: $(20), months: 12 }, fees: [fee.rsn(15.49)], oneTime: [install(0)] }, contractMonths: 0, includes: [T("90+ channels with locals", "Más de 90 canales con locales"), T("Streaming device included", "Dispositivo de streaming incluido"), NO_CONTRACT], business: BIZ_FIBER },
  { id: "xf-it", provider: "Xfinity", name: "Connect More + Popular TV", services: ["internet", "tv"], tech: "cable", downloadMbps: 400, uploadMbps: 20, dataCapGB: 1200, channels: 125, pricing: { kind: "priced", planCents: $(150), promo: { creditCents: $(50), months: 12 }, fees: [fee.btv(28.25), fee.gateway(15)], oneTime: [install(0, "Self-install kit", "Kit de autoinstalación")] }, contractMonths: 0, includes: [T("125+ channels", "Más de 125 canales"), T("Xfinity Stream app", "App Xfinity Stream"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "tm-yttv", provider: "T-Mobile", name: "5G Home + YouTube TV", services: ["internet", "tv"], tech: "fiveG", downloadMinMbps: 133, downloadMbps: 415, uploadMbps: 55, channels: 100, pricing: { kind: "priced", planCents: $(142.99), promo: { creditCents: $(10), months: 3 }, fees: [], oneTime: [] }, contractMonths: 0, includes: [T("100+ live channels", "Más de 100 canales en vivo"), T("Unlimited cloud DVR", "DVR en la nube ilimitado"), NO_CONTRACT], business: BIZ_5G },
  { id: "vz-fios", provider: "Verizon", name: "Fios 1 Gig + Fios TV Test Drive", services: ["internet", "tv"], tech: "fiber", downloadMbps: 940, uploadMbps: 880, channels: 125, pricing: { kind: "quote", reason: T("Verizon checks the fiber wiring in each building before it confirms Fios TV and its price, so this one is quoted by phone.", "Verizon revisa el cableado de fibra de cada edificio antes de confirmar Fios TV y su precio, así que se cotiza por teléfono.") }, contractMonths: 0, includes: [T("Near-matching upload speed", "Subida casi igual a la bajada"), T("Fios TV app", "App Fios TV")], business: BIZ_FIBER },

  /* ---------- Internet + TV + Phone ---------- */
  { id: "spec-itp", provider: "Spectrum", name: "Internet Premier + TV Select + Voice", services: ["internet", "tv", "phone"], tech: "cable", downloadMbps: 500, uploadMbps: 20, channels: 125, pricing: { kind: "priced", planCents: $(165), promo: { creditCents: $(45), months: 12 }, fees: [fee.btv(24.99), fee.box(11.99)], oneTime: [] }, contractMonths: 0, includes: [T("Unlimited US calling", "Llamadas ilimitadas en EE. UU."), T("Keep your number", "Conserva tu número"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "xf-itp", provider: "Xfinity", name: "Connect More + Popular TV + Voice", services: ["internet", "tv", "phone"], tech: "cable", downloadMbps: 400, uploadMbps: 20, dataCapGB: 1200, channels: 125, pricing: { kind: "priced", planCents: $(180), promo: { creditCents: $(50), months: 12 }, fees: [fee.btv(28.25), fee.gateway(15)], oneTime: [] }, contractMonths: 0, includes: [T("Unlimited US calling", "Llamadas ilimitadas en EE. UU."), T("Voicemail", "Buzón de voz"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "fr-itp", provider: "Frontier", name: "Fiber 500 + DIRECTV + Home Phone", services: ["internet", "tv", "phone"], tech: "fiber", downloadMbps: 500, uploadMbps: 500, channels: 90, pricing: { kind: "priced", planCents: $(170), promo: { creditCents: $(25), months: 12 }, fees: [fee.rsn(15.49), fee.line(4.99)], oneTime: [install(0)] }, contractMonths: 0, includes: [T("Matching upload speed", "Subida igual a la bajada"), T("Unlimited calling", "Llamadas ilimitadas"), NO_CONTRACT], business: BIZ_FIBER },

  /* ---------- Internet + TV + Mobile (Triple Play) ---------- */
  { id: "spec-itm", provider: "Spectrum", name: "Internet Premier + TV Select + Unlimited Mobile", services: ["internet", "tv", "mobile"], tech: "cable", downloadMbps: 500, uploadMbps: 20, channels: 125, lines: 1, pricing: { kind: "priced", planCents: $(175), promo: { creditCents: $(45), months: 12 }, fees: [fee.btv(24.99), fee.box(11.99)], oneTime: [] }, contractMonths: 0, includes: [T("1 unlimited mobile line", "1 línea móvil ilimitada"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "xf-itm", provider: "Xfinity", name: "Connect More + Popular TV + Unlimited Mobile", services: ["internet", "tv", "mobile"], tech: "cable", downloadMbps: 400, uploadMbps: 20, dataCapGB: 1200, channels: 125, lines: 1, pricing: { kind: "priced", planCents: $(190), promo: { creditCents: $(50), months: 12 }, fees: [fee.btv(28.25), fee.gateway(15)], oneTime: [] }, contractMonths: 0, includes: [T("1 unlimited mobile line", "1 línea móvil ilimitada"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "att-itm", provider: "AT&T", name: "Fiber 1 GIG + DIRECTV Entertainment + Unlimited Starter", services: ["internet", "tv", "mobile"], tech: "fiber", downloadMbps: 1000, uploadMbps: 1000, channels: 90, lines: 1, pricing: { kind: "priced", planCents: $(210), promo: { creditCents: $(30), months: 12 }, fees: [fee.rsn(15.49)], oneTime: [] }, contractMonths: 0, includes: [T("1 unlimited mobile line", "1 línea móvil ilimitada"), NO_CONTRACT], business: BIZ_FIBER },

  /* ---------- Internet + TV + Landline + Mobile (Quad Play) ---------- */
  { id: "spec-quad", provider: "Spectrum", name: "Internet Premier + TV Select + Voice + Unlimited Mobile", services: ["internet", "tv", "phone", "mobile"], tech: "cable", downloadMbps: 500, uploadMbps: 20, channels: 125, lines: 1, pricing: { kind: "priced", planCents: $(195), promo: { creditCents: $(50), months: 12 }, fees: [fee.btv(24.99), fee.box(11.99)], oneTime: [] }, contractMonths: 0, includes: [T("Unlimited US calling", "Llamadas ilimitadas en EE. UU."), T("1 unlimited mobile line", "1 línea móvil ilimitada"), NO_CONTRACT], business: BIZ_CABLE },
  { id: "xf-quad", provider: "Xfinity", name: "Connect More + Popular TV + Voice + Unlimited Mobile", services: ["internet", "tv", "phone", "mobile"], tech: "cable", downloadMbps: 400, uploadMbps: 20, dataCapGB: 1200, channels: 125, lines: 1, pricing: { kind: "priced", planCents: $(215), promo: { creditCents: $(55), months: 12 }, fees: [fee.btv(28.25), fee.gateway(15)], oneTime: [] }, contractMonths: 0, includes: [T("Unlimited US calling", "Llamadas ilimitadas en EE. UU."), T("1 unlimited mobile line", "1 línea móvil ilimitada"), NO_CONTRACT], business: BIZ_CABLE },

  /* ---------- TV ---------- */
  { id: "dtv", provider: "DIRECTV", name: "Entertainment", services: ["tv"], tech: "satellite", channels: 75, pricing: { kind: "priced", planCents: $(89.99), promo: { creditCents: $(20), months: 12 }, fees: [fee.rsn(15.49)], oneTime: [install(0, "Professional installation", "Instalación profesional")] }, contractMonths: 24, includes: [T("75+ channels with locals", "Más de 75 canales con locales"), T("Genie DVR", "DVR Genie")] },
  { id: "dish", provider: "DISH", name: "America's Top 120", services: ["tv"], tech: "satellite", channels: 190, pricing: { kind: "priced", planCents: $(94.99), promo: { creditCents: $(15), months: 24 }, fees: [fee.box(7)], oneTime: [install(0, "Professional installation", "Instalación profesional")] }, contractMonths: 24, includes: [T("190 channels", "190 canales"), T("Price lock for 2 years", "Precio fijo por 2 años")] },
  { id: "yttv", provider: "YouTube TV", name: "Base Plan", services: ["tv"], tech: "streaming", channels: 100, pricing: { kind: "priced", planCents: $(82.99), promo: { creditCents: $(10), months: 3 }, fees: [], oneTime: [] }, contractMonths: 0, includes: [T("100+ live channels", "Más de 100 canales en vivo"), T("Unlimited cloud DVR", "DVR en la nube ilimitado"), NO_CONTRACT] },
  { id: "spec-tv", provider: "Spectrum", name: "TV Select", services: ["tv"], tech: "cable", channels: 125, pricing: { kind: "priced", planCents: $(59.99), fees: [fee.btv(24.99), fee.box(11.99)], oneTime: [] }, contractMonths: 0, includes: [T("125+ channels", "Más de 125 canales"), NO_CONTRACT] },

  /* ---------- Mobile ---------- */
  { id: "tm-ess", provider: "T-Mobile", name: "Essentials", services: ["mobile"], tech: "wireless", lines: 1, pricing: { kind: "priced", planCents: $(60), fees: [], oneTime: [] }, contractMonths: 0, includes: [T("Unlimited talk, text and data", "Llamadas, mensajes y datos ilimitados"), NO_CONTRACT] },
  { id: "vz-uw", provider: "Verizon", name: "Unlimited Welcome", services: ["mobile"], tech: "wireless", lines: 1, pricing: { kind: "priced", planCents: $(65), fees: [], oneTime: [] }, contractMonths: 0, includes: [T("Unlimited talk, text and data", "Llamadas, mensajes y datos ilimitados"), NO_CONTRACT] },
  { id: "att-us", provider: "AT&T", name: "Unlimited Starter", services: ["mobile"], tech: "wireless", lines: 1, pricing: { kind: "priced", planCents: $(65), fees: [], oneTime: [] }, contractMonths: 0, includes: [T("Unlimited talk, text and data", "Llamadas, mensajes y datos ilimitados"), NO_CONTRACT] },
  { id: "visible", provider: "Visible", name: "Visible", services: ["mobile"], tech: "wireless", lines: 1, pricing: { kind: "priced", planCents: $(25), fees: [], oneTime: [] }, contractMonths: 0, includes: [T("Taxes and fees included", "Impuestos y cargos incluidos"), NO_CONTRACT] },

  /* ---------- Security ---------- */
  { id: "adt", provider: "ADT", name: "Secure Home", services: ["security"], tech: "monitored", pricing: { kind: "priced", planCents: $(45.99), fees: [], oneTime: [install(99, "Professional installation", "Instalación profesional")] }, contractMonths: 36, includes: [T("24/7 professional monitoring", "Monitoreo profesional 24/7"), T("Mobile app", "App móvil")] },
  { id: "simplisafe", provider: "SimpliSafe", name: "Fast Protect", services: ["security"], tech: "monitored", pricing: { kind: "priced", planCents: $(31.99), fees: [], oneTime: [install(249, "Starter equipment you own", "Equipo inicial propio")] }, contractMonths: 0, includes: [T("24/7 professional monitoring", "Monitoreo profesional 24/7"), NO_CONTRACT] },
  { id: "ring", provider: "Ring", name: "Alarm Pro Plus", services: ["security"], tech: "monitored", pricing: { kind: "priced", planCents: $(20), promo: { creditCents: $(5), months: 12 }, fees: [], oneTime: [] }, contractMonths: 0, includes: [T("24/7 professional monitoring", "Monitoreo profesional 24/7"), T("Backup internet", "Internet de respaldo"), NO_CONTRACT] },

  /* ---------- Home phone ---------- */
  { id: "spec-voice", provider: "Spectrum", name: "Voice", services: ["phone"], tech: "voip", pricing: { kind: "priced", planCents: $(29.99), fees: [], oneTime: [] }, contractMonths: 0, includes: [T("Unlimited US calling", "Llamadas ilimitadas en EE. UU."), NO_CONTRACT] },
  { id: "ooma", provider: "Ooma", name: "Telo Basic", services: ["phone"], tech: "voip", pricing: { kind: "priced", planCents: $(5.99), fees: [], oneTime: [install(99, "Telo device", "Equipo Telo")] }, contractMonths: 0, includes: [T("Uses your internet", "Usa tu internet"), NO_CONTRACT] },
  { id: "fr-phone", provider: "Frontier", name: "Home Phone", services: ["phone"], tech: "landline", pricing: { kind: "priced", planCents: $(35), fees: [fee.line(4.99)], oneTime: [] }, contractMonths: 0, includes: [T("Works in a power outage", "Funciona sin electricidad"), NO_CONTRACT] },
];

/* ------------------------------------------------------------------ */
/*  DIRECTV add-on tiers (values from the one-pager)                   */
/* ------------------------------------------------------------------ */
export const DIRECTV_TIERS = [
  { id: "entertainment", name: "Entertainment", channels: 75, introCents: $(90), regularCents: $(123), months: 12, features: [T("ESPN, ESPN2, FS1", "ESPN, ESPN2, FS1"), T("Local broadcast networks", "Cadenas locales"), T("Disney Channel, Nickelodeon", "Disney Channel, Nickelodeon")] },
  { id: "choice", name: "Choice", channels: 105, introCents: $(95), regularCents: $(159), months: 12, features: [T("Everything in Entertainment", "Todo lo de Entertainment"), T("Regional sports networks", "Deportes regionales"), T("MLB Network, NBA TV, NHL Network", "MLB Network, NBA TV, NHL Network")] },
  { id: "ultimate", name: "Ultimate", channels: 140, introCents: $(125), regularCents: $(199), months: 12, features: [T("Everything in Choice", "Todo lo de Choice"), T("Golf Channel, Tennis Channel", "Golf Channel, Tennis Channel"), T("Cooking Channel, GAC", "Cooking Channel, GAC")] },
  { id: "premier", name: "Premier", channels: 185, introCents: $(170), regularCents: $(258), months: 12, features: [T("Everything in Ultimate", "Todo lo de Ultimate"), T("HBO Max included", "HBO Max incluido"), T("Showtime included", "Showtime incluido")] },
  { id: "optimo", name: "Óptimo Más", channels: 145, introCents: $(85), regularCents: $(122), months: 12, features: [T("Spanish-language package", "Paquete en español"), T("Live fútbol, béisbol, Liga MX", "Fútbol, béisbol y Liga MX en vivo"), T("Spanish networks and locals", "Cadenas en español y locales")] },
];

