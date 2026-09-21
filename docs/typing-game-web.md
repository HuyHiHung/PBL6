# Vườn từ vựng — mini game web

Bản local ngày 21/09/2026, branch `codex/typing-game-web`. Người chơi nhìn từ tiếng Anh đang rơi rồi gõ lại; điểm game độc lập với quiz, hoàn thành bài học và lịch SRS. [Thiết kế gốc](typing-game-web-plan.md).

## Chạy và chơi thử

Giữ Supabase local đang chạy, sau đó:

```sh
npm run db:migrate
npm run db:typing-demo
npm run build
npm run backend:start
```

Mở terminal khác:

```sh
npm run web:dev
```

Đăng nhập tại `http://localhost:5173`, chọn **Mini game** hoặc mở `http://localhost:5173/#/games/typing`. Chọn bài **Vườn từ vựng — Everyday English** để chơi với 30 từ do dự án tự biên soạn. Script demo chỉ thêm học liệu riêng và chạy lại không ghi đè bài đã có. Tài khoản local dùng theo README; không có mật khẩu cố định trong mã.

`db:typing-demo` cần bootstrap tài khoản đã chạy trước (`npm run db:bootstrap`). Bộ demo có quiz 5 câu để tuân thủ quy tắc xuất bản bài học của CMS hiện tại; game không nộp hoặc thay đổi quiz đó.

## Chức năng

- Chọn từ của một bài đã xuất bản hoặc thẻ cá nhân; có phân trang nguồn bài học.
- Dễ/Vừa/Khó, tối đa 30 từ chia đợt 10 từ, 3 mạng, điểm/combo/accuracy/WPM.
- Gõ chữ đầu khóa từ sắp chạm đáy nhất có tiền tố khớp. Phần đã gõ đổi màu; phím sai không làm dài buffer.
- Tab bỏ khóa; Backspace lùi buffer; Esc tạm dừng. Chuyển tab/mất focus tự pause, tiếp tục có đếm ngược.
- Bật/tắt âm thanh. Chỉ nhận phím trong sân chơi; không bắt shortcut Ctrl/Alt/Meta hoặc composition của IME.
- Kết quả đã lưu, lịch sử riêng, chơi lại và luyện từ bỏ lỡ. Lượt luyện lại cho phép 1–3 từ; lượt thông thường tối thiểu 5 từ.
- Không cộng XP hoặc tự thay đổi trạng thái nhớ từ. WPM là tốc độ trong game, không phải bài đo gõ văn bản tiêu chuẩn.

## Cấu trúc và API

`packages/typing-core/src/index.ts` là engine thuần TypeScript dùng chung cho Vite và backend. Workspace có build JavaScript/declarations riêng; build backend cũng biên dịch các import tương đối vào `dist/packages/typing-core`.

`apps/web/src/games/typing` gồm setup/history/routes (`index.tsx`), sân chơi (`play.tsx`), kết quả (`result.tsx`), HTTP/pending IndexedDB (`client.ts`) và CSS riêng. Bundle game chỉ tải khi mở route game.

Content và Learning đăng ký module `typing.ts` vào service hiện có. Learning dùng Identity để xác thực, Content internal API để lấy bộ từ published trong một lần. Thẻ cá nhân lấy từ schema Learning, chỉ theo owner.

| Service | API |
|---|---|
| Content | `GET /v1/typing-sources?page=1&course_id=...&topic_id=...` |
| Content internal | `POST /internal/typing-snapshot` với `lesson_id` |
| Learning | `GET /v1/typing-sources/personal?topic_id=...` |
| Learning | `POST /v1/typing-sessions` với source, difficulty, limit |
| Learning | `GET /v1/typing-sessions?page=1` và `GET /v1/typing-sessions/:id` |
| Learning | `POST /v1/typing-sessions/:id/finish` và `/abandon` |

Public API yêu cầu phiên; internal API yêu cầu service token. POST yêu cầu `Idempotency-Key`. Source có ba loại: `lesson`, `personal_cards`, `retry_missed`. Kết quả start là DTO đầy đủ gồm `id`, `user_id`, `source`, `title`, `config`, `manifest_hash`, `items`, `expires_at`. DTO TypeScript nằm trong `packages/api-client/src/typing.ts` và được export từ `types.ts`.

Finish nhận `manifest_hash`, `final_tick`, `events`. Server không nhận score do browser khai báo mà replay cùng core rồi tính kết quả. Hai lần nộp đồng thời chỉ có một trạng thái kết thúc; cùng submission có thể retry, nội dung khác bị từ chối. Request vượt 512 KiB nhận 413 và đóng HTTP/1 connection để tránh tái sử dụng socket còn body chưa đọc.

## Database và quy tắc nguồn

