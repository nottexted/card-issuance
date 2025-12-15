import dayjs from "dayjs";

export function fmtDateTime(v?: string | null): string {
  if (!v) return "—";
  return dayjs(v).format("DD.MM.YYYY HH:mm");
}
export function fmtDate(v?: string | null): string {
  if (!v) return "—";
  return dayjs(v).format("DD.MM.YYYY");
}
export function money(v?: number | null): string {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(n);
}
export function initials(name: string): string {
  const parts = (name || "").split(" ").filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}
