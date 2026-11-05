"use client";

import { useState } from "react";
import type { NewsItem } from "@/lib/types";
import { FIELD_META, CONFIDENCE_META } from "@/lib/fields";
import {
  formatTimestampBangkok,
  hostnameOf,
} from "@/lib/format";
import { useFavourites } from "@/lib/useFavourites";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

function Confidence({ level }: { level: string }) {
  const meta = CONFIDENCE_META[level] ?? { tone: "low", dots: 1 };
  return (
    <span className="confidence">
      <span className="dots" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`dot ${n <= meta.dots ? `on-${meta.tone}` : ""}`}
          />
        ))}
      </span>
      {level}
    </span>
  );
}

export function NewsCard({
  item,
  index,
  defaultOpen = false,
}: {
  item: NewsItem;
  index: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { has, toggle, ready } = useFavourites();
  const fav = ready && has(item.id);
  const field = FIELD_META[item.field];
  const a = item.analysis;

  return (
    <article
      className="card"
      style={{ ["--field-hue" as string]: field?.hue ?? "var(--border)" }}
    >
      <div className="card-head">
        <span className="card-index">{String(index + 1).padStart(2, "0")}</span>

        <div className="card-head-main">
          <h2 className="card-title">{item.title}</h2>
          <div className="card-meta">
            <span className="tag">{item.field}</span>
            {item.publishedAt && (
              <span className="meta-dim">
                {formatTimestampBangkok(item.publishedAt)} (Bangkok)
              </span>
            )}
            <Confidence level={a.confidence} />
          </div>
        </div>

        <button
          type="button"
          className="star-btn"
          data-on={fav}
          onClick={() => toggle(item.id)}
          aria-pressed={fav}
          aria-label={fav ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
          title={fav ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
        >
          <StarIcon filled={fav} />
        </button>
      </div>

      <div className="card-body">
        <div className="card-section">
          <div className="section-label">Tin chính</div>
          <p className="card-text">{item.summary}</p>
        </div>

        <div className="card-section">
          <div className="section-label">Vì sao đáng chú ý</div>
          <p className="card-text dim">{item.whyItMatters}</p>
        </div>

        <div className="card-section">
          <div className="section-label">Nguồn</div>
          <div className="sources">
            {item.sources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
                data-role={s.role}
                title={`${s.name} — ${hostnameOf(s.url)}${
                  s.role === "cross-check" ? " (nguồn kiểm chứng)" : ""
                }${s.note ? ` · ${s.note}` : ""}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <path d="M15 3h6v6M10 14 21 3" />
                </svg>
                <span>
                  {s.name}
                  {s.role === "cross-check" ? " ✓" : ""}
                </span>
              </a>
            ))}
          </div>
        </div>

        {item.caveat && (
          <div className="caveat">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <span>{item.caveat}</span>
          </div>
        )}

        <button
          type="button"
          className="analysis-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform .15s",
            }}
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          Phân tích Claude Sonnet 5.5
        </button>

        {open && (
          <div className="analysis-body">
            <div className="analysis-row">
              <div className="analysis-label">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Điểm mạnh / động lực
              </div>
              <p className="analysis-text">{a.strengths}</p>
            </div>

            <div className="analysis-row">
              <div className="analysis-label">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                Cơ hội đáng nghiên cứu
              </div>
              <p className="analysis-text">{a.opportunity}</p>
            </div>

            <div className="analysis-row">
              <div className="analysis-label">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </svg>
                Rủi ro / điều có thể làm nhận định sai
              </div>
              <p className="analysis-text">{a.risks}</p>
            </div>

            <div className="analysis-row">
              <div className="analysis-label">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Mức độ chắc chắn
              </div>
              <p className="analysis-text">
                <Confidence level={a.confidence} /> — {a.confidenceNote}
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