Migration `20260921000100_typing_game.sql` thêm `learning.typing_game_sessions` và `learning.typing_game_items`. Snapshot item được lưu thành JSONB, kèm các cột `id`, `user_id`, `session_id`, `position`, `normalized_answer` để ràng buộc quan hệ/thứ tự/từ trùng. Config chứa version luật; summary trong `result`, score có cột generated để truy vấn.

Snapshot chỉ được tạo cùng transaction tạo lượt; không sửa/xóa sau đó. Session đã kết thúc không được sửa. RLS bảo vệ ranh giới runtime service; các API kiểm tra owner trong mọi truy vấn. Không có FK chéo service. Một user có tối đa một lượt `in_progress`; các lượt quá hạn được expire trước khi tạo mới.

Từ được normalize NFC/lowercase, gộp khoảng trắng, đổi nháy cong thành nháy thẳng. Chỉ nhận 2–40 ký tự từ a–z với khoảng trắng, dấu nháy/nối ở giữa các nhóm chữ. Loại từ trùng và từ không hỗ trợ. Thẻ cá nhân xét tối đa 1.000 thẻ theo due_at/id; UI thông báo khi có nhiều hơn. Các trường hợp như C++, số và từ có dấu ngoài ASCII chưa hỗ trợ.

Lượt từ bài dùng snapshot của lesson revision đã published. Sửa hoặc ẩn bài không thay đổi snapshot đang chơi; ẩn bài chặn lượt mới. Retry từ bỏ lỡ kiểm tra lại từ/bài/thẻ hiện hành, không tin danh sách từ do client đưa lên. Thẻ đã xóa được loại khỏi retry.

## Phục hồi và giới hạn

- Tối đa 10.000 input events và 10 phút thời gian mô phỏng; session có hạn lưu 30 phút tính từ server.
- Kết quả chưa gửi được lưu vào IndexedDB theo user/session, giữ nguyên payload/key qua reload. Lỗi IndexedDB hiển thị cảnh báo giữ trang mở. Hết TTL không lưu thành kết quả chính thức.
- Reload giữa lượt không khôi phục vị trí rơi; UI yêu cầu kết thúc lượt cũ trước khi bắt đầu lại. Kết quả đã hoàn thành nhưng chưa gửi được thì tiếp tục retry.
- Cùng user refresh token không reset game; đổi user/logout xóa cache riêng và dừng cây UI cũ. HTTP client xác minh đúng user trước và sau request.
- Web Locks ngăn hai tab cùng điều khiển một lượt. Nếu không có Web Locks hoặc không lấy được lock, UI chặn bắt đầu và hướng dẫn dùng Chrome/Edge/đóng tab kia. Server vẫn xử lý tranh chấp độc lập với lock phía browser.
- Sau khi bấm kết thúc, chỉ điều hướng về setup khi server xác nhận hủy. Khi request hủy lỗi mạng, giữ trang và cho thử lại cùng key; không dựa vào unload request.
- Bản này nghiệm thu trên Edge desktop. Web nhỏ xem setup/history được; chưa hỗ trợ bàn phím cảm ứng để chơi trên điện thoại, chưa triển khai React Native.
- Server replay bảo đảm nhất quán luật/điểm, không chứng minh người thật đã gõ. Chưa dùng cho leaderboard/phần thưởng.

## Flag và phát hành

- `VITE_TYPING_GAME_ENABLED=false`: ẩn entry game và chặn màn hình game trong bản build web.
- `TYPING_GAME_ENABLED=false`: đặt vào environment của Content/Learning khi chạy; Learning từ chối tạo lượt mới nhưng vẫn cho finish/history. Các launcher hiện tại không tự nạp `.env`; set biến trong shell/deployment environment. Sau đổi backend phải restart, sau đổi frontend phải restart dev hoặc build lại.
- Upgrade: migrate → build/restart backend → build web. Rollback bằng tắt tạo lượt mới và dùng backend còn hiểu rules v1 cho đến hết TTL; không drop bảng lịch sử.
- Chưa deploy public, chưa chạy thử tải staging, chưa đo SLA p95 và chưa nghiệm thu Safari/Firefox. Không gọi các mục tiêu trong bản thiết kế là kết quả đã đo.
- Log replay hiện giữ cùng lịch sử local. Chính sách purge tự động sau 30 ngày trong thiết kế chưa triển khai; cần migration/job riêng trước khi sử dụng lâu dài trên public. Log ứng dụng không chứa raw keys/token.

## Kiểm thử

```sh
npm run typing:test
npm run build
npm run typing:test:api
npm run web:typecheck
npm run web:build:local
npm run web:test
npm run db:lint
npm run db:test
npm run db:test:clean
```

Các integration/E2E tạo tài khoản và fixture riêng trên local. API test ẩn course fixture khi kết thúc. Không chạy những bộ test này trên public. [Kết quả nghiệm thu](typing-game-verification.md).
