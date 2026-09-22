# Học liệu demo Sprout

## TOEIC Listening & Reading — 500–700 và 700–990

[Lộ trình hai bộ và trạng thái tài nguyên](toeic-curriculum.md).

| Bộ mục tiêu | Trọng tâm | Bản người học | Đáp án / nguồn | Quy mô |
|---|---|---|---|---|
| 500–700 | Ngữ pháp nền, thông tin trực tiếp, paraphrase cơ bản, đối chiếu bước đầu | [Học](toeic-500-700.md) | [Đáp án](toeic-500-700-review.md) · [JSON](toeic-500-700.json) | 8 bài, 64 mục từ, 60 câu, 260 phút |
| 700–990 | Đáp gián tiếp, ý định, điều kiện/ngoại lệ, bảng dữ liệu, câu chèn và nối nhiều nguồn | [Học](toeic-700-990.md) | [Đáp án](toeic-700-990-review.md) · [JSON](toeic-700-990.json) | 8 bài, 64 mục từ, 60 câu mới, 315 phút |

Tổng **16 bài, 128 mục từ theo bài, 120 câu**. Mỗi bộ bao quát 7 Part, có 36 câu Reading dùng ngay và 24 câu Listening còn chờ audio/ảnh. Hai khoảng điểm là mục tiêu biên soạn, không phải cam kết kết quả hay đề đủ 200 câu. **Đã import DB local dạng draft ngày 22/09/2026**, chưa xuất bản; xem [biên bản và giới hạn import](toeic-import.md). Bản Foundation cũ được chuyển thành bộ 500–700, giữ key; hai liên kết Markdown cũ dẫn sang hai bộ mới, không còn JSON Foundation riêng.

```sh
node scripts/render-toeic-materials.mjs
node scripts/render-toeic-materials.mjs --check
node --test tests/toeic-materials.test.mjs
```

## Demo 5 nhóm ngành kỹ thuật

Bắt đầu tại [danh mục kỹ thuật](technical-demo.md): bảng đánh giá nhu cầu tiếng Anh, lộ trình và liên kết đến từng khóa. Tổng cộng **5 khóa, 16 topic, 36 bài, 294 mục từ theo bài và 340 câu hỏi**; thời lượng gợi ý 880 phút. Mục từ có thể lặp giữa các bài/ngành theo ngữ cảnh; không gọi đây là 294 từ duy nhất.

Đã có [báo cáo audit và hướng dẫn import bản nháp](technical-audit.md). Năm khóa đã được import vào Supabase local ở trạng thái draft ngày 20/09/2026 và kiểm tra chạy lại không trùng. Snapshot audit có hash từng khóa để phát hiện nội dung thay đổi trước import.

| Nhóm ngành | Bản đọc | JSON nguồn | Quy mô |
|---|---|---|---|
| CNTT / Phần mềm | [Học liệu](english-it.md) | [JSON](english-it.json) | 12 bài, 102 mục từ, 100 câu |
| Dữ liệu / AI | [Học liệu](english-data-ai.md) | [JSON](english-data-ai.json) | 6 bài, 48 mục từ, 60 câu |
| Điện tử / Vi mạch | [Học liệu](english-electronics.md) | [JSON](english-electronics.json) | 6 bài, 48 mục từ, 60 câu |
| Tự động hóa / Robot | [Học liệu](english-robotics.md) | [JSON](english-robotics.json) | 6 bài, 48 mục từ, 60 câu |
| Cơ khí / Ô tô | [Học liệu](english-mechanical.md) | [JSON](english-mechanical.json) | 6 bài, 48 mục từ, 60 câu |

Bốn khóa mới ở mức ngôn ngữ mục tiêu A2–B1. Mỗi khóa có ba topic, mỗi topic hai bài và kiểm tra 10 câu. Mỗi bài có tám mục từ, câu ví dụ Anh–Việt, bài đọc, hội thoại đọc phân vai, mẫu thực hành và quiz năm câu. Phần thực hành tự kiểm không chấm tự động.

Các tình huống nhắc đến sơ đồ, ảnh, bản ghi, video hoặc mô phỏng là **ngữ cảnh trong văn bản**, không phải tài nguyên đa phương tiện đã đính kèm. Đoạn đọc cung cấp đủ dữ kiện để trả lời; chưa có file audio/hình/video. Nội dung luyện tiếng Anh không thay thế hướng dẫn vận hành, tiêu chuẩn kỹ thuật hoặc đào tạo nghề. Nguồn đối chiếu khái niệm nằm cuối từng khóa; chưa có thẩm định độc lập của giáo viên/chuyên gia.

