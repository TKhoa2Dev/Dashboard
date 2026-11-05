# Daily Brief — Dashboard bản tin hằng ngày

Dashboard đọc tin hằng ngày về **AI, công nghệ, tiền mã hóa, tài chính**, có đánh dấu
yêu thích, lọc theo lĩnh vực và tìm kiếm. Thiết kế mobile-first, dùng được trên PC lẫn điện thoại.

## Tính năng hiện có

| Tính năng | Trạng thái |
|---|---|
| **Daily News** — 5 tin/ngày, đủ 4 lĩnh vực | ✅ |
| Lọc theo lĩnh vực + tìm kiếm full-text | ✅ |
| **Yêu thích** — đánh dấu tin, xem lại ở trang riêng | ✅ (localStorage) |
| Phân tích Claude Sonnet 5.5 gấp/mở trong từng tin | ✅ |
| Hiển thị mức độ chắc chắn (Thấp/TB/Cao) | ✅ |
| Cảnh báo riêng khi số liệu chưa xác minh | ✅ |
| Sáng/tối tự động + nút chuyển tay | ✅ |
| Giá thị trường tham chiếu (BTC/ETH/SOL) | ✅ (snapshot trong file tin) |
| Module mở rộng (Watchlist, Lưu trữ) | 🚧 đã có chỗ trong `modules.ts` |

## Chạy local

```bash
cd dashboard
npm install
npm run dev          # http://localhost:3000
```

Build production:

```bash
npm run build
npm start            # tôn trọng biến $PORT
```

## Thêm bản tin mới

Thả một file JSON vào `content/news/`, tên theo ngày:

```
content/news/2026-11-06.json
```

Không cần sửa code — trang chủ tự lấy file mới nhất, trang Yêu thích tự gộp mọi ngày.
Schema đầy đủ ở [`src/lib/types.ts`](src/lib/types.ts); xem mẫu thật ở
[`content/news/2026-11-05.json`](content/news/2026-11-05.json).

Trường quan trọng:

- `id` — **phải ổn định và duy nhất**, vì favourite lưu theo `id`. Đừng đổi sau khi đã publish.
- `field` — một trong `AI`, `Công nghệ`, `Tiền mã hóa`, `Tài chính`.
- `sources[]` — `role: "primary"` là nguồn chính, `"cross-check"` là nguồn kiểm chứng (hiện dấu ✓).
- `model.verified` — `true` chỉ khi **thực sự** đã gọi được model được yêu cầu.
  Nếu `false`, dashboard hiện cảnh báo vàng thay vì giả vờ đã phân tích.
- `caveat` — cảnh báo riêng của người tổng hợp, hiện trong khung vàng trên thẻ tin.

## Deploy

### Vercel (khuyến nghị — nhanh nhất)

```bash
npm i -g vercel
cd dashboard
vercel          # deploy preview
vercel --prod   # deploy production
```

Hoặc push lên GitHub rồi "Import Project" trên vercel.com. `vercel.json` đã cấu hình
sẵn region `sin1` (Singapore, gần Việt Nam).

### Render

Có sẵn `render.yaml` (Blueprint). Trên dashboard Render: **New +** → **Blueprint** →
chọn repo. Hoặc tạo **Web Service** thủ công:

- Build: `npm install && npm run build`
- Start: `npm start`
- Region: Singapore

> Lưu ý gói free của Render sẽ "ngủ" sau ~15 phút không truy cập; lần mở đầu tiên chậm ~30s.

## Cấu trúc

```
dashboard/
├── content/news/*.json        # dữ liệu bản tin (nguồn duy nhất)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # shell, theme script chống nháy màu
│   │   ├── page.tsx           # Daily News
│   │   ├── globals.css        # design tokens + toàn bộ style
│   │   └── favourites/        # trang Yêu thích
│   ├── components/            # Header, NewsCard, NewsFeed, …
│   └── lib/
│       ├── types.ts           # schema bản tin
│       ├── content.ts         # đọc JSON, không gọi mạng
│       ├── modules.ts         # registry module để mở rộng
│       ├── format.ts          # định dạng ngày/số kiểu VN
│       └── useFavourites.ts   # hook localStorage + đồng bộ đa tab
├── vercel.json
└── render.yaml
```

## Mở rộng thêm module

1. Thêm entry vào `src/lib/modules.ts` (`enabled: true`).
2. Tạo route `src/app/<id>/page.tsx`.

Nav và trang chủ tự cập nhật vì đều đọc từ `MODULES`.

## Kiểm thử

Có sẵn 2 script kiểm thử chạy trên Chrome thật (headless), cần server đang chạy ở cổng 3111:

```bash
npm run build && npx next start -p 3111   # cửa sổ 1
npm install --no-save puppeteer-core@23   # chỉ cần lần đầu
node tests/ui.spec.cjs                    # 15 test tương tác
node tests/responsive.spec.cjs            # kiểm tra tràn ngang ở 390px / 412px
```

`ui.spec.cjs` kiểm: số tin, mở panel phân tích, favourite + persist sau reload,
trang Yêu thích, empty state, lọc lĩnh vực, tìm kiếm, đổi theme, link nguồn, lỗi console.

## Ghi chú kỹ thuật

- **Không có backend / database.** Nội dung là file JSON tĩnh, build ra static HTML.
  Favourite nằm trong `localStorage` của từng thiết bị — **không đồng bộ giữa PC và điện thoại**.
  Nếu cần đồng bộ, bước tiếp theo là thêm một store (Supabase/Upstash) + auth.
- Nội dung không phải tư vấn đầu tư. Người đọc tự thẩm định.
