import { getAllItems } from "@/lib/content";
import { FavouritesView } from "@/components/FavouritesView";

export const metadata = {
  title: "Yêu thích — Daily Brief",
};

export default function FavouritesPage() {
  const items = getAllItems();

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Yêu thích</h1>
        <p className="page-sub">
          Những tin bạn đã đánh dấu. Lưu trên thiết bị này (localStorage) — không
          đồng bộ giữa các thiết bị.
        </p>
      </div>

      <FavouritesView items={items} />
    </>
  );
}
