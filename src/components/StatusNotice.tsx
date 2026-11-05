import type { Bulletin } from "@/lib/types";

const ICONS: Record<string, React.ReactNode> = {
  warn: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  ),
};

/**
 * CHỈ hiện khi có vấn đề: model yêu cầu không gọi được.
 * Khi phân tích đã chạy đúng, component trả về null — không chiếm chỗ trên giao diện.
 * Thông tin kỹ thuật đầy đủ vẫn nằm trong file JSON của bản tin.
 */
export function StatusNotice({ bulletin }: { bulletin: Bulletin }) {
  const m = bulletin.model;

  // Không có thông tin model, hoặc đã chạy đúng model yêu cầu → không hiện gì.
  if (!m || m.verified) return null;

  return (
    <div className="notice" data-tone="warn">
      {ICONS.warn}
      <div>
        <strong>Phân tích CHƯA chạy đúng model yêu cầu:</strong> yêu cầu{" "}
        <code>{m.requested}</code> nhưng không gọi được; phần phân tích dưới đây không
        phải do model được yêu cầu tạo ra.
        {m.note && (
          <span style={{ display: "block", marginTop: 4, opacity: 0.85 }}>{m.note}</span>
        )}
      </div>
    </div>
  );
}
