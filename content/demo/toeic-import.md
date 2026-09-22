# Import TOEIC local — 22/09/2026

Đã commit hai khóa **500–700** và **700–990** vào Supabase local `pbl6` dưới dạng **draft**, chưa xuất bản. Đọc lại xác nhận lúc `2026-09-22T01:25:11.478Z`.

| Đối tượng | Số lượng |
|---|---:|
| Khóa | 2 |
| Chủ đề Listening/Reading | 4 |
| Bài và lesson revision | 16 / 16 |
| Mục từ và snapshot | 128 / 128 |
| Câu hỏi và question revision | 120 / 120 |
| Phương án | 462 |
| Answer key | 120 |
| Assessment và revision | 16 / 16 |
| Liên kết câu hỏi | 120 |
| Biên nhận trong audit_events | 2 |

Khóa, chủ đề, bài và assessment đều `draft`; bài không bật preview. Không revision nào có `published_at`. Từ vựng và question root dùng `active` theo schema nhưng chưa có revision xuất bản.

## Ánh xạ và giới hạn

- Mỗi khóa có hai topic Listening và Reading, mỗi topic bốn bài. Mỗi bài có một assessment nháp, giữ đúng số câu nguồn: 3/9/6/6/12/8/6/10.
- Không thêm hoặc bỏ câu để ép giới hạn quiz. DB hiện chỉ cho xuất bản quiz 5–10 câu; Part 1 và Part 5 chưa phù hợp giới hạn này. Không chạy thử publication cho bộ TOEIC và không tắt validator. Ngưỡng 70% trong assessment là giá trị schema hiện tại, không phải quy đổi điểm TOEIC.
- Nhóm câu được giữ liên tiếp, nhãn nhóm/câu rõ trong prompt. Passage dùng lại đầy đủ tài liệu và bảng của nhóm; bảng được lưu thành văn bản theo hàng/cột. ID và vị trí nhóm còn nằm trong `.local/toeic-import-plan.json` và JSON nguồn. DB chưa có entity nhóm TOEIC hoặc trình phát nghe theo nhóm; đây là import nội dung để duyệt, chưa triển khai trải nghiệm thi TOEIC đầy đủ.
- Transcript, mô tả sản xuất ảnh và script lựa chọn Part 2 nằm trong `question_answer_keys.transcript`. Đáp án, giải thích và bằng chứng ở answer key, không nằm trong lesson blocks hoặc question passage. Phương án lựa chọn vẫn lưu trong bảng options theo schema; cần giao diện Part 1–2 phù hợp trước khi dùng làm bài nghe.
- Tất cả `audio_asset_id` là null. Không tạo media giả, không đưa transcript vào nội dung bài học. 48 câu Listening vẫn chờ audio; sáu ảnh Part 1 chưa có. Chưa thể xuất bản chỉ dựa vào việc import thành công.
- UUID ổn định theo key. Dùng lại transaction, CMS advisory lock, kiểm tra admin local, collision/drift và biên nhận của importer kỹ thuật; không sửa khóa cũ hoặc lịch sử học.

## Kiểm chứng

1. 16/16 kiểm thử học liệu và ánh xạ TOEIC đạt; kiểm tra giữ passage, bảng, options, private transcript và key không trùng.
2. Import thử toàn bộ trong transaction rồi rollback thành công; chạy kiểm tra idempotency trong transaction.
3. `--apply` commit cả hai khóa trong một transaction.
4. Đọc lại mọi hàng theo kế hoạch bằng `inspectImport`: cả hai khóa trả `skip-identical`. Xác nhận số lượng/trạng thái nháp và không có revision xuất bản. Bản ghi đã có sẽ được bỏ qua khi chạy lại cùng nguồn.

Biên bản chi tiết local: `.local/toeic-import-result.json`. Các file `.local` có dữ liệu đáp án, không đưa lên frontend hoặc chia sẻ như tài liệu người học.

## Lệnh sử dụng

```sh
node scripts/import-toeic-materials.mjs --dry-run
node scripts/import-toeic-materials.mjs --verify-db
node scripts/import-toeic-materials.mjs --apply --expect-hash cb8433c055101642b5fe00566714a6557e0ab4ff190fe666b878e72cbbac0fd1
```

`--verify-db` chỉ thử ràng buộc draft và luôn rollback; không kiểm tra publication. Importer chỉ nhận Supabase local pbl6. Nguồn hoặc hàng CMS đã đổi thì dừng, không ghi đè; dùng quy trình revision cho cập nhật. Hash trên là kế hoạch đã chạy, không tự thay để bỏ qua việc rà soát nội dung mới.

Trạng thái trong JSON/Markdown học liệu là trạng thái bản nguồn tại thời điểm biên soạn. Biên bản này mô tả lần triển khai local; giữ nguyên JSON nguồn để không làm sai source hash trong biên nhận. Lộ trình: [toeic-curriculum.md](toeic-curriculum.md).
