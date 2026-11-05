/**
 * Integration tests: the whole page, driven the way a visitor would.
 * Also audits every visible text node against the official copy and the sample data.
 */
import React, { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import official from "@/data/official-copy.json";
import { ADDRESSES, DIRECTV_TIERS, PLANS } from "@/data/sample";

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<React.ComponentType<Record<string, unknown>>>) => {
    const Lazy = React.lazy(async () => ({ default: await loader() }));
    const Dyn = (p: Record<string, unknown>) => (
      <Suspense fallback={null}>
        <Lazy {...p} />
      </Suspense>
    );
    return Dyn;
  },
}));

import Page from "@/app/page";

const svc = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}$`) });
const pressed = () =>
  ["Internet", "TV", "Landline", "Mobile", "Home Security"].filter((n) => svc(n).getAttribute("aria-pressed") === "true");

const addressSection = () => document.getElementById("section-address") as HTMLElement;

async function start() {
  const user = userEvent.setup();
  render(<Page />);
  return user;
}

async function toAddress(user: ReturnType<typeof userEvent.setup>, services: string[], name = "Jordan Rivera") {
  for (const s of services) await user.click(svc(s));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  const nameBox = await screen.findByPlaceholderText("Your full name", undefined, { timeout: 5000 });
  await user.type(nameBox, name);
  return screen.findByRole("combobox", { name: "Search USA address" });
}

describe("step 1: services", () => {
  it("follows the official selection rules", async () => {
    const user = await start();
    await user.click(svc("Internet"));
    await user.click(svc("TV"));
    expect(pressed()).toEqual(["Internet", "TV"]);
    await user.click(svc("Landline"));
    expect(pressed()).toEqual(["Internet", "TV", "Landline"]);
    await user.click(svc("Home Security"));
    expect(pressed()).toEqual(["Home Security"]);
    await user.click(svc("Mobile"));
    expect(pressed()).toEqual(["Mobile"]);
    await user.click(svc("Internet"));
    expect(pressed()).toEqual(["Internet"]);
  });

  it("asks for a service before continuing", async () => {
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a service above, then pick your address");
  });

  it("bundle shortcuts select the official combinations", async () => {
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Quad Play" }));
    expect(pressed()).toEqual(["Internet", "TV", "Landline", "Mobile"]);
  });
});

describe("name and address", () => {
  it("shows the address search only after a name", async () => {
    const user = await start();
    await user.click(svc("Internet"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByPlaceholderText("Your full name", undefined, { timeout: 5000 });
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("detects a business address and enforces the business rule", async () => {
    const user = await start();
    const box = await toAddress(user, ["Internet", "TV", "Mobile"]);
    await user.type(box, "658");
    await user.click(await screen.findByRole("option", { name: /658 FL-60/ }));
    expect(await within(addressSection()).findByText("Business Address")).toBeInTheDocument();
    const chooser = await screen.findByRole("group", { name: "Business address detected" });
    await user.click(within(chooser).getByRole("button", { name: "Internet + TV Bundle" }));
    expect(pressed()).toEqual(["Internet", "TV"]);
    expect(await screen.findByRole("heading", { name: /use the internet/ })).toBeInTheDocument();
  });

  it("business chooser from a non-internet service goes to usage, not straight to the scan", async () => {
    const user = await start();
    const box = await toAddress(user, ["Mobile"]);
    await user.type(box, "6580");
    await user.click(await screen.findByRole("option", { name: /Fannin Street/ }));
    const chooser = await screen.findByRole("group", { name: "Business address detected" });
    await user.click(within(chooser).getByRole("button", { name: "Internet" }));
    expect(pressed()).toEqual(["Internet"]);
    expect(await screen.findByRole("heading", { name: /use the internet/ })).toBeInTheDocument();
    // The scan loads lazily: give it time to appear if the flow wrongly skipped ahead
    await new Promise((r) => setTimeout(r, 1500));
    expect(screen.queryByText("Assured Saving Agent — Live")).toBeNull();
    expect(screen.getByRole("button", { name: "Pick how you use the internet" })).toBeDisabled();
  });

  it("lets you continue again after going Back to a verified address (no dead end)", async () => {
    const user = await start();
    const box = await toAddress(user, ["Internet"]);
    await user.type(box, "6585");
    await user.click(await screen.findByRole("option", { name: /Crescent Drive/ }));
    await screen.findByRole("heading", { name: /use the internet/ });
    await user.click(screen.getByRole("button", { name: "Back", exact: true } as never));
    expect(screen.queryByRole("heading", { name: /use the internet/ })).toBeNull();
    await user.click(within(addressSection()).getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: /use the internet/ })).toBeInTheDocument();
  });

  it("shows the official error when nothing matches", async () => {
    const user = await start();
    const box = await toAddress(user, ["Internet"]);
    await user.type(box, "zzzz");
    expect(await screen.findByText("US addresses only — please pick from the list")).toBeInTheDocument();
  });
});

describe("full flow to results", () => {
  it("Internet + TV at a home address", { timeout: 20000 }, async () => {
    const user = await start();
    const box = await toAddress(user, ["Internet", "TV"]);
    await user.type(box, "6585");
    await user.click(await screen.findByRole("option", { name: /Crescent Drive/ }));
    expect(await within(addressSection()).findByText("Home Address")).toBeInTheDocument();

    const usageCta = await screen.findByRole("button", { name: "Pick how you use the internet" });
    expect(usageCta).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Remote Work/ }));
    await user.click(screen.getByRole("button", { name: "Find TV Plans" }));

    const tvCta = await screen.findByRole("button", { name: 'Answer "do you have internet" above to continue' });
    expect(tvCta).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "Find my bundle" }));

    expect(await screen.findByText("Assured Saving Agent — Live")).toBeInTheDocument();
    await screen.findByRole("heading", { name: /plans available/ }, { timeout: 10000 });
    expect(screen.getAllByRole("article").length).toBeGreaterThan(0);

    auditText();
  });
});

/** Every text node must be official copy, a filled-in official template, or sample data. */
function auditText() {
  type Tree = { [k: string]: string | Tree };
  const flat = (o: Tree, out: string[] = []): string[] => {
    for (const v of Object.values(o)) {
      if (typeof v === "string") out.push(v);
      else flat(v, out);
    }
    return out;
  };
  const officialText = [...flat(official.dict.en as unknown as Tree), ...Object.keys(official.inline), official.consent.call.en, official.consent.sms.en, ...Object.values(official.nav as Record<string, { en: { title: string } }>).map((n) => n.en.title)].map((s) =>
    s.replace(/^(📞\s|←\s)/, "").trim(),
  );
  const exact = new Set(officialText);
  const templates = officialText
    .filter((s) => /\{\w+\}/.test(s))
    .map((s) => new RegExp("^" + s.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\\\$\{\w+\}|\{\w+\}/g, ".+") + "$"));
  const data = new Set<string>([
    ...PLANS.flatMap((p) => [p.provider, p.name, ...(p.includes?.map((i) => i.en) ?? [])]),
    ...ADDRESSES.flatMap((a) => [a.line1, a.city, a.state, a.zip]),
    ...DIRECTV_TIERS.map((t) => t.name),
    "Jordan", "Jordan Rivera", "J", "ENG", "ESP", "Assured", "Saving", "?",
  ]);
  const numeric = /^[\s$#.,:·•|/+\-–()%0-9a-zA-Z]{0,3}[\d$][\d\s$.,:·•/+\-–()%]*(Mbps|Gbps|GB|mo|\/mo|\+)?[\s.,)]*$/;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const bad: string[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = (n.textContent ?? "").trim();
    if (!t) continue;
    const el = n.parentElement;
    if (el?.closest("[aria-hidden='true'], script, style, .sr-only")) continue;
    const ok = /^[\p{P}\p{S}]+$/u.test(t) || exact.has(t) || data.has(t) || numeric.test(t) || templates.some((r) => r.test(t)) || [...data].some((d) => t.includes(d) && t.replace(d, "").replace(/[,\s\d]/g, "") === "");
    if (!ok) bad.push(t);
  }
  expect([...new Set(bad)]).toEqual([]);
}
