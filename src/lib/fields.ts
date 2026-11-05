import type { Field } from "./types";

/** Nhãn hiển thị + màu nhận diện cho từng lĩnh vực */
export const FIELD_META: Record<Field, { short: string; hue: string; emoji: string }> = {
  AI: { short: "AI", hue: "var(--hue-ai)", emoji: "🧠" },
  "Công nghệ": { short: "Công nghệ", hue: "var(--hue-tech)", emoji: "⚙️" },
  MMO: { short: "MMO", hue: "var(--hue-mmo)", emoji: "💰" },
  Startup: { short: "Startup", hue: "var(--hue-startup)", emoji: "🚀" },
  "Kinh tế": { short: "Kinh tế", hue: "var(--hue-econ)", emoji: "🌐" },
  "Tiền mã hóa": { short: "Crypto", hue: "var(--hue-crypto)", emoji: "₿" },
  "Tài chính": { short: "Tài chính", hue: "var(--hue-fin)", emoji: "📊" },
};

export const CONFIDENCE_META: Record<string, { tone: string; dots: number }> = {
  Thấp: { tone: "low", dots: 1 },
  "Trung bình": { tone: "mid", dots: 2 },
  Cao: { tone: "high", dots: 3 },
};
