import type { Bulletin } from "@/lib/types";

const ICONS: Record<string, React.ReactNode> = {
  ok: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  warn: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  ),
  info: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
};

/** Hiển thị trung thực model nào đã thực sự được gọi và Telegram đã gửi hay chưa. */
export function StatusNotice({ bulletin }: { bulletin: Bulletin }) {
  const m = bulletin.model;

  if (!m) return null;

  const verified = m.verified;
  const tone = verified ? "ok" : "warn";

  return (
    <div className="notice" data-tone={tone}>
      {ICONS[tone]}
      <div>
        <strong>
          {verified ? "Phân tích đã chạy" : "Phân tích CHƯA chạy đúng model yêu cầu"}:
        </strong>{" "}
        {verified ? (
          <>
            đã gọi <code>{m.usedModelId}</code> thành công cho cả {bulletin.items.length} tin.
          </>
        ) : (
          <>
            yêu cầu <code>{m.requested}</code> nhưng không gọi được; phần phân tích dưới
            đây không phải do model được yêu cầu tạo ra.
          </>
        )}
        {m.note && (
          <span style={{ display: "block", marginTop: 4, opacity: 0.85 }}>
            {m.note}
          </span>
        )}
        {bulletin.telegram && !bulletin.telegram.delivered && (
          <span style={{ display: "block", marginTop: 4, opacity: 0.85 }}>
            Telegram: chưa gửi — {bulletin.telegram.reason ?? "chưa cấu hình"}.
          </span>
        )}
      </div>
    </div>
  );
}
