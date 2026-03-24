export const PRICING = {
  price: 99_000,
  originalPrice: 249_000,
  productName: "GENBOX BYOK",
  accessType: "Lifetime Access",
  get priceLabel() { return `Rp ${new Intl.NumberFormat("id-ID").format(this.price)}`; },
  get originalPriceLabel() { return `Rp ${new Intl.NumberFormat("id-ID").format(this.originalPrice)}`; },
  get ctaText() { return `Beli Sekarang — ${this.priceLabel}`; },
  get payText() { return `Bayar Sekarang — ${this.priceLabel}`; },
} as const;
