# RUNBOOK — Quy trình làm bản tin hằng ngày

File này để phiên làm việc **sau** (không có ký ức về phiên trước) đọc và chạy đúng ngay,
không phải dò lại từ đầu.

---

## 0. Kích hoạt

### Chế độ A — Tự động (đã dựng, cần 1 bước của người dùng)

GitHub Actions chạy **06:17 giờ Bangkok** (`cron: "17 23 * * *"` UTC), lượt dự phòng
07:47 Bangkok (`cron: "47 0 * * *"`). Mỗi ngày:
`ingest.mjs` → `generate.mjs` → `write-bulletin.mjs` → `validate` → `build` → commit → Vercel tự deploy.

**KHÔNG đặt cron đúng phút 0.** GitHub ghi rõ schedule bị trễ nặng vào đầu mỗi giờ, có thể bị
bỏ (dropped). Lần chạy 06/11 đã trễ từ 06:00 lên **10:10 Bangkok** vì đúng lý do này.

Hai lượt không tạo bản tin trùng vì `write-bulletin.mjs` **idempotent**:
đã có file hôm nay thì dừng (exit 0), không ghi đè.

**Điều kiện duy nhất:** phải có secret `ANTHROPIC_API_KEY` trong
`Settings → Secrets and variables → Actions`. Chưa có secret thì job dừng ở bước gọi model.

Có thể bấm **Run workflow** để chạy tay (workflow_dispatch).

Chạy thủ công trên máy:

```powershell
$env:ANTHROPIC_API_KEY = (Get-Content 'C:\Users\LENOVO\Documents\api.txt' -Raw).Trim()
npm run bulletin
```

### Chế độ B — Người dùng nhắn "làm bản tin hôm nay"

Agent làm tay toàn bộ, có kiểm chứng nguồn. Chất lượng cao hơn chế độ A.

---

## 0.1 Các lớp chống bịa của pipeline tự động

Trong `generate.mjs`, sai là **hủy cả bản tin** (exit 3), không đẩy lên web:

1. **Model chỉ chọn số thứ tự `n`** trong danh sách tin thật. Không tự sinh tin.
2. **URL / tiêu đề gốc / ngày lấy từ RSS**, không lấy từ model.
3. **Bắt buộc trích nguyên văn (`quote`)** từ nguồn; so khớp từng ký tự sau khi chuẩn hoá.
   Lớp mạnh nhất — model không thể bịa mà vẫn khớp.
4. **Cảnh báo (không chặn)** khi tên riêng của nguồn không thấy trong bản dịch
   (Congress → Quốc hội là hợp lệ).
5. **Ít nhất 4 lĩnh vực**, không lĩnh vực nào quá 4/10 tin.
6. `validate-content.mjs` kiểm schema, id duy nhất, URL http(s), nguồn primary.

Lớp 3 đã bắt được lỗi thật: model viết về **Ukraine** nhưng gán URL bài **Hong Kong**.

---

## 0.2 Bẫy ngày tháng (đã gặp, đừng lặp lại)

Tên file phải theo **giờ Bangkok**, không phải UTC. Lúc 02:00 sáng Bangkok thì UTC vẫn là
ngày hôm trước → dùng UTC sẽ **ghi đè bản tin cũ**.

`write-bulletin.mjs` dùng `Intl.DateTimeFormat` với `timeZone: "Asia/Bangkok"` và
**từ chối ghi nếu file đã tồn tại** (exit 4).

---

## 1. Gọi model phân tích — CẤU HÌNH ĐÃ KIỂM CHỨNG

| Thông số | Giá trị |
|---|---|
| Base URL | `https://apiclan.us/v1` |
| Định dạng API | **Anthropic Messages** — `POST /v1/messages` |
| Model ID | **`claude-sonnet-5-5`** |
| Header | `x-api-key: <key>`, `anthropic-version: 2023-06-01`, `content-type: application/json` |
| Key | đọc từ `C:\Users\LENOVO\Documents\api.txt` — **không in ra, không commit** |

### Ba cái bẫy đã gặp (đừng lặp lại)

1. **Không dùng `POST /v1/chat/completions`** cho model Claude — endpoint đó chỉ có model GPT.
   `/v1/models` dạng OpenAI trả **401** với key Claude.
2. **Model ID là `claude-sonnet-5-5`** (gạch nối). Chuỗi `"Claude Sonnet 5.5"` trả
   `404 model_not_found`.
3. **Không gửi tham số `temperature`** — model trả
   `400 "does not support non-default temperature"`.

### Phải trung thực

Nếu không gọi được đúng model, đặt `model.verified = false` trong JSON và ghi rõ lý do
trong `model.note`. Dashboard sẽ tự hiện **khung vàng cảnh báo**. Tuyệt đối không giả vờ
đã gọi model.

---

## 2. Thu thập tin

