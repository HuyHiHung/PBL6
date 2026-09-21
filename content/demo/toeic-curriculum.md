# TOEIC Listening & Reading — Hai bộ 500–700 và 700–990

Cập nhật: **21/09/2026**; định dạng thi đối chiếu ngày 20/09/2026. Theo yêu cầu người dùng, học liệu Listening & Reading được chia thành đúng hai bộ: **500–700** và **700–990**. Đây là khoảng mục tiêu tổng điểm để tổ chức học, không phải band được ETS hiệu chỉnh hay cam kết kết quả. Speaking & Writing không nằm trong hai bộ.

| Bộ | Bản người học | Đáp án và script | JSON nguồn | Quy mô |
|---|---|---|---|---|
| 500–700 | [Học](toeic-500-700.md) | [Duyệt](toeic-500-700-review.md) | [JSON](toeic-500-700.json) | 8 bài, 64 mục từ, 60 câu, 260 phút |
| 700–990 | [Học](toeic-700-990.md) | [Duyệt](toeic-700-990-review.md) | [JSON](toeic-700-990.json) | 8 bài, 64 mục từ, 60 câu mới, 315 phút |

Mỗi bản người học có 36 câu Reading không kèm đáp án. Mỗi bản người duyệt có đủ 60 câu, giải thích, bằng chứng và script. JSON chứa đáp án, không cấp nguyên file cho frontend người học. Tổng hai bộ: 16 bài, 128 mục từ theo bài, 120 câu; các mục từ có thể được ôn lại ở ngữ cảnh khác.

## Chọn bộ và phân biệt độ khó

| Tiêu chí | 500–700 | 700–990 |
|---|---|---|
| Điểm bắt đầu | Còn nhầm loại từ, liên từ, mốc thời gian hoặc chi tiết trực tiếp | Nắm nền tảng nhưng dễ sai paraphrase, ý định, ngoại lệ và liên kết nhiều nguồn |
| Listening | Hỏi–đáp thường gặp; purpose/detail/next action; dữ kiện tường minh | Từ chối mềm, sửa giả định, thay đổi có điều kiện, ý định người nói; 2 nhóm có bảng |
| Reading | Cấu trúc câu cơ bản; email ngắn; suy luận và bài đôi/ba bước đầu | Cấu trúc phức; điều khoản; câu chèn vị trí; đối chiếu invoice/credit và đề xuất/xác nhận |
| Cách chữa | Xác định loại từ và gạch bằng chứng | Bảo vệ đáp án và giải thích từng distractor, chỉ rõ nguồn đã bị thay thế |

