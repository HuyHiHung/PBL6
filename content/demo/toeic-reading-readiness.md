# Kiểm tra khả năng xuất bản Reading — 22/09/2026

Kiểm tra trực tiếp Supabase local `pbl6` lúc `2026-09-22T01:32:39.790Z`. Phạm vi: tám bài Reading của hai khóa TOEIC đã import. **Chưa xuất bản bất kỳ bài nào.**

## Kết quả

| Bộ | Bài | Câu | Ràng buộc xuất bản DB |
|---|---|---:|---|
| 500–700 | Part 5 — Word Forms, Verb Patterns, and Connectors | 12 | Bị chặn: `invalid_assessment_structure` |
| 500–700 | Part 6 — Meaning Across a Whole Message | 8 | Đạt |
| 500–700 | Part 7 — Emails, Notices, and Supported Inferences | 6 | Đạt |
| 500–700 | Part 7 — Connecting Two or Three Documents | 10 | Đạt |
| 700–990 | Part 5 — Complex Structures and Precise Word Choice | 12 | Bị chặn: `invalid_assessment_structure` |
| 700–990 | Part 6 — Conditions, Reference, and Paragraph Logic | 8 | Đạt |
| 700–990 | Part 7 — Exceptions, Implications, and Sentence Placement | 6 | Đạt |
| 700–990 | Part 7 — Reconciliation and Conditional Changes Across Documents | 10 | Đạt |

**Có thể chuẩn bị xuất bản trước sáu bài Part 6–7, tổng 48 câu**, dưới dạng bài tự luyện Reading hiện tại. Hai bài Part 5 có đủ nội dung 24 câu nhưng quiz 12 câu không đáp ứng quy tắc 5–10 câu của DB; không phải thiếu đáp án hoặc bài đọc.

## Đã kiểm tra

- Đọc lại toàn bộ hàng của hai khóa theo kế hoạch import: hai bộ khớp nguồn, không phát hiện thiếu hoặc sửa dữ liệu.
- Với từng bài Reading, trong transaction riêng: tạm xuất bản các question revision, quiz, lesson, topic Reading và course; chạy `SET CONSTRAINTS ALL IMMEDIATE` để thực thi validator thật. Đạt hay lỗi đều rollback.
- Sáu bài đạt có nội dung, vocabulary snapshots, phương án, answer key và giải thích hợp lệ theo validator; không cần audio để thực hiện Reading. Các passage và bảng đối chiếu nguồn đã được giữ qua importer.
- Kiểm tra fingerprint của các hàng import trước/sau: giống hệt. Trạng thái và dữ liệu được giữ nguyên; không có xuất bản thực tế.
- Đọc mã Content API: nội dung người học yêu cầu lesson/topic/course cùng published; danh sách câu giữ `position`, answer key không nằm trong public snapshot. Có thể mở topic Reading và các bài đạt, giữ Listening và Part 5 ở draft. Chưa chạy kiểm thử giao diện bằng tài khoản người học trong lần audit này.

Kết quả này xác nhận dữ liệu và ràng buộc kỹ thuật, không phải thẩm định độc lập độ khó hoặc bảo đảm điểm TOEIC. Giao diện hiện hiển thị passage theo câu, chưa phải màn hình đề TOEIC đầy đủ với tài liệu chung bên cạnh nhóm câu.

## Việc cần làm khi quyết định xuất bản

1. Xuất bản sáu bài cùng quiz/revision tương ứng, sau đó mở hai topic Reading và hai course. Listening vẫn draft, nên chưa hiển thị như phần nghe hoàn chỉnh.
2. Dọn các nhãn “bản nháp/chờ media” trong tên quiz và ghi chú biên tập không còn phù hợp với bài Reading được mở. Đây là chỉnh thông tin hiển thị; hiện các nhãn đó chưa chặn validator nhưng không nên để người học hiểu nhầm.
3. Với Part 5, phương án phù hợp schema hiện tại là tách mỗi bài thành **hai bài nhỏ, mỗi bài sáu câu**, giữ cả 12 câu. Không thể gắn hai quiz vào một lesson vì DB chỉ cho một quiz/lesson. Phương án khác là thiết kế loại assessment TOEIC với giới hạn riêng; không nới quy tắc chung chỉ để bỏ qua lỗi.
4. Sau chỉnh sửa hoặc tách bài, kiểm tra lại revision và trải nghiệm người học trước khi mở phần đó. Không thay source hash hoặc chạy importer cũ để ghi đè nội dung đã sửa trong CMS.

Biên bản máy đọc: `.local/toeic-reading-readiness.json` (có lesson/assessment ID). Lệnh kiểm tra có rollback: `node scripts/audit-toeic-reading.mjs`. Lệnh này không có chế độ commit.
