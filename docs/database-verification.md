# Kết quả triển khai và kiểm thử database

Ngày kiểm tra: **19/09/2026**, môi trường Windows + Docker Desktop 4.90.0, Docker Engine 29.7.2, Supabase CLI 2.117.0, PostgreSQL 17 (image 17.6.1.167). Chỉ kiểm thử local; chưa kiểm thử Cloud/AWS hoặc frontend/backend HTTP.

## Kết quả thực tế

| Kiểm tra | Kết quả |
|---|---|
| Khởi động stack Docker | 8 container Supabase đang chạy; các container có healthcheck báo healthy |
| HTTP Studio / hộp thư / Auth health | Cả ba trả HTTP 200 |
| Migration từ database sạch | 10/10 file chạy thành công qua `db reset --local`, seed chạy sau migration |
| Cấu trúc | 33 bảng: Identity 4, Content 16, Learning 13; bật RLS tất cả bảng |
| Runtime role thực | Ba kết nối riêng truy cập được schema mình và bị từ chối schema khác; anon/authenticated không đọc bảng/hàm private |
| Bootstrap | 3 user tạo qua Auth Admin API, 3 profile, bài + quiz 5 câu, thẻ cá nhân, private bucket/object |
| Bootstrap lần hai | Fingerprint cả 33 bảng và tập UUID Auth không đổi |
| Nâng cấp có dữ liệu | Áp migration 010 lên database đã có 001–009, tài khoản và dữ liệu test đã commit; fingerprint cả 33 bảng và UUID Auth không đổi |
| SQL lint | `npm run db:lint`: không có schema error |
| Test tích hợp sau dựng sạch | `npm run db:test`: **22/22 ca đạt**, không skip |

Nguồn thực thi là [bộ kiểm thử](../tests/database.test.mjs), [script bootstrap](../scripts/bootstrap-local.mjs), [kiểm tra fingerprint](../scripts/check-upgrade.mjs) và [migration](../supabase/migrations). Log local gần nhất ở `.local/db-test.log`, `.local/db-reset.log`; log không được coi là dữ liệu để commit.

## Những hành vi đã chứng minh

- PK/FK, RLS và quyền runtime; ngoại lệ FK sang auth chỉ dành cho profiles.
- Không mất admin active cuối cùng; không cấp quyền Editor cho người học; audit không sửa/xóa được bằng runtime.
- Bản xuất bản, option/key và object key media bất biến; pointer sai cha/nháp bị chặn; không có hai draft cùng nội dung.
- Không xuất bản MCQ chỉ có một option hoặc đề thiếu câu; draft chưa hoàn chỉnh vẫn lưu được.
- Ẩn bài cuối không xóa snapshot và có tăng catalog version.
- Snapshot lượt làm phải đầy đủ; không thêm item sau transaction tạo; không có hai lượt quiz cùng người/đề hoặc hai phiên thẻ cùng người.
- Nộp bài lưu điểm/tiến độ/câu sai nhất quán; rollback trước commit không để dữ liệu hoặc dedup treo; replay không tăng generation.
- Version cũ không ghi đè; câu checked bị khóa; lời gọi nộp bài với user khác bị từ chối.
- Lượt review cũ không xóa lần sai mới; review cùng generation giải quyết được mục sai.
- Topic test không kiểm tra từng câu trước nộp; 7/10 đạt nhưng không tự hoàn thành bài.
- Chuẩn hóa chữ hoa/thường, whitespace, Unicode NFC; không bỏ dấu câu.
- Lịch thẻ 24/72/168/336 giờ; bậc cuối giữ 14 ngày; gửi lặp không tăng bậc; reset/xóa bỏ qua item cũ; khôi phục giữ một thẻ nguồn.
- Hai kết nối thật nộp cùng key/đánh giá cùng key chỉ có một hiệu lực; tạo cùng quiz chỉ một transaction thành công.
- Email/password tạo phiên Auth thật; narrow session lookup nhận đúng chủ sở hữu, không cấp SELECT auth.sessions; logout phiên đó làm lookup không còn kết quả.
- Media tải được bằng quyền server, endpoint public không tải được object private.

## Phạm vi chưa được kiểm chứng

22 test tự động không đồng nghĩa hoàn thành toàn bộ 21 nhóm DB hoặc các AT trong thiết kế/SRS. Cập nhật 20/09: ba HTTP service đã chạy, kiểm chứng DTO, khóa/thu hồi quyền, nội dung ẩn và báo cáo bằng 12 test trong [báo cáo backend](backend-verification.md). [Frontend](frontend.md) có 7 test trình duyệt, gồm đăng ký/xác minh/reset mật khẩu đầu cuối bằng email local. Google OAuth chưa bật và chưa thử liên kết Google/email; cần credential để kiểm thử callback thực tế.

Nâng cấp đã thử là migration 010 giữ nguyên dữ liệu; chưa có phép backfill chuyển đổi schema lớn hoặc diễn tập backup/restore Cloud. Chưa chạy kiểm thử tải/CI trên runner khác. Media bootstrap là fixture im lặng và học liệu chỉ đủ smoke test, chưa phải bộ nội dung nghiệm thu MVP.
