export interface DashboardModule {
  id: string;
  label: string;
  href: string;
  emoji: string;
  /** false = chưa triển khai, hiển thị dạng "sắp có" */
  enabled: boolean;
  description: string;
}

/**
 * Registry các mục của dashboard.
 * Thêm mục mới: thêm một entry ở đây rồi tạo route tương ứng trong src/app.
 * Nav và trang chủ đều đọc từ danh sách này nên không phải sửa chỗ khác.
 */
export const MODULES: DashboardModule[] = [
  {
    id: "daily-news",
    label: "Daily News",
    href: "/",
    emoji: "📰",
    enabled: true,
    description: "5 tin mới mỗi ngày về AI, công nghệ, tiền mã hóa và tài chính",
  },
  {
    id: "favourites",
    label: "Yêu thích",
    href: "/favourites",
    emoji: "★",
    enabled: true,
    description: "Các tin bạn đã đánh dấu, lưu trên thiết bị này",
  },
  {
    id: "watchlist",
    label: "Watchlist",
    href: "/watchlist",
    emoji: "📈",
    enabled: false,
    description: "Theo dõi mã / tài sản quan tâm",
  },
  {
    id: "archive",
    label: "Lưu trữ",
    href: "/archive",
    emoji: "🗂️",
    enabled: false,
    description: "Tra cứu toàn bộ bản tin theo tháng",
  },
];

export const ENABLED_MODULES = MODULES.filter((m) => m.enabled);
