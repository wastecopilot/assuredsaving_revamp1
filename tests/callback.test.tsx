/**
 * Integration tests for "Schedule AI Callback" (mocked: nothing is sent).
 * Covers consent, verification binding, do-not-call, attempt limits and time slots.
 */
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoreProvider, useStore } from "@/lib/store";
import { CallbackModal } from "@/components/sections/Callback";

function Open({ planId = "att-1g" }: { planId?: string }) {
  const { s, dispatch } = useStore();
  useEffect(() => {
    dispatch({ type: "patch", patch: { modal: { kind: "callback", planId } } });
  }, [dispatch, planId]);
  return s.modal.kind === "callback" ? <CallbackModal /> : null;
}

const setup = () => {
  // A Wednesday at 10:00 AM Eastern, inside calling hours
  vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date("2026-11-04T15:00:00Z") });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <StoreProvider>
      <Open />
    </StoreProvider>,
  );
  const dialog = screen.getByRole("dialog");
  return { user, d: within(dialog) };
};

async function verify(user: ReturnType<typeof userEvent.setup>, d: ReturnType<typeof within>, phone = "2125550142", code = "123456") {
  await user.type(d.getByLabelText("Mobile Phone"), phone);
  await user.click(d.getByRole("button", { name: "Send Code" }));
  await act(() => vi.advanceTimersByTimeAsync(700));
  await user.type(d.getByLabelText("Enter the 6-digit code"), code);
  await user.click(d.getByRole("button", { name: "Confirm" }));
  await act(() => vi.advanceTimersByTimeAsync(600));
}

describe("Schedule AI Callback", () => {
  it("starts with both consent boxes unticked and blocks without call consent", async () => {
    const { user, d } = setup();
    expect(d.getByRole("checkbox", { name: /I agree that Assured Saving LLC/ })).not.toBeChecked();
    expect(d.getByRole("checkbox", { name: /Also text me/ })).not.toBeChecked();
    await user.type(d.getByLabelText("Email Address"), "jordan@example.com");
    await verify(user, d);
    await user.click(d.getByRole("button", { name: "Call Me Now" }));
    expect(d.getByText("Tick the consent box above to get the call")).toBeInTheDocument();
    expect(screen.queryByText("You're All Set!")).toBeNull();
    vi.useRealTimers();
  });

  it("succeeds with email, verified phone and call consent; SMS stays optional", async () => {
    const { user, d } = setup();
    await user.type(d.getByLabelText("Email Address"), "jordan@example.com");
    await verify(user, d);
    expect(d.getByText("Verified ✓")).toBeInTheDocument();
    await user.click(d.getByRole("checkbox", { name: /I agree that Assured Saving LLC/ }));
    await user.click(d.getByRole("button", { name: "Call Me Now" }));
    expect(await screen.findByText("You're All Set!")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("refuses do-not-call numbers before sending a code", async () => {
    const { user, d } = setup();
    await user.type(d.getByLabelText("Mobile Phone"), "2125550000");
    await user.click(d.getByRole("button", { name: "Send Code" }));
    expect(d.getByText(/previously asked us not to call it/)).toBeInTheDocument();
    expect(d.queryByLabelText("Enter the 6-digit code")).toBeNull();
    vi.useRealTimers();
  });

  it("rejects international or mistyped numbers instead of guessing", async () => {
    const { user, d } = setup();
    await user.type(d.getByLabelText("Mobile Phone"), "+44 7911 123456");
    await user.click(d.getByRole("button", { name: "Send Code" }));
    expect(d.getByText("Enter a valid phone number first.")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("locks the number while verifying, so a different number cannot inherit the result", async () => {
    const { user, d } = setup();
    const phone = d.getByLabelText("Mobile Phone") as HTMLInputElement;
    await user.type(phone, "2125550142");
    await user.click(d.getByRole("button", { name: "Send Code" }));
    await act(() => vi.advanceTimersByTimeAsync(700));
    await user.type(d.getByLabelText("Enter the 6-digit code"), "123456");
    await user.click(d.getByRole("button", { name: "Confirm" }));
    expect(phone.readOnly).toBe(true);
    expect(d.getByRole("button", { name: "Change number" })).toBeDisabled();
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(d.getByText("Verified ✓")).toBeInTheDocument();
    expect(phone.value).toBe("(212) 555-0142");
    vi.useRealTimers();
  });

  it("asks for consent again after the verified number changes", async () => {
    const { user, d } = setup();
    await verify(user, d);
    const box = d.getByRole("checkbox", { name: /I agree that Assured Saving LLC/ });
    await user.click(box);
    expect(box).toBeChecked();
    await user.click(d.getByRole("button", { name: "Change number" }));
    expect(box).not.toBeChecked();
    expect(d.queryByText("Verified ✓")).toBeNull();
    vi.useRealTimers();
  });

  it("stops after too many wrong codes", async () => {
    const { user, d } = setup();
    await user.type(d.getByLabelText("Mobile Phone"), "2125550142");
    await user.click(d.getByRole("button", { name: "Send Code" }));
    await act(() => vi.advanceTimersByTimeAsync(700));
    const box = d.getByLabelText("Enter the 6-digit code");
    for (let i = 0; i < 5; i++) {
      await user.clear(box);
      await user.type(box, "000000");
      await user.click(d.getByRole("button", { name: "Confirm" }));
    }
    expect(d.getByText("Too many wrong codes. Request a new one.")).toBeInTheDocument();
    expect(d.getByRole("button", { name: "Confirm" })).toBeDisabled();
    vi.useRealTimers();
  });

  it("enforces the resend cooldown even after changing back to the same number", async () => {
    const { user, d } = setup();
    await user.type(d.getByLabelText("Mobile Phone"), "2125550142");
    await user.click(d.getByRole("button", { name: "Send Code" }));
    await act(() => vi.advanceTimersByTimeAsync(700));
    await user.click(d.getByRole("button", { name: "Change number" }));
    expect(d.getByRole("button", { name: /Resend in \d+s/ })).toBeDisabled();
    vi.useRealTimers();
  });

  it("needs a time to schedule, and clears it when the time zone changes", async () => {
    const { user, d } = setup();
    await user.type(d.getByLabelText("Email Address"), "jordan@example.com");
    await verify(user, d);
    await user.click(d.getByRole("checkbox", { name: /I agree that Assured Saving LLC/ }));
    const [, time] = d.getAllByRole("combobox", { name: "Preferred Time (8am - 9pm)" }) as HTMLSelectElement[];
    await user.selectOptions(time, time.options[1].value);
    await user.selectOptions(d.getByRole("combobox", { name: "Your Timezone" }), "America/Denver");
    expect((d.getAllByRole("combobox", { name: "Preferred Time (8am - 9pm)" })[1] as HTMLSelectElement).value).toBe("");
    await user.click(d.getByRole("button", { name: "Schedule Callback" }));
    expect(d.getByText("Complete phone and preferred time to continue")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("does not offer Call Me Now success outside calling hours", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date("2026-11-05T03:30:00Z") }); // 10:30 PM Eastern
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StoreProvider>
        <Open />
      </StoreProvider>,
    );
    const d = within(screen.getByRole("dialog"));
    await user.type(d.getByLabelText("Email Address"), "jordan@example.com");
    await verify(user, d);
    await user.click(d.getByRole("checkbox", { name: /I agree that Assured Saving LLC/ }));
    await user.click(d.getByRole("button", { name: "Call Me Now" }));
    expect(screen.queryByText("You're All Set!")).toBeNull();
    expect(d.getByText("Complete phone and preferred time to continue")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
