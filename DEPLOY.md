# Hướng dẫn deploy — chọn MỘT trong hai

Code đã sẵn sàng: build pass, validator pass, git repo đã commit, branch `main`.
Việc còn lại chỉ là đẩy lên host. Anh cần làm vì cần đăng nhập tài khoản của anh.

Trước khi deploy, chạy kiểm tra:

```bash
cd dashboard
npm run check      # validate nội dung + typecheck + build
```

---

## Cách 1 — Vercel (khuyến nghị, nhanh nhất, đúng ý "dùng trên PC lẫn điện thoại")

### 1a. Bằng GitHub (dễ nhất, không cần cài gì)

```bash
cd dashboard
git remote add origin https://github.com/<TÊN_ANH>/daily-brief.git
git push -u origin main
```

Rồi trên vercel.com: **Add New… → Project → Import Git Repository** → chọn repo.

- Framework Preset: **Next.js** (Vercel tự nhận)
- **Root Directory:** nếu anh push nguyên repo `News` thì phải trỏ vào `dashboard`.
  Nếu push riêng thư mục `dashboard` thì để mặc định `./`
- Build Command / Output: **để trống**, Vercel tự dùng `next build`
- Bấm **Deploy** → khoảng 40–60 giây

### 1b. Bằng CLI

```bash
npm i -g vercel
cd dashboard
vercel login
vercel --prod
```

CLI sẽ hỏi vài câu; cứ nhận giá trị mặc định vì `vercel.json` đã cấu hình sẵn.

### Sau khi có link

Vercel cho dạng `https://daily-brief-xxxx.vercel.app`. Mở trên điện thoại →
Share → **Thêm vào MH chính** để dùng như app (đã có manifest + icon).

---

## Cách 2 — Render

Đã có `render.yaml`. Trên dashboard.render.com:

**New + → Blueprint** → chọn repo → **Apply**.

Nếu Render báo không tìm thấy project trong repo `News`, sửa `rootDir` trong
`render.yaml` cho khớp, hoặc tạo **Web Service** thủ công:

| Trường | Giá trị |
|---|---|
| Language | Node |
| Root Directory | `dashboard` (hoặc để trống nếu repo chỉ chứa dashboard) |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Region | Singapore |
| Instance Type | Free |

`npm start` đã tôn trọng biến `PORT` mà Render tự gán (đã test với PORT=4321 → HTTP 200).

> Gói free của Render **ngủ sau ~15 phút** không truy cập. Lần mở đầu tiên chậm ~30–60 giây.
> Vercel free thì không ngủ với site tĩnh như thế này — nên Vercel phù hợp hơn để dùng hằng ngày.

---

## Cách 3 — Docker (Railway / Fly.io / VPS)

Có sẵn `Dockerfile` nhiều tầng (node:22-alpine, chạy bằng user không phải root).

```bash
docker build -t daily-brief .
docker run -p 3000:3000 daily-brief
```

---

## Sau khi deploy — thêm tin hằng ngày

1. Tạo `content/news/YYYY-MM-DD.json` (xem mẫu `2026-11-05.json`)
2. `npm run validate` để chắc không lỗi
3. Commit + push → Vercel/Render tự build lại

Không cần sửa code, không cần database.

---

## Nếu muốn favourite đồng bộ giữa PC và điện thoại

Hiện favourite lưu ở `localStorage` từng thiết bị. Để đồng bộ cần thêm backend.
Hướng gợi ý (chưa làm, cần anh chốt):

- **Supabase** (Postgres + auth, free tier rộng) — bảng `favourites(user_id, item_id)`
- hoặc **Upstash Redis** nếu chỉ cần lưu nhanh, không cần đăng nhập phức tạp

Đây là thay đổi kiến trúc, không chỉ là config, nên em không tự ý làm.
