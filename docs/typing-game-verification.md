# Nghiệm thu mini game web

Ghi nhận trong phiên triển khai 21–22/09/2026, branch `codex/typing-game-web`. Môi trường: Windows, Node.js 22.18, Edge headless qua Playwright, Supabase local trong Docker và ba HTTP service thật. Phạm vi: game chép từ tiếng Anh trên web desktop.

## Kết quả

| Kiểm tra | Kết quả |
|---|---|
| Core TypeScript: normalize, target, điểm, deadline, replay | 10/10 đạt |
| API game với Auth và PostgreSQL thật | 7/7 đạt |
| Toàn bộ web Playwright, gồm 6 ca game mới | 24/24 đạt |
| Database regression | 22/22 đạt |
| Backend HTTP regression | 12/12 đạt |
| Search/notes/Dictation regression | 9/9 đạt |
| Typecheck backend, web và mobile | Đạt |
| Build core workspace, backend và web với cấu hình local | Đạt |
| Supabase DB lint | Không có lỗi schema |
| Dựng sạch trong database tạm độc lập | 16 migration và seed đạt; 40 bảng nghiệp vụ |
| Áp dụng migration trên database local đang có | Đạt, không reset dữ liệu |

Tổng **84 test đạt**, không tính lặp các lần chạy lại, typecheck, build và lint. Không có test bị skip trong các bộ nêu trên. Việc typecheck mobile chỉ xác nhận DTO dùng chung không làm hỏng kiểu dữ liệu; không có mini game React Native trong lần triển khai này.

## Các tình huống được kiểm chứng

- Normalize từ, nháy cong, dấu nối, cụm có khoảng trắng; loại ký tự không hỗ trợ và từ trùng.
- Khóa từ theo deadline; phím sai không tăng buffer; backspace/bỏ khóa không cộng điểm; từ đang khóa chạm đáy mất đúng một mạng.
- Deadline xử lý trước input cùng tick; hoàn thành đợt và chuyển đợt; kết quả không phụ thuộc cách chia frame.
- Replay cho cùng kết quả với lượt live; từ chưa xuất hiện không bị tính là lỗi; không thể nộp lượt chưa kết thúc.
- API yêu cầu Auth, internal token và đúng owner; browser SQL role không đọc được bảng game; runtime Learning không đọc schema Content.
- Start idempotent, một lượt đang chơi mỗi user; snapshot không đổi khi bài bị ẩn và nguồn ẩn không tạo được lượt mới.
- Server từ chối điểm client tự khai, manifest sai, sequence sai, input sau terminal và payload vượt 512 KiB.
- Nộp đồng thời/trùng request chỉ lưu một kết quả; payload khác không ghi đè; nộp và hủy cạnh tranh chỉ có một trạng thái cuối.
- Lượt hết hạn không chặn tạo lượt mới; luyện lại tối đa 3 từ bỏ lỡ thuộc đúng user; bảng SRS không thay đổi sau lưu game.
- Web chọn bộ → chơi hết → lưu → reload → lịch sử; từ chứa dấu nối/nháy/khoảng trắng gõ được qua bàn phím thực của Playwright.
- Pause/resume, Tab đổi mục tiêu, cảnh báo điều hướng và token refresh giữ nguyên buffer/lượt.
- Mất mạng lúc finish → pending IndexedDB → reload → retry cùng Idempotency-Key → lưu thành công.
- Reload giữa lượt hiển thị trạng thái gián đoạn; hủy xong cho bắt đầu lượt mới.
- Tab khác không khởi động lại lượt đang mở; logout gỡ nội dung riêng khỏi UI.
- Setup/history ở 390px không tràn ngang và có hướng dẫn dùng bàn phím vật lý.

## Các lỗi phát hiện và đã sửa trong lượt này

1. Thoát lượt gián đoạn điều hướng trước khi API hủy hoàn tất, khiến setup vẫn thấy lượt đang chạy. Đã đợi xác nhận server rồi mới chuyển trang; ca riêng chạy lại đạt, sau đó toàn bộ 24 ca web đạt.
2. Từ chối request quá lớn có thể để HTTP/1 keep-alive socket bị tái sử dụng khi body chưa đọc hết, gây lỗi request tiếp theo. Response 413 của game bổ sung `Connection: close`; bộ 7 ca API, gồm request quá lớn rồi hai request nộp đồng thời, chạy lại đạt.
3. Thiết kế ban đầu yêu cầu ít nhất 5 từ để luyện lại, nhưng game chỉ có 3 mạng nên không đạt được ngưỡng đó. Lượt thường giữ tối thiểu 5 từ; `retry_missed` cho phép 1–3 từ và kiểm tra lại nguồn.

## Kiểm tra giao diện

Đã chụp và xem ảnh setup desktop, sân chơi, kết quả và setup 390px. File ảnh ở `.local/typing-setup.png`, `.local/typing-playing.png`, `.local/typing-result.png`, `.local/typing-mobile-setup.png`; là artifact local, không đưa vào Git. Giao diện dùng màu, typography, menu và cấu trúc card của Sprout; game được lazy-load.

Bộ demo 30 từ gồm ba đợt, có từ cùng tiền tố, cụm nhiều từ, apostrophe và hyphen, được nhập qua `npm run db:typing-demo`. Script giữ nguyên học liệu/người dùng cũ.

## Giới hạn và thao tác môi trường

- Chưa deploy public, đo tải staging/p95, kiểm thử Safari/Firefox, hoặc nghiệm thu bàn phím cảm ứng/app Android.
- Chưa triển khai job tự purge log replay sau 30 ngày. Lịch sử/log hiện giữ trong database local; xem chính sách vận hành trong tài liệu tính năng trước khi deploy public lâu dài.
- Replay kiểm tra tính nhất quán, không ngăn được script giả lập gõ hợp lệ. Không có leaderboard/phần thưởng trong phạm vi này.
- Các test tích hợp tạo tài khoản và fixture local riêng. API game test ẩn course fixture ở bước cleanup; các bộ regression dùng quy ước dữ liệu local sẵn có của repository.
- `tsx` ban đầu bị sandbox chặn `uv_os_get_passwd`; đã chạy lại test core ngoài sandbox và đạt. Docker, migration và Edge được chạy với quyền thực thi local phù hợp. Không có thay đổi secret hoặc đưa credential vào bundle web.

Hướng dẫn chạy, API và xử lý lỗi: [typing-game-web.md](typing-game-web.md).
