import type { Bulletin } from "@/lib/types";
import { formatDateLongVN, formatNumber, formatPct } from "@/lib/format";

export function MarketStrip({
  snapshot,
}: {
  snapshot: NonNullable<Bulletin["marketSnapshot"]>;
}) {
  return (
    <div className="market-strip" aria-label="Giá thị trường tham chiếu">
      {snapshot.quotes.map((q) => {
        const up = q.change24hPct >= 0;
        const digits = q.priceUsd < 100 ? 2 : 0;
        return (
          <div className="quote" key={q.symbol}>
            <span className="quote-sym">{q.symbol}</span>
            <span className="quote-price">
              ${formatNumber(q.priceUsd, digits)}
            </span>
            <span className="quote-chg" data-up={up}>
              {formatPct(q.change24hPct)}
            </span>
          </div>
        );
      })}
      <div className="quote">
        <span className="meta-dim" style={{ fontSize: 11 }}>
          {snapshot.source} · {formatDateLongVN(snapshot.asOf.slice(0, 10))}
        </span>
      </div>
    </div>
  );
}
