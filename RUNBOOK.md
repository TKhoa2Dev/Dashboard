# RUNBOOK — Quy trình làm bản tin hằng ngày

File này để phiên làm việc **sau** (không có ký ức về phiên trước) đọc và chạy đúng ngay,
không phải dò lại từ đầu.

---

## 0. Kích hoạt

Người dùng nhắn một câu kiểu *"làm bản tin hôm nay"*. Đó là tín hiệu bắt đầu.
Không cần hỏi lại quy trình.

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
- Chọn **đúng 5 tin**, cân bằng AI / công nghệ / tiền mã hóa / tài chính. Không ép đủ lĩnh vực
  nếu không có tin đủ chất lượng — thiếu thì nói rõ thiếu.

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
