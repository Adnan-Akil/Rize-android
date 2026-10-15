import { THEME } from "../../src/styles/theme";

describe("Kiora Design System Tokens", () => {
  it("defines exact Kiora color palette values", () => {
    expect(THEME.colors.canvas).toBe("#011C40");
    expect(THEME.colors.surface).toBe("#023859");
    expect(THEME.colors.border).toBe("#26658C");
    expect(THEME.colors.primary).toBe("#54ACBF");
    expect(THEME.colors.cyan).toBe("#A7EBF2");
  });

  it("defines font family definitions for Lora and Plus Jakarta Sans", () => {
    expect(THEME.fonts.serif).toContain("Lora");
    expect(THEME.fonts.sans).toContain("PlusJakartaSans");
  });
});
