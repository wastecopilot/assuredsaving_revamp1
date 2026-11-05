import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

// jsdom gaps used by the app
if (!window.matchMedia) {
  window.matchMedia = (q: string) =>
    ({ matches: false, media: q, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }) as unknown as MediaQueryList;
}
Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
