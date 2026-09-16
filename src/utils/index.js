export function formatPrice(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString("en-US")}`;
}

export function formatTravelTime(hours) {
  const n = Number(hours) || 0;
  return Number.isInteger(n) ? `${n}h` : `${n}h`;
}

export function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function generateConfirmationCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const CANCELLATION_LABELS = {
  free: "Free cancellation",
  partial: "Partial refund",
  "non-refundable": "Non-refundable",
};