### Cập nhật học liệu

Sửa JSON nguồn, rồi chạy từ thư mục project:

```sh
node scripts/render-technical-materials.mjs
node scripts/render-technical-materials.mjs --check
node --test tests/materials.test.mjs
node --test tests/materials-import.test.mjs
```

Lệnh đầu kiểm tra toàn bộ dữ liệu trước khi tạo Markdown của năm khóa và danh mục. `--check` chỉ đọc và báo lỗi nếu dữ liệu không hợp lệ hoặc Markdown chưa đồng bộ. Danh sách, điểm định hướng và quy mô kỳ vọng nằm trong `technical-catalog.json`; công cụ đếm mục từ theo bài và cho phép cùng từ xuất hiện ở bài khác. JSON và danh mục là nguồn biên soạn; các Markdown tương ứng được tạo tự động.

Năm khóa đã nhập DB local dạng bản nháp, chưa xuất bản. Trạng thái trong JSON/bản Markdown nguồn mô tả gói biên soạn; trạng thái triển khai xem báo cáo audit phía trên. Áp dụng ánh xạ phía dưới cho cả năm khóa; không đưa nguyên JSON chứa đáp án vào frontend người học. Bản A1 và IT Fresher bên dưới là các bộ bổ trợ riêng, không tính vào tổng demo năm khóa.

Mỗi câu hỏi và mục từ trong năm khóa kỹ thuật có `key` ổn định. Giữ key khi sửa hoặc đổi thứ tự; chỉ cấp key mới cho đối tượng mới. Không dùng thứ tự mảng để tái sinh key. Nếu sửa nguồn sau audit, cần rà soát và cập nhật snapshot trước khi dùng importer.

## Bổ trợ IT — A Fresher's Workday

[Học liệu đầy đủ](english-it-fresher.md) · [JSON nguồn](english-it-fresher.json) · [Định hướng, mẫu câu và nguồn nghiên cứu](it-fresher-research.md).

Gồm **4 topic, 8 bài, 64 mục từ/cụm từ theo bài, 80 câu hỏi, 200 phút**. Dành cho fresher phần mềm đã biết từ cơ bản: onboarding và ticket → daily update và hỏi trợ giúp → Git/PR và code review/CI → API và QA handoff. Mỗi bài có 8 mục từ Anh–Việt, bài đọc, hội thoại, mẫu thực hành, rubric tự chấm và quiz 5 câu; mỗi topic có bài đọc riêng và kiểm tra 10 câu. Có 63 từ/cụm từ khác nhau: `dependency` được học ở hai ngữ cảnh.

Gói mới **chưa import DB**. Giữ riêng để không thay đổi hash/biên nhận của bản IT đã import. `technical-catalog.json` và importer năm khóa chưa bao gồm gói bổ trợ này; muốn đưa vào DB cần chuẩn bị kế hoạch import bổ sung và audit riêng, hoặc tạo nội dung qua CMS. Không sửa hash audit cũ để ép import lại. Các key mới bắt đầu bằng `fresher-`; course key riêng `sprout-it-fresher-workday`.

```sh
node scripts/render-it-fresher-materials.mjs
node scripts/render-it-fresher-materials.mjs --check
```

JSON là nguồn để sửa; Markdown được sinh tự động. Profile đếm kỳ vọng nằm trong `english-it-fresher.profile.json`; điểm kỹ năng là định hướng biên soạn, không phải khảo sát. Công cụ dùng lại validator của học liệu kỹ thuật và kiểm tra key không trùng với năm khóa cũ, không kết nối DB.

## Bộ nền tảng A1

**Campus English — First Steps** dành cho sinh viên mới học tiếng Anh, mức mục tiêu A1. Nội dung biên soạn mới cho project, chưa qua thẩm định giáo viên. Tổng thời lượng gợi ý 100 phút: 4 bài × 20 phút và 2 bài kiểm tra × 10 phút.

- [Bản học liệu dễ đọc](english-a1.md): bài học, từ vựng, kịch bản nghe, câu hỏi và đáp án dành cho người duyệt.
- [Dữ liệu JSON](english-a1.json): nguồn nội dung có cấu trúc; 2 chủ đề, 4 bài, 24 mục từ, 20 câu quiz và 20 câu kiểm tra chủ đề.

