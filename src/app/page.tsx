import { getLatestBulletin } from "@/lib/content";
import { formatDateLongVN } from "@/lib/format";
import { NewsFeed } from "@/components/NewsFeed";
import { MarketStrip } from "@/components/MarketStrip";
import { StatusNotice } from "@/components/StatusNotice";
import { BulletinSummaryPanel } from "@/components/BulletinSummary";

export default function HomePage() {
  const bulletin = getLatestBulletin();

  if (!bulletin) {
    return (
      <div className="empty">
        <div className="empty-icon" aria-hidden="true">📭</div>
        <div className="empty-title">Chưa có bản tin nào</div>
        <p className="empty-text">
          Thêm file <code>content/news/YYYY-MM-DD.json</code> để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Daily News</h1>
        <p className="page-sub">
          {bulletin.items.length} tin đã kiểm chứng về AI, công nghệ, MMO, startup, kinh tế, tiền mã hóa và tài chính.
        </p>
        <div className="date-line">
          <span>{formatDateLongVN(bulletin.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{bulletin.timezone}</span>
        </div>
      </div>

      <StatusNotice bulletin={bulletin} />

      {bulletin.marketSnapshot && (
        <MarketStrip snapshot={bulletin.marketSnapshot} />
      )}

      <NewsFeed items={bulletin.items} />

      {bulletin.summary && <BulletinSummaryPanel summary={bulletin.summary} />}
    </>
  );
}
