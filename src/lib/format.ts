/** Định dạng ngày YYYY-MM-DD -> "05/11/2026" */
export function formatDateVN(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

/** YYYY-MM-DD -> "Thứ Tư, 05/11/2026" */
export function formatDateLongVN(isoDate: string): string {
  const names = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dt = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(dt.getTime())) return isoDate;
  return `${names[dt.getUTCDay()]}, ${formatDateVN(isoDate)}`;
}

/** Số -> "80.379" (dấu chấm ngăn cách nghìn kiểu VN) */
export function formatNumber(n: number, maxDigits = 0): string {
  return n.toLocaleString("vi-VN", {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: 0,
  });
}

/** +4,69% / -1,20% */
export function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
}

/** "2026-11-04T16:06:03Z" -> "04/11 23:06 (Bangkok)" */
export function formatTimestampBangkok(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(dt);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")} ${get("hour")}:${get("minute")}`;
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
