/**
 * ============================================================================
 *  SAMPLE DATA · DESIGN PREVIEW ONLY (catalog: services, addresses, options)
 * ============================================================================
 *  Every address, plan, price, fee, speed and tier here is illustrative sample
 *  data for the design preview. Nothing is a live offer. Provider names are
 *  plain text only. All money values are in cents.
 * ============================================================================
 */

export type ServiceId = "internet" | "tv" | "mobile" | "security" | "phone";
export type Tech = "fiber" | "cable" | "fiveG" | "dsl" | "satellite" | "streaming" | "wireless" | "monitored" | "voip" | "landline";
export type Text = { en: string; es: string };
export const T = (en: string, es: string): Text => ({ en, es });

export const SERVICE_ORDER: ServiceId[] = ["internet", "tv", "mobile", "security", "phone"];

export const BUNDLE_PRESETS: { id: "internet-tv" | "internet-tv-phone" | "internet-tv-mobile" | "quad"; services: ServiceId[] }[] = [
  { id: "internet-tv", services: ["internet", "tv"] },
  { id: "internet-tv-phone", services: ["internet", "tv", "phone"] },
  { id: "internet-tv-mobile", services: ["internet", "tv", "mobile"] },
  { id: "quad", services: ["internet", "tv", "mobile", "phone"] },
];

/* ------------------------------------------------------------------ */
/*  Address search (mocked, no real lookup)                            */
/* ------------------------------------------------------------------ */
export type AddressType = "residential" | "business";
export interface SampleAddress {
  id: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  type: AddressType;
  timeZone: string;
}
/** Fixed suggestions, the same five as the original one-pager (each with its type). */
export const ADDRESSES: SampleAddress[] = [
  { id: "s1", line1: "658 FL-60", city: "Lake Wales", state: "FL", zip: "33853", type: "business", timeZone: "America/New_York" },
  { id: "s2", line1: "6581 Lost Canyon Ranch Road", city: "Castle Rock", state: "CO", zip: "80104", type: "residential", timeZone: "America/Denver" },
  { id: "s3", line1: "6580 Fannin Street", city: "Houston", state: "TX", zip: "77030", type: "business", timeZone: "America/Chicago" },
  { id: "s4", line1: "6585 Crescent Drive", city: "Norcross", state: "GA", zip: "30071", type: "residential", timeZone: "America/New_York" },
  { id: "s5", line1: "6584 South Parker Road", city: "Aurora", state: "CO", zip: "80014", type: "residential", timeZone: "America/Denver" },
];

/** Locations used to complete what the visitor types (same templates as the original). */
export const ADDRESS_TEMPLATES: (Omit<SampleAddress, "id" | "line1"> & { street: string })[] = [
  { street: "FL-60", city: "Lake Wales", state: "FL", zip: "33853", type: "business", timeZone: "America/New_York" },
  { street: "Lost Canyon Ranch Road", city: "Castle Rock", state: "CO", zip: "80104", type: "residential", timeZone: "America/Denver" },
  { street: "Fannin Street", city: "Houston", state: "TX", zip: "77030", type: "business", timeZone: "America/Chicago" },
  { street: "Crescent Drive", city: "Norcross", state: "GA", zip: "30071", type: "residential", timeZone: "America/New_York" },
  { street: "South Parker Road", city: "Aurora", state: "CO", zip: "80014", type: "residential", timeZone: "America/Denver" },
];

/* ------------------------------------------------------------------ */
/*  Usage (business tiles from the one-pager; home tiles from the live site) */
/* ------------------------------------------------------------------ */
export const USAGE: Record<AddressType, { id: string; title: Text; desc: Text }[]> = {
  business: [
    { id: "office", title: T("Office Operations", "Operaciones de oficina"), desc: T("Email, cloud apps, VoIP", "Correo, apps en la nube, VoIP") },
    { id: "streaming", title: T("Media & Streaming", "Medios y streaming"), desc: T("Video conf, presentations", "Videoconferencias, presentaciones") },
    { id: "data", title: T("Data-Heavy", "Uso intensivo de datos"), desc: T("Large uploads, backups", "Cargas grandes, respaldos") },
    { id: "basic", title: T("Basic Business", "Negocio básico"), desc: T("Web browsing, email", "Navegación web, correo") },
  ],
  residential: [
    { id: "casual", title: T("Casual", "Uso casual"), desc: T("Browsing & social media", "Navegación y redes sociales") },
    { id: "remote", title: T("Remote Work", "Trabajo remoto"), desc: T("Video calls & uploads", "Videollamadas y cargas") },
    { id: "4k", title: T("4K Streaming", "Streaming 4K"), desc: T("Netflix, YouTube, etc.", "Netflix, YouTube, etc.") },
    { id: "gaming", title: T("Gaming", "Videojuegos"), desc: T("Online gaming, low ping", "Juegos en línea, baja latencia") },
  ],
};
export const DEVICES = { min: 5, max: 100, default: 15 };

export const GENRES = [
  { id: "entertainment", label: T("Entertainment", "Entretenimiento") },
  { id: "news", label: T("News", "Noticias") },
  { id: "sports", label: T("Sports", "Deportes") },
  { id: "lifestyle", label: T("Lifestyle", "Estilo de vida") },
  { id: "onDemand", label: T("On-demand", "A la carta") },
];
export const PACKS = [
  { id: "latino", label: T("Latino", "Latino") },
  { id: "southAsian", label: T("South Asian", "Sur de Asia") },
  { id: "southeastAsian", label: T("Southeast Asian", "Sudeste asiático") },
  { id: "arabic", label: T("Arabic", "Árabe") },
  { id: "eastAsian", label: T("East Asian", "Este de Asia") },
  { id: "european", label: T("European", "Europeo") },
];

export const PRICE_DISCLAIMER: Text = T(
  "Pricing shown reflects typical advertised rates and promotional offers available at the searched address and may vary by market, credit, and installation requirements. Provider fees, taxes, and equipment charges are confirmed at order.",
  "Los precios mostrados reflejan tarifas anunciadas típicas y ofertas promocionales disponibles en la dirección buscada, y pueden variar según el mercado, el crédito y los requisitos de instalación. Los cargos del proveedor, impuestos y cargos de equipo se confirman al hacer el pedido.",
);

export const SUPPORT = { phone: "(800) 555-0142", tel: "tel:+18005550142", hours: T("Mon to Fri, 9 AM to 5 PM ET", "Lun a vie, 9 AM a 5 PM ET") };
export const LEGAL = {
  terms: "https://www.assuredsaving.com/terms-of-use/",
  privacy: "https://www.assuredsaving.com/privacy-policy/",
  sms: "https://www.assuredsaving.com/sms-terms/",
};

