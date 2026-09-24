# Audit học liệu kỹ thuật và chuẩn bị import

**Cập nhật 24/09/2026:** cả năm khóa đã được xuất bản trên local, gồm 16 chủ đề, 36 bài và 52 assessment. [Biên bản và kiểm chứng API/web](technical-publication.md). Nội dung phía dưới lưu lại kết quả audit/import ngày 20/09; các trạng thái draft ở đó là trạng thái tại thời điểm import. Hash JSON nguồn và biên nhận import được giữ nguyên.

Ngày rà soát: **20/09/2026**. Phạm vi: năm khóa trong `technical-catalog.json`; không bao gồm học liệu A1, fixture bootstrap hoặc dictation hiện có.

**Kết luận:** đã import và commit cả năm khóa vào **Supabase local pbl6** ở trạng thái **bản nháp** ngày 20/09/2026; chưa xuất bản. Đây là rà soát nội dung của trợ lý kết hợp kiểm tra tự động; chưa phải thẩm định độc lập của giáo viên/chuyên gia ngành.

**Kết quả import:** 5 khóa, 16 chủ đề, 36 bài, 294 mục từ, 340 câu hỏi và 52 bài kiểm tra. Chạy lại cùng kế hoạch trả về `skip-identical` cho cả 5 khóa, không thêm bản ghi trùng. Đọc lại DB sau commit xác nhận khóa/chủ đề/bài/assessment đều là `draft`, không có revision đã xuất bản trong bộ import. Biên bản local: `.local/technical-import-result.json`, xác minh lúc `2026-09-20T15:38:28.605Z`. Trạng thái triển khai này áp dụng cho DB local được kiểm tra; các file học liệu nguồn vẫn là bản biên soạn có thể tái sử dụng.

## Kết quả rà soát

Đã đối chiếu 36 bài, 294 mục từ theo bài và 340 câu hỏi với bài đọc, nghĩa từ, ví dụ, đáp án và giải thích. Các phép tính đơn giản về số lượng, tỷ lệ, thời lượng, điện áp, khối lượng và dung sai khớp dữ kiện giả lập. Không phát hiện đáp án đúng bị sai so với dữ kiện trong phạm vi rà soát này.

| Mã | Phát hiện | Xử lý |
|---|---|---|
| AUD-01 | Ba câu nhắc ngữ cảnh nhưng thiếu cờ đính kèm bài đọc | Bổ sung `use_reading` cho quiz câu 4 của Building and Testing Software, câu 2 của Asking About Data Quality, câu 4 của Sensors, Controllers, and Actuators |
| AUD-02 | Chưa có khóa ổn định ở cấp câu hỏi và mục từ | Bổ sung 340 question key và 294 vocabulary key; giữ nguyên key khi sửa hoặc đổi thứ tự |
| AUD-03 | Ví dụ cho `millimetre` chưa tự nhiên | Sửa thành “All dimensions are given in millimetres.” và bản dịch tương ứng |
| AUD-04 | Vị trí đáp án A/B/C lặp theo chu kỳ dễ đoán | Đổi thứ tự 173/204 câu trắc nghiệm; kiểm tra tập phương án và nội dung đáp án đúng không đổi. Phân bố mới: A=72, B=66, C=66 |
| AUD-05 | JSON biên soạn không phải payload DB/API | Tạo adapter cho block, snapshot, passage, question owner và answer key; không truyền nguyên object nguồn vào CMS |
| AUD-06 | Bài có ngữ cảnh ảnh/video/audio giả lập nhưng chưa có asset | Giữ dưới dạng bài đọc/hội thoại; không tạo media hoặc audio giả, không coi là bài nghe đã nghiệm thu |

Các bài quiz gồm 204 câu trắc nghiệm và 136 câu điền từ. Phần lớn là nhận biết, đọc hiểu và vận dụng câu ngắn; chưa đủ để chứng nhận trình độ CEFR hoặc năng lực nghề nghiệp. Một số phương án nhiễu còn dễ loại; phù hợp demo nhập môn. Hoạt động nói/viết có mẫu và tiêu chí tự kiểm, không chấm tự động.

Đáp án hướng dẫn của hoạt động đọc có thể xuất hiện trong nội dung bài học như tài liệu tự học. Đáp án/giải thích của **quiz và kiểm tra chủ đề** được lưu riêng trong `question_answer_keys`, không được chép vào block bài học hay prompt bởi importer.

## Ánh xạ đã chuẩn bị

| Đối tượng | Số lượng |
|---|---:|
| Khóa học / chủ đề / bài học | 5 / 16 / 36 |
| Mục từ và snapshot từ vựng theo lesson revision | 294 / 294 |
| Lesson revisions | 36 |
| Câu hỏi / question revisions | 340 / 340 |
| Phương án / answer keys | 612 / 340 |
| Assessments / assessment revisions | 52 / 52 |
| Liên kết câu hỏi trong assessment revision | 340 |
| Biên nhận import trong audit_events | 5 |

Có 36 quiz và 16 kiểm tra chủ đề, không dùng chung question ID. Ngưỡng đạt 70%, grading policy 1 theo schema hiện tại. Khóa/chủ đề/bài/assessment bắt đầu ở `draft`; bài không bật preview. Từ vựng và câu hỏi dùng trạng thái `active` theo schema. Không tạo enrollment, lịch sử làm bài, tiến độ hoặc flashcard giả.