## Bổ sung: tiếng Anh ngành IT

**IT English — Vocabulary at Work** là khóa bổ sung ở mức mục tiêu A2–B1, có giải thích thuật ngữ bằng tiếng Việt. Thời lượng gợi ý 280 phút: 12 bài × 20 phút và 4 kiểm tra chủ đề × 10 phút. Có thể học sau bộ A1 hoặc chọn trực tiếp khi demo cho sinh viên IT.

- [Học liệu IT dễ đọc](english-it.md) · [Dữ liệu JSON IT](english-it.json).
- 4 chủ đề, 12 bài; nội dung nền tảng được nối tiếp bằng các tình huống làm đồ án.
- 102 từ/cụm từ, mỗi mục có loại từ, nghĩa, cụm thường dùng, ví dụ tiếng Anh và bản dịch tiếng Việt.
- 60 câu quiz và 40 câu kiểm tra chủ đề, kèm đáp án và giải thích; có bài đọc ngắn và hoạt động luyện nhớ hai chiều.
- 9 bài mới có hội thoại đọc phân vai, bài nói/viết với mẫu và tiêu chí tự kiểm. Các hoạt động này không chấm tự động.

| Chủ đề | Bài học | Đầu ra thực hành |
|---|---|---|
| IT Vocabulary Foundations | Computers and Files; Building and Testing Software; Web Apps and Data | Hiểu từ IT và diễn tả luồng ứng dụng đơn giản |
| Describing Your Project | Who Is Your App For?; Features and Scope; Giving a Short Demo | Giới thiệu đối tượng, phạm vi và luồng demo |
| Team Communication | Sharing a Progress Update; Asking for Help and Clarification; Agreeing on a Team Plan | Viết cập nhật tiến độ, lời nhờ hỗ trợ và danh sách việc có người phụ trách |
| Bugs and Troubleshooting | Writing a Clear Bug Report; Investigating a Problem; Checking a Fix and Reporting Back | Viết báo cáo lỗi và kết quả kiểm tra lại có phạm vi rõ ràng |

Các project WordSteps, StudyPath, nhân vật, thời hạn và phiên bản trong học liệu là tình huống giả lập, không xác nhận tính năng hoặc tình trạng lỗi thực tế của Sprout.

Để demo phần học từ: mở **Computers and Files**, học `upload` và `download`, che nghĩa để tự nhớ rồi làm quiz. Sau khi nhập CMS, thêm hai từ này vào flashcard và mở phần ôn tập. Phần IT là gói nội dung chưa nhập database, không kèm audio hoặc kịch bản nghe.

JSON IT dùng cùng quy ước câu hỏi và ánh xạ CMS bên dưới. Các trường bổ sung `part_of_speech`, `collocation`, `example_vi` phục vụ biên soạn: CMS hiện tại chưa có các cột riêng tương ứng. Khi nhập, giữ `word`, `meaning`, `example` cho vocabulary entry và trình bày loại từ/cụm từ/bản dịch trong block `text`. Trường `dialogue` tùy chọn được đưa vào block `text` để đọc phân vai, không phải block `audio`. Không đưa nguyên các trường bổ sung vào API vocabulary. Bài IT không có trường `listening`; bỏ qua bước tạo audio cho khóa này.

Lệnh cũ `node scripts/render-it-materials.mjs` vẫn dùng được: kiểm tra cả danh mục và chỉ tạo lại Markdown IT; thêm `--check` để kiểm tra mà không ghi. Để đồng bộ cả năm khóa, dùng lệnh chung ở trên. Công cụ kiểm tra cấu trúc không thay thế thẩm định ngôn ngữ hoặc kiểm thử nhập CMS.

## Cách dùng cho buổi demo

1. Chọn **Meeting People → Hello, I'm Linh**; giới thiệu mục tiêu, đọc bài và xem từ vựng.
2. Làm quiz 5 câu; thử sai một câu để minh họa giải thích và ôn câu sai sau khi nhập nội dung vào hệ thống.
3. Thêm từ `classmate` vào flashcard để minh họa ôn từ.
4. Học bài **This Is My Friend**, rồi làm kiểm tra chủ đề 10 câu.
5. Dùng **Daily Campus Life** để minh họa chủ đề tiếp theo và tình huống gọi món.

## Trạng thái và phần nghe

