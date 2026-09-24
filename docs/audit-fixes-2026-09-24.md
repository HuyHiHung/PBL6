# Sửa lỗi audit và xuất bản học liệu — 24/09/2026

Đã hoàn thành phạm vi bốn lỗi A01–A04 và xuất bản năm khóa kỹ thuật trên Supabase local. Không thay HTTP contract hoặc SQL schema; thay cổng Supabase local để khôi phục môi trường. [Biên bản xuất bản](../content/demo/technical-publication.md) có số lượng, thời điểm, hash và lệnh kiểm chứng.

## Các lỗi đã sửa

| Mã | Thay đổi | Bằng chứng |
|---|---|---|
| A01 | Giữ profile/navigation/draft của cùng tài khoản khi foreground hoặc xác thực nền lỗi mạng/5xx; có thông báo/thử lại. Thu hồi phiên/đổi tài khoản xóa profile và vô hiệu hóa phản hồi cũ | Test mobile foreground offline/503 giữ draft; retry; initial failure; đổi tài khoản; 401/ACCOUNT_LOCKED; lỗi quyền riêng không đăng xuất; phản hồi tài khoản cũ đến muộn |
| A02 | Web giữ version gốc từng draft; 409 lấy snapshot mới, không tự ghi đè. Cùng câu đổi phải chọn bản server/giữ bản nhập; câu/lượt kết thúc giữ draft để đối chiếu nhưng khóa ghi | Playwright các nhánh xung đột, snapshot fetch lỗi, submit 409; hai client thật sửa khác câu quiz và cùng câu topic test |
| A03 | Web tính dirty theo đáp án khác server; chặn rời sidebar/Back/reload, kể cả đang lưu; nộp chỉ khi hết dirty | Playwright xác nhận giữ/bỏ draft, guard còn trong request đang chờ, hết cảnh báo sau lưu, chọn lại đáp án gốc không còn dirty |
| A04 | Mobile chỉ chọn item pending khi phiên in_progress; cancelled/completed chỉ hiện kết thúc. Rating lỗi tải lại session | Test cancelled có pending không có nút đánh giá; phiên bị hủy từ client khác trong lúc rating chuyển sang màn hình kết thúc |

Mobile vẫn chỉ được kiểm chứng bằng React Native renderer/native mocks và client/API thật. Đợt này không nghiệm thu navigation hệ điều hành, APK, process kill hoặc điện thoại Android. Draft được bảo toàn trong app đang mở; không bổ sung cơ chế lưu draft offline qua restart.

## Phục hồi môi trường

Windows dành riêng dải 54228–54327; Docker không bind được 54321–54324. Đã sao lưu DB ở định dạng custom, roles và Storage, kiểm tra archive list rồi dừng/khởi động stack bằng Supabase CLI, giữ volumes. Dải cũ vẫn bị Windows chặn.

Thao tác dừng WinNAT bị automatic approval review từ chối vì có thể ảnh hưởng mạng toàn máy; không thực hiện. Thay vào đó chỉ đổi cấu hình project sang **55320–55324** sau khi thử bind thành công. Đồng bộ guard local, env mẫu, mailbox test, ADB reverse, runtime URLs và cấu hình public mobile. Mật khẩu runtime giữ nguyên. Backend/Auth/Studio/mail đã kết nối thành công; không reset DB hoặc bootstrap/import lại học liệu.

Địa chỉ hiện tại: web `http://localhost:5173`, Auth/Storage `http://127.0.0.1:55321`, DB `127.0.0.1:55322`, Studio `http://127.0.0.1:55323`, mail `http://127.0.0.1:55324`. Xem [hướng dẫn local](local-development.md) khi cập nhật checkout khác đang dùng cổng cũ.

## Kết quả kiểm thử mới

| Bộ kiểm tra | Kết quả |
|---|---:|
| Backend/shared, web, mobile typecheck | Đạt cả ba |
| Backend/shared build và web production bundle | Đạt |
| SQL lint | Không có lỗi schema |
| Clean migration + seed trên database tạm | Đạt: 16 migration, 40 bảng nghiệp vụ |
| Database | 22/22 |
| Backend HTTP | 12/12 |
| Search/notes/Dictation | 9/9 |
| Mobile API integration | 1/1 |
| Typing API | 7/7 |
| Typing engine | 10/10 |
| Mobile client unit | 8/8 |
| Mobile UI/native mocks | 18/18 |
| Materials/import-plan/TOEIC/publication unit | 32/32 |
| Materials import DB, transaction rollback | 1/1 |
| Publication DB, transaction rollback | 1/1 |
| Web Playwright/Edge | 35/35 |
| Hậu publish: toàn bộ 36 bài/52 assessment qua API | 1/1 |
| Hậu publish: 36 bài trên Edge và topic conflict thật | 1/1 |

**Tổng 158 test đạt**, không skip trong các bộ trên. Typecheck/build/lint/clean migration không tính thêm vào tổng số test.

Các lỗi trong quá trình xây test đã xử lý: fixture thử revision mới ban đầu vi phạm quy tắc một draft/lesson; test reload cần timeout ngắn vì thao tác bị người dùng hủy; test last-active-admin cũ giả định chỉ có một admin. Test DB hiện thử khóa tất cả admin active bên trong savepoint luôn rollback, nên vẫn kiểm chứng đúng ràng buộc mà hỗ trợ workspace có nhiều admin. Không nới constraint để làm test đạt.

## Kết quả học liệu

- Đã commit 5 course, 16 topic, 36 lesson và 52 assessment published; 340 question revision được xuất bản; giữ 294 mục từ và snapshot.
- Dữ liệu nguồn/import hash, quyền preview và cấu trúc bài được giữ nguyên; nguồn TOEIC/A1/IT Fresher không đổi.
- Fingerprint toàn bộ hàng nghiệp vụ ngoài năm gói khớp trước/sau commit. Các tài khoản/lịch sử kiểm thử sau đó thuộc fixture riêng.
- Hậu kiểm API xác nhận đủ 340 câu trong 52 assessment và không lộ answer key trước khi được phép; Edge mở đủ 36 bài, không có lỗi JavaScript.

Biên bản an toàn để theo dõi trong Git: [technical-publication.json](../content/demo/technical-publication.json). Log chi tiết, archive backup và dữ liệu fixture nằm trong `.local` bị Git ignore; không chia sẻ backup/credential như tài liệu người học. Các kết quả ngày 23/09 được giữ nguyên trong [audit gốc](audit-2026-09-23.md) để phân biệt bằng chứng trước và sau bản sửa.
