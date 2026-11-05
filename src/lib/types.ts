export const FIELDS = ["AI", "Công nghệ", "Tiền mã hóa", "Tài chính"] as const;

export type Field = (typeof FIELDS)[number];

export type Confidence = "Thấp" | "Trung bình" | "Cao";

export interface NewsSource {
  /** Tên hiển thị của nguồn, vd: "Ars Technica" */
  name: string;
  /** Liên kết trực tiếp tới bài gốc */
  url: string;
  /** primary = nguồn chính, cross-check = nguồn kiểm chứng độc lập */
  role: "primary" | "cross-check";
  /** Ghi chú ngắn về vai trò / giới hạn của nguồn */
  note?: string;
}

export interface Analysis {
  /** Điểm mạnh / động lực */
  strengths: string;
  /** Cơ hội đáng nghiên cứu: hướng cụ thể + điều kiện + tín hiệu */
  opportunity: string;
  /** Rủi ro / điều có thể làm nhận định sai */
  risks: string;
  confidence: Confidence;
  /** Một câu giải thích cho mức độ chắc chắn */
  confidenceNote: string;
}

export interface NewsItem {
  /** ID ổn định, dùng cho tính năng favourite. Không đổi sau khi đã publish. */
  id: string;
  title: string;
  field: Field;
  /** Tóm tắt sự kiện 2-4 câu */
  summary: string;
  /** Vì sao đáng chú ý */
  whyItMatters: string;
  /** Thời điểm công bố gốc (ISO 8601), nếu biết chính xác */
  publishedAt?: string;
  sources: NewsSource[];
  analysis: Analysis;
  /** Cảnh báo riêng của người tổng hợp về độ tin cậy / số liệu chưa xác minh */
  caveat?: string;
}

export interface MarketQuote {
  symbol: string;
  priceUsd: number;
  change24hPct: number;
}

export interface BulletinSummary {
  watchpoints: string[];
  topOpportunity: string;
  risks: string[];
  disclaimer: string;
}

export interface ModelInfo {
  /** Tên model người dùng yêu cầu */
  requested: string;
  /** ID model thực tế đã gọi */
  usedModelId: string;
  /** true nếu đã gọi thành công đúng model được yêu cầu */
  verified: boolean;
  /** Ghi chú kỹ thuật, vd: định dạng API, tham số bị từ chối */
  note?: string;
}

export interface TelegramStatus {
  delivered: boolean;
  reason?: string;
}

export interface Bulletin {
  /** Ngày của bản tin, dạng YYYY-MM-DD theo timezone */
  date: string;
  timezone: string;
  /** Thời điểm tạo bản tin (ISO 8601 kèm offset) */
  generatedAt: string;
  model?: ModelInfo;
  telegram?: TelegramStatus;
  marketSnapshot?: {
    source: string;
    asOf: string;
    quotes: MarketQuote[];
  };
  items: NewsItem[];
  summary?: BulletinSummary;
}
