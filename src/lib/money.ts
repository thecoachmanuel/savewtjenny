export function formatMoney(amount: number, currency: string = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatKobo(amountKobo: number | null | undefined, currency: string = "NGN") {
  if (typeof amountKobo !== "number") return "-";
  return formatMoney(amountKobo / 100, currency);
}