Mốc **700 là vùng chuyển tiếp**: có thể ôn Reading ở bộ thấp và học Listening ở bộ cao hoặc ngược lại. Không chia tổng điểm đôi để tự suy ra điểm từng kỹ năng. Cơ sở tham khảo là [ETS Score Descriptors](https://www.ets.org/pdfs/toeic/toeic-listening-reading-score-descriptors.pdf), trong đó mô tả theo từng kỹ năng. Việc chọn hai khoảng tổng điểm và phân bài ở đây là quyết định biên soạn của project, chưa phải kết quả hiệu chỉnh độ khó.

## Cấu trúc bài thi dùng làm tham chiếu

Bộ này tham chiếu dạng TOEIC Listening & Reading tiêu chuẩn 200 câu, không phải bản rút gọn hoặc bài thi Speaking & Writing. Listening khoảng 45 phút, Reading 75 phút; thời gian làm thủ tục/tô thông tin nằm ngoài 120 phút làm bài. Nguồn: [ETS — About Listening and Reading](https://www.ets.org/toeic/about/listening-reading.html).

| Part | Kỹ năng/dạng câu | Số câu trong dạng thi tham chiếu | Số câu trong mỗi bộ | Tài nguyên hiện có |
|---|---|---:|---:|---|
| 1 | Mô tả ảnh | 6 | 3 | Mô tả ảnh cần tạo và câu lựa chọn; chưa có ảnh/audio |
| 2 | Hỏi–đáp | 25 | 9 | Script câu hỏi/phát biểu và 3 phản hồi mỗi câu; chưa audio |
| 3 | Hội thoại | 39 | 6 | 2 hội thoại, mỗi đoạn 3 câu; chưa audio |
| 4 | Bài nói ngắn | 30 | 6 | 2 bài nói, mỗi đoạn 3 câu; chưa audio |
| 5 | Hoàn thành câu | 30 | 12 | Câu trắc nghiệm ngữ pháp/từ vựng, dùng ngay bằng chữ |
| 6 | Hoàn thành đoạn | 16 | 8 | 2 đoạn × 4 câu, có câu chèn hoàn chỉnh |
| 7 | Đọc hiểu | 54 | 16 | 2 bài đơn × 3 câu; 1 bộ đôi × 5; 1 bộ ba × 5 |
| Tổng | | 200 | 60 | 36 câu Reading sẵn bằng chữ, 24 câu Listening chờ media |

Số câu và nhóm câu chính thức đối chiếu [ETS Examinee Handbook](https://www.ets.org/content/dam/ets-org/pdfs/toeic/toeic-listening-reading-test-examinee-handbook.pdf). Trong bài thi thật, Part 2 có ba phương án; các Part còn lại có bốn. Gói khởi đầu không giữ tỉ lệ số câu của đề thật và không bao phủ hết dạng nâng cao.

## Lộ trình bộ 500–700 — bốn tuần gợi ý

Tám bài của bộ 500–700 có tổng thời lượng hướng dẫn **260 phút**; đây là thời lượng học gợi ý, không phải giới hạn thi. Ôn từ, chữa kỹ và luyện nghe sau khi có audio cần thêm thời gian tùy người học.

| Tuần | Nội dung đã biên soạn | Kết quả cần tạo |
|---|---|---|
| 1 | Bài 1–2: hành động/vị trí; câu hỏi và đáp gián tiếp | Phân biệt động tác/trạng thái; giải thích phản hồi phù hợp. Listening chỉ luyện với người đọc/audio, không chấm từ bản chữ như kỹ năng nghe |
| 2 | Bài 3–4: hội thoại và thông báo | Ghi được purpose, detail, next action; tóm tắt ba câu sau khi chữa |
| 3 | Bài 5–6: loại từ, thì, giới từ, liên từ và liên kết đoạn | Làm 20 câu Reading; ghi quy tắc và bằng chứng, tự tạo câu mới cho lỗi đã gặp |
| 4 | Bài 7–8: đọc đơn, đôi, ba tài liệu | Làm 16 câu Reading; chỉ được vị trí dữ kiện, đối chiếu lịch/đơn hàng/email |

Người chưa vững câu đơn nên học Bài 5 sớm hơn và giảm số câu mỗi buổi. Người đã đọc tốt có thể bắt đầu Reading trước khi media Listening hoàn thành. Không dùng 60 câu này để xếp hạng hoặc xác nhận trình độ đầu vào.

## Lộ trình bộ 700–990 — hai chặng trong cùng bộ

Tám bài mới có thời lượng hướng dẫn **315 phút**. Khoảng 700–990 rất rộng: không coi 60 câu là đủ để tiến từ 700 lên 990. Hai chặng sau dùng để chọn cách học, không tạo thêm bộ thứ ba.

| Chặng | Cách dùng nội dung | Dấu hiệu cần theo dõi |
|---|---|---|
| Hướng tới 700–850 | Làm có hướng dẫn; học indirect replies, intent, điều kiện, bảng ở Bài 2–4; ngữ pháp và liên kết đoạn ở Bài 5–6 | Diễn đạt lại được ý, phân biệt điều đã chốt với điều mới đề xuất |
| Hướng tới 850–990 | Tự giải thích vì sao từng lựa chọn sai; tập trung ngoại lệ, câu chèn và đối chiếu nhiều nguồn ở Bài 7–8; luyện thời gian bằng câu mới chưa học | Vừa chính xác vừa kiểm soát thời gian; không chọn theo từ trùng hoặc dữ kiện đã bị thay |

Ví dụ nội dung mới: chọn phòng theo capacity/accessibility/budget; cập nhật lịch từ thông báo; đối chiếu khoản còn phải trả sau credit note; tính số tiền cuối từ hợp đồng, đề xuất và xác nhận. Bộ cao có một câu chèn vị trí trong Part 7 và hai bảng dành cho Listening. Độ khó audio chưa thể kiểm chứng vì chưa có bản thu.

## Từ vựng và ngữ pháp nền

Mỗi bộ có **64 mục từ**, mỗi mục có loại từ, nghĩa Việt, collocation và câu Anh–Việt. Bảng dưới mô tả bộ 500–700. Bộ 700–990 bổ sung các từ như tentative, waive, contingent, supersede, entitlement, nontransferable, reconcile và credit note; một số từ được học lại với nghĩa/ngữ cảnh sâu hơn.

| Ngữ cảnh | Ví dụ thuật ngữ | Điểm ngôn ngữ |
|---|---|---|
| Văn phòng và không gian | arrange, shelf, counter, inspect | Hiện tại tiếp diễn, trạng thái bị động, giới từ vị trí |
| Lịch hẹn và phối hợp | appointment, reschedule, deadline, extension | WH-questions, yêu cầu lịch sự, lựa chọn và đáp gián tiếp |
| Dịch vụ khách hàng | reservation, refund, replacement, in stock | Diễn đạt lại vấn đề, thay đổi và next action |
| Sự kiện và đi lại | venue, shuttle, maintenance, postpone | Thời gian cũ/mới, nguyên nhân và hướng dẫn |
| Tuyển dụng và công việc | application, applicant, efficient, approval | Loại từ, hòa hợp chủ–vị, thì, động từ bị động |
| Email và chính sách | effective, notify, however, renovation | Liên từ/trạng từ nối, đại từ tham chiếu, câu chèn |
| Thông báo và ưu đãi | eligible, complimentary, valid, renew | Điều kiện, ngoại lệ, suy luận có bằng chứng |
| Đơn hàng và đối chiếu | invoice, quantity, shipment, discrepancy | Nối thông tin nhiều tài liệu; số lượng, giá và deadline |

Không gắn nhãn đây là danh sách “từ xuất hiện nhiều nhất”: gói chưa dựa trên thống kê tần suất của một corpus đề thi.

## Quy trình mỗi bài và cách theo dõi

1. Học 8 mục từ trong ngữ cảnh; che nghĩa và tự đặt câu.
2. Đọc hướng dẫn kỹ năng; làm bài mà chưa mở bản đáp án.
3. Khi chữa, ghi đáp án đúng, bằng chứng và lý do mình chọn nhầm.
4. Ôn lại sau 1, 3 và 7 ngày; câu đã nhớ đáp án không dùng để đánh giá tiến bộ độc lập.

Mẫu sổ lỗi:

| Ngày | Item key | Mình chọn | Đáp án | Loại lỗi | Bằng chứng/quy tắc | Câu ví dụ mới | Ngày ôn |
|---|---|---|---|---|---|---|---|
| | | | | từ vựng / ngữ pháp / đọc thiếu điều kiện / đối chiếu sai / nhận âm | | | |

Chỉ báo cáo **số đúng/tổng câu, thời gian và nhóm lỗi** của bài tự luyện. Reading có thể theo dõi trên 36 câu; Listening phải ghi rõ điều kiện làm (audio, người đọc, hay đọc transcript). Không gộp các điều kiện đó thành một điểm nghe. Không tính `số đúng × 5` hoặc suy từ phần trăm ra điểm TOEIC. ETS dùng điểm chuẩn hóa theo đề, 5–495 mỗi kỹ năng; [Handbook](https://www.ets.org/content/dam/ets-org/pdfs/toeic/toeic-listening-reading-test-examinee-handbook.pdf) giải thích vì sao bảng quy đổi của đề khác không áp dụng tùy ý.

## Chuẩn bị media Listening

Trạng thái cả hai bộ: **script đã biên soạn; chưa thu âm; sáu ảnh Part 1 chưa tạo**. Mỗi bộ có 24 câu Listening. Hai bảng của bộ 700–990 đã có trong dữ liệu và bản người duyệt, nhưng chưa có audio đi kèm. Có thể dùng script để giáo viên đọc trong buổi luyện có hướng dẫn, nhưng không gọi đó là bài thi chuẩn hóa.

- Part 1: tạo ảnh đúng scene brief, kiểm tra không có chi tiết làm thêm phương án đúng; thu riêng bốn câu mô tả. Không đưa scene brief có lời giải vào màn hình người học.
- Part 2: đọc câu hỏi/phát biểu rồi ba phản hồi A/B/C; người học chỉ thấy số câu và lựa chọn A/B/C, không nhìn các câu chữ khi làm bài nghe.
- Part 3–4: thu đúng lượt lời, ngày, số lượng và phát âm tên; người học thấy câu hỏi/phương án nhưng không thấy transcript trước khi nộp.
- Chữa bài mới mở transcript, đáp án và giải thích. Chế độ học có thể phát lại; nếu tạo chế độ kiểm tra sau này phải định nghĩa rõ số lần phát và thời gian.
- Kiểm tra phát âm, độ rõ, âm lượng, tiếng nền và khớp script trước khi đánh dấu sẵn sàng. Dùng giọng đa dạng cho giai đoạn mở rộng; không coi một giọng máy là đại diện đủ cho độ đa dạng của bài thi.

Trong lúc chờ media, người học có thể tìm bài mẫu chính thức có hướng dẫn/tài nguyên nghe tại [ETS Preparation Materials](https://www.ets.org/toeic/test-takers/prepare.html). Nội dung ETS được liên kết để tham khảo, không sao chép vào ngân hàng câu của project.

## Dữ liệu và triển khai trong project

Hai bộ dùng schema riêng `sprout_toeic_materials_v1`: `band → units → groups → documents/transcript/scene_brief/graphic → items`. Câu hỏi giữ `key`, `options`, `answer`, `explanation`, `evidence`; nhóm giữ trạng thái media. Cấu trúc nhóm bảo toàn ba câu trên một hội thoại, bốn chỗ trống trong một đoạn và năm câu cho bộ đôi/ba văn bản. Công cụ đọc đúng hai JSON theo band, kiểm tra key không trùng giữa hai bộ trước khi ghi Markdown. Key của bộ nền tảng cũ được giữ; bộ cao dùng prefix `toeic700-`.

Gói **chưa import DB**, chưa nằm trong importer kỹ thuật. Không ép các nhóm thành quiz 5 câu hoặc test 10 câu vì sẽ làm mất cấu trúc bài tập. Khi triển khai cần adapter riêng để lưu nguồn chung, tham chiếu nhóm và media; tách answer key khỏi payload người học. Không đổi schema/backend hoặc các khóa đã import trong đợt biên soạn này.

```sh
node scripts/render-toeic-materials.mjs
node scripts/render-toeic-materials.mjs --check
node --test tests/toeic-materials.test.mjs
```

Sửa JSON nguồn rồi sinh lại Markdown. Validator kiểm tra key, số lựa chọn, quy mô nhóm, chỗ trống Part 6, document count, đáp án hợp lệ và trạng thái media. Kiểm thử xác nhận bản người học không lộ transcript/giải thích/đáp án; đây không thay thế thẩm định sư phạm hoặc hiệu chỉnh độ khó.

Giai đoạn mở rộng: hoàn thiện audio/ảnh, tăng số bài bảng/biểu và câu chèn đã có ở bộ cao, thêm câu mới để đánh giá độc lập, rồi xây đề đủ 200 câu theo phân bố chính thức. Speaking & Writing cần lộ trình, rubric và dạng câu riêng. Các link `toeic-foundation.md` và `toeic-foundation-review.md` cũ được giữ làm trang chuyển hướng sang hai bộ; không còn JSON Foundation riêng.