- Cửa sổ: **24 giờ gần nhất**, múi giờ **Asia/Bangkok**. Tin quan trọng nằm ngoài cửa sổ
  thì ghi rõ ngày đăng + lý do chọn.
- Nguồn tham khảo (RSS, tải qua HTTPS):
  `feeds.arstechnica.com`, `techcrunch.com/feed`, `coindesk.com/arc/outboundfeeds/rss`,
  `theverge.com/rss/index.xml`, `hnrss.org/frontpage`
- Nếu một trang chặn bot (Ars trả 405, CoinDesk 429), dùng **`https://r.jina.ai/<url>`** để lấy текст.
- Giá thị trường: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true`
- Chọn **đúng 10 tin**, trải trên 7 lĩnh vực: AI, Công nghệ, MMO, Startup, Kinh tế,
  Tiền mã hóa, Tài chính. Không ép đủ lĩnh vực nếu không có tin đủ chất lượng — thiếu thì nói rõ thiếu.

### Mỗi tin phải có

- Ít nhất 1 **nguồn trực tiếp** (`role: "primary"`). Tin ảnh hưởng lớn: thêm nguồn
  kiểm chứng độc lập (`role: "cross-check"`).
- Ngày đăng đã xác minh.
- Tách bạch: **dữ kiện xác nhận** / **nhận định của nguồn** / **suy luận của mình**.
- `caveat` nếu số liệu chưa xác minh.

> Bài học: con số "tổng doanh thu 2026 = 10,4 tỷ USD" của The Verge (Qualcomm) là **sai lệch
> ngữ cảnh** — không dùng để tính tỷ trọng. Luôn nghi ngờ số liệu không kiểm chứng được.

---

## 3. Ghi nội dung

Tạo `content/news/YYYY-MM-DD.json`. Schema: `src/lib/types.ts`, mẫu: `2026-11-05.json`.

- `id` dạng `YYYY-MM-DD-slug`, **duy nhất toàn hệ thống** (favourite lưu theo id)
- `model` ghi đúng những gì đã thực sự gọi
- `telegram` ghi đúng đã gửi hay chưa

Kiểm tra trước khi commit:

```powershell
cd C:\Users\LENOVO\Documents\deepseek-harness\default-workspace\News\dashboard
npm run check      # validate + typecheck + build
```

Validator bắt: JSON hỏng, sai `date`, trùng `id`, sai lĩnh vực, URL không phải http(s),
thiếu nguồn primary, `model.verified=true` mà thiếu `usedModelId`.

---

## 4. Push — Vercel tự deploy

```powershell
cd C:\Users\LENOVO\Documents\deepseek-harness\default-workspace\News\dashboard
git add -A
git commit -m "Bulletin YYYY-MM-DD"
git push
```

Vercel **tự build lại** sau khi push (auto-deploy). Không cần chạy lệnh deploy.

Repo: `https://github.com/TKhoa2Dev/Dashboard` — identity đã đặt ở mức repo
(`TKhoa2Dev` + email noreply), **không** đụng config global của người dùng.

Sau khi push, kiểm chứng trên production:

```powershell
node tests\prod.spec.cjs
```

---

## 5. Telegram — CHƯA CẤU HÌNH

Không có `TELEGRAM_BOT_TOKEN` hay chat ID ở bất kỳ đâu (đã quét: credential store,
env, `workspace.json`, Documents/Desktop/Downloads). **Không tuyên bố đã gửi.**
Ghi `telegram.delivered = false` + lý do.

Nếu sau này có token: gửi bằng `POST https://api.telegram.org/bot<TOKEN>/sendMessage`,
chia nhỏ dưới 4.096 ký tự, giữ thứ tự, **không gửi trùng trong cùng ngày**.

---

## 6. Bẫy môi trường (Windows / DSH)

1. **`[IO.File]::WriteAllText` với đường dẫn tương đối sẽ ghi sai chỗ** (nó dùng process cwd,
   không phải `cd` của PowerShell). → **Luôn dùng đường dẫn tuyệt đối.**
2. **Sandbox `workspace-write` chặn HTTPS** (TLS `SEC_E_NO_CREDENTIALS`), chỉ HTTP chạy.
   Cần full access cho mọi lệnh gọi API/tải trang.
3. **Không dùng `text-transform: uppercase`** cho chữ tiếng Việt — làm mất dấu
   ("Tin chính" → "TIN CHINH").
4. Chụp màn hình mobile: `chrome --window-size=390,...` bị cắt do Chrome có bề ngang tối thiểu.
   Dùng **puppeteer `setViewport`** với `isMobile: true` để có kết quả thật.

---

## 7. Việc chưa làm

- **Chưa tự động cập nhật** — không có cron/CI. Người dùng ping mỗi ngày.
- **Favourite chưa đồng bộ** giữa PC và điện thoại (đang dùng `localStorage`).
  Muốn đồng bộ cần backend (Supabase/Upstash + auth) — chưa chốt, chưa làm.