Ví dụ Anh–Việt được giữ trong `example` của từ vựng và snapshot. Loại từ/cụm thường dùng được trình bày trong block `text`. Hội thoại là block `text`, không phải `audio`. Câu có `use_reading` lấy đúng `reading` của bài hoặc `test_passage` của chủ đề. `lesson_key` xác định lesson nguồn của câu kiểm tra.

Mỗi key được ánh xạ thành UUIDv5 trong namespace cố định. Không gộp từ chỉ theo `word`: `feature` của AI và của sản phẩm có ngữ cảnh riêng. Vị trí khóa học bắt đầu ở 100, giữ thứ tự trong danh mục; không sửa vị trí các khóa sẵn có.

## Bằng chứng kiểm tra

- `node --test tests/materials.test.mjs tests/materials-import.test.mjs`: **14/14 đạt**.
- `node scripts/import-technical-materials.mjs --verify-db`: import thử toàn bộ năm khóa, kiểm tra chạy lại, thực thi ràng buộc xuất bản rồi **rollback**.
- `node --test tests/materials-import-db.test.mjs`: **1/1 đạt**, dùng UUID thử riêng; xác nhận dữ liệu thử không còn sau rollback.
- Test DB kiểm tra UUID trùng, nguồn thay đổi, nội dung bị sửa trong CMS và lỗi xuất bản. Trường hợp answer key thiếu giải thích bị DB từ chối đúng như mong đợi.
- Lần thử DB đầu phát hiện tham số JSON bị mã hóa hai lần; đã sửa bằng `tx.json(...)`. Cả phép thử thực và kiểm thử tích hợp sau sửa đều đạt.

Không tắt trigger hoặc constraint, không cần migration và không sửa API. Quá trình verify chỉ thay trạng thái xuất bản bên trong transaction chưa commit để chạy validator thật; người dùng khác không nhìn thấy trạng thái thử đó.

## Quy trình import local

Các lệnh chạy từ thư mục gốc PBL6. Cần Supabase local hoạt động, đủ migration hiện hành và tài khoản admin bootstrap còn active. Importer chỉ chấp nhận stack `pbl6` ở `127.0.0.1:54321/54322`; không nhận URL database tùy ý.

### 1. Xem kế hoạch và kiểm tra

```sh
node scripts/import-technical-materials.mjs --dry-run
node scripts/import-technical-materials.mjs --verify-db
```

Lệnh đầu không kết nối DB; ghi ánh xạ đầy đủ vào `.local/technical-import-plan.json`. File này có đáp án, không dùng làm asset frontend. `--verify-db` luôn rollback; không thay thế lệnh import thật.

Mã SHA-256 của kế hoạch đã rà soát:

```text
ae9086d5a7c0273360ef9be2f4b721ac8ebe615231d5b6e071017771e630669b
```

### 2. Khi thực hiện import bản nháp

Lệnh dưới đây **đã chạy thành công sau đợt audit**, theo yêu cầu import của người dùng; lần chạy lại đã xác nhận không nhân đôi dữ liệu:

```sh
node scripts/import-technical-materials.mjs --apply --expect-hash ae9086d5a7c0273360ef9be2f4b721ac8ebe615231d5b6e071017771e630669b
```

Lệnh dùng một transaction và cùng advisory lock với CMS. Tất cả năm khóa được kiểm tra trước khi ghi; lỗi ở một khóa rollback cả lần import. Chỉ có `--apply` với hash khớp mới ghi vĩnh viễn; importer không có cờ publish.

### 3. Chạy lại và cập nhật

- Dữ liệu nguồn và các hàng đã import giống nhau: bỏ qua, không nhân đôi và không đưa nội dung đã xuất bản/ẩn về nháp.
- Nguồn khác biên nhận: dừng với `SOURCE_CHANGED`. Không ghi đè revision đã có; cập nhật nội dung qua CMS và tạo revision mới.
- Hàng bị sửa hoặc bị thiếu so với bản import: dừng với `DB_DRIFT`; không tự sửa lại nội dung của Editor.
- UUID có sẵn nhưng không có biên nhận tương ứng: dừng với `ID_COLLISION`.
- JSON thay đổi sau audit: dừng với `AUDIT_STALE`. Rà soát thay đổi, cập nhật snapshot audit và kiểm chứng lại; không chỉ thay hash để bỏ qua rà soát.

Mốc hash dùng JSON chuẩn hóa thứ tự thuộc tính; thay khoảng trắng trong file không đổi nội dung logic. Không đổi namespace hoặc tái sinh key theo vị trí sau lần import đầu. Biên nhận nằm trong DB nên xóa file kế hoạch `.local` không làm mất khả năng phát hiện import trước đó.

Sau khi import, duyệt bản nháp trong CMS. Khi xuất bản thủ công, xuất bản bài cùng quiz trước, rồi kiểm tra chủ đề, chủ đề và khóa học. Importer không xóa hoặc ẩn fixture kỹ thuật đang có, không xóa lịch sử học để làm sạch danh mục demo.

Snapshot máy đọc và hash từng khóa: [technical-audit.json](technical-audit.json). Học liệu: [technical-demo.md](technical-demo.md).
