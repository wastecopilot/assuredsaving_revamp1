import { BUNDLE_PRESETS, type ServiceId } from "@/data/catalog";

const key = (s: ServiceId[]) => [...s].sort().join("+");
/** The bundle preset that exactly matches the selected services, if any. */
export const presetFor = (services: ServiceId[]) => BUNDLE_PRESETS.find((b) => key(b.services) === key(services)) ?? null;
