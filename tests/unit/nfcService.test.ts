import { nfcService } from "../../src/features/nfc/nfcService";

describe("NFC Hardware Service", () => {
  it("formats unformatted hex UID to colon-separated uppercase string", () => {
    expect(nfcService.formatUid("045ab21c89")).toBe("04:5A:B2:1C:89");
    expect(nfcService.formatUid("04:5a:b2:1c:89")).toBe("04:5A:B2:1C:89");
  });

  it("checks NFC support and availability gracefully without crash", async () => {
    const isSupported = await nfcService.isSupported();
    expect(typeof isSupported).toBe("boolean");
  });
});