Đây là **gói nội dung**, chưa nhập vào database, chưa xuất bản trên web và chưa thay đổi fixture hiện tại. JSON chứa đáp án dành cho quản trị; không phục vụ nguyên file này từ frontend cho người đang làm bài.

Có 4 kịch bản nghe và đáp án hoạt động nghe, nhưng **chưa có file audio**. Người trình bày có thể đọc kịch bản trực tiếp để minh họa nội dung; cách này chưa kiểm chứng luồng phát audio của ứng dụng. Quiz và kiểm tra hiện chấm từ vựng, ngữ pháp, đọc hiểu; chưa có câu nghe được chấm tự động. Chưa đủ điều kiện đánh dấu IMP-01 hoàn thành.

Để tạo audio: thu giọng có sự đồng ý của người đọc hoặc dùng TTS với quyền sử dụng phù hợp; đọc đúng lời thoại, không đọc nhãn người nói, không nhạc nền. Gợi ý tốc độ 100–120 từ/phút, nghỉ giữa lượt nói. Nghe lại toàn bộ, đối chiếu từng câu và kiểm tra các số/giờ trước khi tải MP3 hoặc M4A vào CMS. Lưu nguồn, người đọc/công cụ, ngày tạo và điều kiện sử dụng cùng asset.

## Ánh xạ sang CMS hiện tại

JSON là định dạng biên soạn, **không phải payload API hay seed SQL chạy trực tiếp**. Các `key` là khóa nội dung ổn định, không phải UUID database.

| Trường học liệu | Đích trong project |
|---|---|
| `course`, `topics` | Khóa học và chủ đề, giữ thứ tự mảng |
| `lessons[].objectives` | Mục tiêu lesson revision |
| `vocabulary` | Vocabulary entries và block `vocabulary` dùng UUID đã tạo |
| `grammar` | Block `grammar`, trường `body` |
| `reading` | Block `reading`, trường `body` |
| `reading_task`, `practice` | Block `text` |
| `dialogue` (tùy chọn) | Block `text` để đọc phân vai; không tự tạo audio |
| `listening` | Chỉ tạo block `audio` sau khi có asset thật; dùng `transcript` khớp audio |
| `quiz` | Assessment loại `quiz`, liên kết lesson |
| `test` | Assessment loại `topic_test`, liên kết topic |
| `test[].lesson_key` | Lesson nguồn của câu hỏi kiểm tra |

Trắc nghiệm: chuyển mảng `options` thành các option có khóa A/B/C theo thứ tự, `answer` thành `correct_option_key`. Điền từ: chuyển `answers` thành `accepted_answers`. Giữ `explanation` ở answer key, không đưa vào prompt. Câu có `use_reading: true` cần sao chép bài đọc tương ứng vào trường `passage`; câu trong test dùng `test_passage` của chủ đề. Câu không có cờ này là câu độc lập. Backend bỏ khác biệt hoa/thường và khoảng trắng khi chấm; không giả định tự bỏ dấu câu hoặc tự đổi số viết chữ sang chữ số.

Các trường `references`, `provenance`, điểm đánh giá ngành và quy mô trong danh mục phục vụ biên soạn/kiểm tra; không đưa trực tiếp vào payload API hiện tại. Cùng một từ ở hai ngành có thể có nghĩa khác nhau (ví dụ `feature`), nên không tự gộp vocabulary chỉ dựa trên chữ `word`.

Importer kỹ thuật hiện có tại `scripts/import-technical-materials.mjs`: ánh xạ khóa → UUIDv5, lưu biên nhận với hash trong `content.audit_events`, mặc định dry-run và chỉ import bản nháp khi gọi `--apply --expect-hash`. Không tự cập nhật dữ liệu đã import nếu nguồn hoặc CMS thay đổi. Xem báo cáo audit để chạy và xử lý xung đột. Bộ A1 chưa có importer trong phạm vi này.

## Rà soát trước buổi trình bày

- Giá và nhân vật trong bài là tình huống giả lập; không phải dữ liệu cá nhân hoặc giá bán thực tế.
- Mỗi quiz có 5 câu, mỗi bài kiểm tra chủ đề có 10 câu; câu kiểm tra là bộ riêng.
- Câu trả lời điền từ yêu cầu rõ một từ hoặc định dạng số; không chấm tự động các bài nói/viết tự do.
- Nhờ giáo viên duyệt ngôn ngữ, độ khó và nghe audio trước khi dùng làm học liệu chính thức.
