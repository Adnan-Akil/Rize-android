export class NfcService {
  private nfcManager: any = null;

  constructor() {
    try {
      this.nfcManager = require("react-native-nfc-manager").default;
    } catch (e) {
      this.nfcManager = null;
    }
  }

  formatUid(rawUid: string): string {
    if (!rawUid) return "";
    // Remove existing colons or spaces
    const clean = rawUid.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
    const pairs = clean.match(/.{1,2}/g) || [];
    return pairs.join(":");
  }

  async isSupported(): Promise<boolean> {
    if (!this.nfcManager) return false;
    try {
      return await this.nfcManager.isSupported();
    } catch (e) {
      return false;
    }
  }

  async isEnabled(): Promise<boolean> {
    if (!this.nfcManager) return false;
    try {
      return await this.nfcManager.isEnabled();
    } catch (e) {
      return false;
    }
  }

  async startListening(onTagDiscovered: (formattedUid: string) => void): Promise<void> {
    if (!this.nfcManager) {
      console.warn("NFC hardware manager not available");
      return;
    }

    try {
      await this.nfcManager.start();
      await this.nfcManager.setEventListener("NfcManagerDiscoverTag", (tag: any) => {
        if (tag && tag.id) {
          const formatted = this.formatUid(tag.id);
          onTagDiscovered(formatted);
        }
      });
      await this.nfcManager.registerTagEvent();
    } catch (e) {
      console.warn("Error starting NFC tag discovery", e);
    }
  }

  async stopListening(): Promise<void> {
    if (!this.nfcManager) return;
    try {
      await this.nfcManager.unregisterTagEvent();
      this.nfcManager.setEventListener("NfcManagerDiscoverTag", null);
    } catch (e) {
      console.warn("Error stopping NFC tag discovery", e);
    }
  }
}

export const nfcService = new NfcService();
