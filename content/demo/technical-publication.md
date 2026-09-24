# Xuất bản năm khóa kỹ thuật — 24/09/2026

Đã commit trên **Supabase local `pbl6`** lúc `2026-09-24T02:29:37.073Z` (09:29 UTC+7). Biên bản UUID và số lượng: [technical-publication.json](technical-publication.json).

| Đối tượng | Đã xuất bản |
|---|---:|
| Khóa / chủ đề / bài | 5 / 16 / 36 |
| Quiz / kiểm tra chủ đề | 36 / 16 |
| Lesson / assessment / question revision | 36 / 52 / 340 |

294 mục từ và các snapshot được giữ nguyên. Câu hỏi/từ vựng tiếp tục mang trạng thái `active`; publication của câu hỏi nằm ở revision. Tất cả bài giữ `is_preview=false`: khách xem danh mục, người đăng nhập mở bài. Đây là học liệu văn bản/đọc phân vai, chưa có audio mới hoặc thẩm định độc lập của chuyên gia.

## Kiểm chứng

- Trước commit: hash nguồn/biên nhận import khớp, không thiếu hàng hoặc có revision CMS mới; toàn bộ thao tác publish đã chạy thử trong transaction rollback và qua deferred constraints.
- Xuất bản trong một transaction, cùng advisory lock với CMS, không tắt trigger/constraint. Có 5 audit event/biên nhận riêng `materials.publish.technical.v1`.
- Fingerprint của các hàng nghiệp vụ ngoài năm gói nội dung khớp trước/sau publish, kể cả dữ liệu Identity/Learning và các bộ TOEIC. Không reset DB hoặc tạo lại học liệu.
- API learner: đủ 36 bài, 36 quiz, 16 kiểm tra chủ đề, 340 câu; guest bị chặn mở bài kín; đáp án/giải thích/transcript không lộ trước khi được phép. Các lượt kiểm thử thuộc tài khoản riêng và được hủy sau kiểm tra.
- Edge: cả 5 khóa/36 liên kết có trong catalog, mở được 36 bài và nút quiz; không có lỗi JavaScript. Xung đột cùng câu topic test giữa browser và client HTTP thật buộc đối chiếu, xác nhận giữ draft rồi lưu được.
- Publisher tests: verify rollback không đổi timestamp/version, chặn hidden/drift/revision mới, lỗi ở khóa cuối rollback tất cả, chạy lại không đổi version/timestamp hoặc thêm audit event.

## Lệnh vận hành

Cần stack local tại 55321/55322, đủ migration, dữ liệu import hiện có và admin bootstrap active. Công cụ không chấp nhận DB cloud hoặc tự import lại hàng thiếu.

```sh
node scripts/publish-technical-materials.mjs --dry-run
node scripts/publish-technical-materials.mjs --verify-db
node scripts/publish-technical-materials.mjs --apply --expect-hash 9592904934192b1f6a0659eaf5c99a7c4b253ef8b4a7609fee8389a377e962b1
```

Hash dùng cho lần triển khai này được ghi chính xác trong biên bản JSON; luôn đối chiếu kết quả dry-run trước apply. `--dry-run` đọc DB và kiểm tra scope; `--verify-db` thử publish rồi rollback; `--apply` mới commit. Hash publication độc lập với hash importer; không thay hash audit nguồn để vượt qua lỗi drift.

Chạy kiểm thử công cụ:

```sh
node --test tests/materials-publish.test.mjs tests/materials-publish-db.test.mjs
node --test tests/technical-publication-api.test.mjs
node --test tests/technical-publication-web.test.mjs
```

Hai test hậu publish yêu cầu backend/web đang chạy và năm khóa đã published. Test API/web tạo learner và dữ liệu học thử local; không sửa nội dung khóa học. Chúng tách khỏi suite web bootstrap để checkout mới chỉ có fixture cơ bản vẫn chạy được bộ web thông thường.

Nếu hậu kiểm phát hiện nội dung không dùng được, dùng CMS ẩn đúng năm course, giữ revision và lịch sử. Publisher sẽ chặn trạng thái hidden; sau khi sửa nội dung, xuất bản lại qua quy trình revision/CMS, không ép chạy lại importer. Trong lần triển khai này hậu kiểm đạt nên không phải ẩn khóa nào.

Các nguồn JSON, snapshot audit và hash import được giữ nguyên. Hai khóa TOEIC vẫn draft; A1 và IT Fresher không thuộc lần xuất bản này.
