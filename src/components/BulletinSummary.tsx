import type { BulletinSummary } from "@/lib/types";

export function BulletinSummaryPanel({
  summary,
}: {
  summary: BulletinSummary;
}) {
  return (
    <section className="panel" aria-labelledby="summary-title">
      <h2 className="panel-title" id="summary-title">
        <span aria-hidden="true">🧭</span> Tổng kết
      </h2>

      <div className="panel-block">
        <div className="panel-label">Điểm cần theo dõi hôm nay</div>
        <ul className="panel-list">
          {summary.watchpoints.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </div>

      <div className="panel-block">
        <div className="panel-label">Cơ hội nổi bật để nghiên cứu thêm</div>
        <p className="panel-text">{summary.topOpportunity}</p>
      </div>

      <div className="panel-block">
        <div className="panel-label">Rủi ro thị trường đáng lưu ý</div>
        <ul className="panel-list">
          {summary.risks.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="disclaimer">{summary.disclaimer}</div>
    </section>
  );
}
