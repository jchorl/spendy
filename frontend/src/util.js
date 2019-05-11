import { ACCOUNT_TO_CURRENCY } from "./config";

export function getFirstOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function getFirstOfNextMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

export function getFirstOfYear() {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}

export function getFirstOfNextYear() {
  const now = new Date();
  return new Date(now.getFullYear() + 1, 0, 1);
}

export function percentageThroughDates(start, end) {
  const now = new Date();
  return (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
}

export function normalizeToUSD(transactions, exchangeRates) {
  return transactions.map(t =>
    t.update(
      "amount",
      amount =>
        amount / exchangeRates.get(ACCOUNT_TO_CURRENCY[t.get("account")])
    )
  );
}

export function formatAsCurrency(num) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });

  return formatter.format(num);
}
