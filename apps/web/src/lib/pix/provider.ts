export type PixCharge = {
  chargeId: string;
  emv: string; // copia e cola
  qrCodeImage: string; // data URL no fake
  expiresAt: string;
};

export interface PixProvider {
  createCharge(orderId: string, amount: number): Promise<PixCharge>;
  // getCharge?(chargeId: string): Promise<PixCharge>;
}

class FakePixProvider implements PixProvider {
  async createCharge(orderId: string, amount: number): Promise<PixCharge> {
    const chargeId = `fake_${Date.now()}_${orderId}`;
    const emv = `000201FAKEPIX${amount}`;
    const qrSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='100%' height='100%' fill='white'/><text x='10' y='128' font-size='14'>FAKE PIX: ${amount}</text></svg>`;
    const base64 = Buffer.from(qrSvg).toString("base64");
    return {
      chargeId,
      emv,
      qrCodeImage: `data:image/svg+xml;base64,${base64}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
  }
}

export function getPixProvider(): PixProvider {
  // TODO: switch by env.PSP_PROVIDER
  return new FakePixProvider();
}
