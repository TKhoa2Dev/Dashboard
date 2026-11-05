import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">🧭</div>
      <div className="empty-title">Không tìm thấy trang</div>
      <p className="empty-text">
        Đường dẫn này không tồn tại.{" "}
        <Link href="/" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Về Daily News
        </Link>
      </p>
    </div>
  );
}
