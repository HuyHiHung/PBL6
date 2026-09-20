# Kiểm thử backend local — 20/09/2026

Ba service TypeScript/Hono chạy riêng với database role riêng; sử dụng Supabase Auth, Storage và PostgreSQL thật trong Docker. Không dùng mock Auth/database cho bộ HTTP.

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | Đạt, biên dịch TypeScript strict |
| `npm run db:lint` | Không có schema error |
| `npm run db:test` | 22/22 đạt |
| `npm run backend:test` | 12/12 đạt, không skip (cập nhật khi tích hợp frontend) |

Nguồn kiểm chứng: [HTTP tests](../tests/backend.test.mjs), [database tests](../tests/database.test.mjs). Log mới nhất nằm trong `.local/backend-test.log` và `.local/db-test.log`, không commit. Test tạo tài khoản/học liệu riêng ở local; không tự xóa Auth user đã có lịch sử.

## Luồng HTTP đã chạy

1. Từ chối JWT giả/thiếu, lời gọi nội bộ không có token, người học truy cập Admin và payload tự nâng quyền.
2. Guest đọc bài preview và URL audio ký; DTO không chứa đáp án.
3. Chọn lộ trình, mở bài, tạo quiz, che câu chưa kiểm tra, chặn người khác, nộp 4/5 đúng đạt 80%, replay không tạo kết quả mới.
4. Ôn đúng giải quyết câu sai và giữ nguyên điểm quiz cũ.
5. Lưu thẻ nguồn không trùng; đánh giá lặp chỉ đổi lịch một lần; chặn người khác đánh giá.
6. Ẩn học liệu hủy hoạt động đang làm ở lần truy cập kế tiếp, giữ lịch sử đã nộp.
7. Khóa tài khoản chặn JWT hiện tại; mở khóa vẫn cần phiên mới.
8. Thu hồi quyền Editor có hiệu lực với cùng JWT.
9. Đăng xuất chặn access token chưa hết hạn.
10. Tạo/sửa nháp, xuất bản bài và quiz; chặn sửa câu đã xuất bản; tạo bài kiểm tra 10 câu, che đáp án trước nộp, nộp 7/10 đạt 70%.
11. Báo cáo và tổng quan tài khoản yêu cầu quyền; báo cáo theo ngày Việt Nam và người học có profile thật.
12. Thu hồi toàn bộ phiên từ chối hai JWT của hai phiên cũ, vẫn cho phép đăng nhập phiên mới.

## Phần còn lại trước nghiệm thu MVP

Frontend đã có và 7 ca trình duyệt đạt, bao gồm đăng ký/xác minh/reset mật khẩu qua email local và callback PKCE; xem [báo cáo frontend](frontend.md). Google OAuth vẫn cần Client ID/Secret và kiểm thử thực tế. Chưa deploy Supabase Cloud/AWS, cấu hình CI hoặc kiểm thử tải. Lambda adapter đã có nhưng chưa được xác minh trên AWS.

CMS hiện có tạo/sửa nháp, danh mục, media, xuất bản và ẩn. Chưa có endpoint xóa nháp, lời mời Editor qua email và đầy đủ tìm kiếm/phân trang mọi danh sách quản trị. Danh sách câu sai kiểm tra khả dụng qua Content từng câu; cần đo tải và tối ưu lô khi dữ liệu lớn. Các giới hạn này không thay đổi phạm vi SRS.

Migration catalog ngày 20/09 đã áp dụng giữ dữ liệu hiện có, và bộ database được chạy lại. Bằng chứng dựng sạch/bootstrap và fingerprint migration 010 được lưu trong [báo cáo database ngày 19/09](database-verification.md); chưa tuyên bố đã diễn tập dựng sạch toàn bộ chuỗi 11 migration hay backup/restore Cloud.
