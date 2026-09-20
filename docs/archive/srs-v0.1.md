# Đặc tả yêu cầu hệ thống hỗ trợ tự học tiếng Anh

| Thuộc tính | Giá trị |
|---|---|
| Phiên bản | 0.1 |
| Ngày lập | 16/09/2026 |
| Trạng thái | Bản nháp để nhóm rà soát và chốt phạm vi |
| Đối tượng đọc | Thành viên nhóm, giảng viên hướng dẫn, người kiểm thử |
| Căn cứ | Trao đổi của nhóm trong phiên làm việc; `NHOM_5.docx`; `Kế hoạch PBL6_CNCNPM 2026_2027.docx` |

Tài liệu mô tả yêu cầu của hệ thống tự học tiếng Anh dành cho sinh viên học nền tảng, lấy lộ trình học và ôn tập làm trọng tâm. Mục đích là giúp nhóm thống nhất sản phẩm cần xây dựng, hành vi mong đợi và điều kiện nghiệm thu trước khi thiết kế chi tiết.

Tài liệu phân biệt quyết định đã được xác nhận với đề xuất trong quá trình trao đổi. Các con số, thuật toán và tính năng chưa được chốt không tự động trở thành yêu cầu bắt buộc chỉ vì đã xuất hiện trong bản SRS này.

## 1. Quy ước trạng thái và mức ưu tiên

### 1.1. Trạng thái quyết định

| Nhãn | Ý nghĩa |
|---|---|
| **ĐÃ CHỐT** | Được người đại diện nhóm xác nhận trực tiếp trong trao đổi |
| **THEO TÀI LIỆU GỐC** | Có trong tài liệu học phần hoặc đề cương; cần đối chiếu khi điều chỉnh phạm vi |
| **ĐỀ XUẤT** | Phương án đã được đưa ra nhưng chưa được xác nhận chi tiết |
| **CHƯA CHỐT** | Còn thiếu quyết định hoặc có nhiều cách hiểu ảnh hưởng đến triển khai |

Mức ưu tiên đề xuất:

- **P0:** Cần cho chu trình học cốt lõi và bản demo đầu tiên có thể sử dụng.
- **P1:** Hoàn thiện trải nghiệm hoặc tạo điểm nổi bật sau khi P0 ổn định.
- **P2:** Phần mở rộng; chỉ cam kết khi nhóm xác nhận đủ nguồn lực.

Mức ưu tiên không thay thế trạng thái quyết định. Một chức năng P0 vẫn cần xác nhận nếu đang mang nhãn ĐỀ XUẤT.

### 1.2. Những nội dung đã thống nhất

| Mã | Nội dung | Trạng thái |
|---|---|---|
| DEC-01 | Đối tượng chính là sinh viên học tiếng Anh nền tảng | ĐÃ CHỐT |
| DEC-02 | Điểm nổi bật là lộ trình học và ôn tập | ĐÃ CHỐT |
| DEC-03 | Sử dụng TypeScript, AWS và Supabase | ĐÃ CHỐT |
| DEC-04 | Triển khai theo kiến trúc microservice | ĐÃ CHỐT |
| DEC-05 | Nhóm có 4 thành viên; mức độ quen AWS/Supabase trung bình đến khá | ĐÃ CHỐT |
| DEC-06 | Thời gian thực hiện khoảng 3 tháng | ĐÃ CHỐT; chưa có ngày bắt đầu, ngày nộp và mốc báo cáo cụ thể |
| DEC-07 | Phục vụ quy mô đồ án khoảng 20–100 người dùng và có triển khai thực tế | ĐÃ CHỐT; chưa xác định người dùng đồng thời |
| DEC-08 | Ưu tiên trial/credits của AWS và chi phí thấp | ĐÃ CHỐT; chưa có mức trần ngân sách |
| DEC-09 | Định hướng lại đề cương thay vì mặc định giữ toàn bộ danh sách chức năng ban đầu | ĐÃ CHỐT về mong muốn của nhóm; chưa xác nhận với giảng viên |

### 1.3. Ràng buộc từ học phần

Theo tài liệu kế hoạch PBL6, sản phẩm cần có Web Admin, Web cho người dùng cuối và app mobile; tất cả phải được triển khai thực tế. Hồ sơ bàn giao gồm yêu cầu, phân tích, thiết kế, kiểm thử, tài liệu triển khai, báo cáo, slide, mã nguồn và dữ liệu.

Đây là yêu cầu **THEO TÀI LIỆU GỐC**. Hình thức bàn giao mobile, nền tảng Android/iOS và phạm vi tương đương giữa web/mobile cần chốt với giảng viên.

## 2. Mục tiêu và phạm vi sản phẩm

### 2.1. Mục tiêu

- **OBJ-01:** Giúp người học biết nên bắt đầu ở đâu và nên học bài nào tiếp theo.
- **OBJ-02:** Kết hợp tiếp thu kiến thức với luyện tập có phản hồi và giải thích.
- **OBJ-03:** Giúp người học ôn từ vựng đã lưu và câu hỏi từng làm sai.
- **OBJ-04:** Cho người học nhìn thấy tiến độ, kết quả và nội dung cần ôn.
- **OBJ-05:** Tạo chu trình học nhất quán trên web/mobile và nội dung có thể biên soạn qua Web Admin.

Tiêu chí thành công của đồ án là chứng minh các hành vi trên hoạt động với dữ liệu và người dùng thử thực tế. Chưa đặt mục tiêu chứng minh mức tăng trình độ tiếng Anh bằng một nghiên cứu đánh giá hiệu quả học tập.

### 2.2. Chu trình sử dụng chính

> Chọn lộ trình → mở bài học → học nội dung → làm quiz → lưu từ cần nhớ → ôn flashcard/câu sai → kiểm tra cuối chủ đề → xem tiến độ và tiếp tục học.

Hai chức năng bổ sung được đề xuất là **phiên học hằng ngày** và **nghe chép chính tả (Dictation)**. Nhóm đã yêu cầu tổng hợp thành SRS sau khi thảo luận, nhưng chưa chốt riêng việc đưa cả hai vào phạm vi bắt buộc.

### 2.3. Phạm vi nội dung đề xuất

- Tiếng Anh nền tảng, định hướng nội dung A1–A2 và chủ đề gần gũi với sinh viên.
- Các nội dung chính: từ vựng, ngữ pháp, đọc hiểu và nghe hiểu.
- Kết quả kiểm tra chỉ đánh giá nội dung trong hệ thống, không chứng nhận trình độ CEFR.
- Giao diện tiếng Việt; nội dung học kết hợp tiếng Anh với phần giải thích tiếng Việt.

**CHƯA CHỐT:** phạm vi trình độ chính thức, ngôn ngữ giao diện, số chủ đề/bài học/câu hỏi/từ vựng, nguồn nội dung và người chịu trách nhiệm kiểm tra chất lượng.

## 3. Người sử dụng và bề mặt sản phẩm

| Vai trò | Nhu cầu và trách nhiệm |
|---|---|
| Người học / Customer | Học theo lộ trình, luyện tập, ôn tập, làm kiểm tra và xem tiến độ cá nhân |
| Editor | Biên soạn và quản lý nội dung trong phạm vi được cấp quyền |
| Administrator | Quản lý tài khoản, quyền của Editor và thống kê hệ thống |
| Khách chưa đăng nhập | Đề cương gốc cho phép xem bài public; phạm vi truy cập trong định hướng mới CHƯA CHỐT |

| Sản phẩm | Phạm vi đề xuất |
|---|---|
| Web người học | Toàn bộ chu trình học cốt lõi |
| App mobile | Học, quiz, flashcard, ôn tập, kiểm tra và theo dõi tiến độ; phạm vi Dictation/phiên học hằng ngày phụ thuộc quyết định bổ sung |
| Web Admin | Quản lý nội dung, tài khoản, phân quyền và thống kê |

Đăng nhập, đăng ký, khôi phục mật khẩu và quản lý phiên **chưa được đặc tả chi tiết ở vòng này theo yêu cầu tập trung vào chức năng học tập**. Chúng vẫn là phụ thuộc của việc lưu dữ liệu cá nhân và phân quyền, không được hiểu là đã loại khỏi sản phẩm.

## 4. Yêu cầu chức năng học tập

Các yêu cầu FR dưới đây là **ĐỀ XUẤT** trừ khi có ghi khác. Điều kiện nghiệm thu là cơ sở kiểm thử sau khi nhóm chốt yêu cầu tương ứng.

### 4.1. FR-01 Lộ trình học — P0

**Mục đích:** Người học biết thứ tự bài học và vị trí hiện tại trong lộ trình.

**Yêu cầu:**

- Hiển thị lộ trình theo cấu trúc trình độ → chủ đề → bài học.
- Cho người học chọn lộ trình và xem mục tiêu của từng chủ đề/bài học.
- Hiển thị trạng thái chưa học, đang học, đã hoàn thành.
- Cho tiếp tục bài đang học và gợi ý bài tiếp theo theo thứ tự biên soạn.
- Cho mở lại bài đã hoàn thành.

**Nghiệm thu:** Người học chọn một lộ trình, mở bài, hoàn thành điều kiện của bài và nhìn thấy tiến độ cùng bài tiếp theo được cập nhật.

**CHƯA CHỐT:** có khóa bài theo điều kiện tiên quyết hay không; học một hay nhiều lộ trình; cách chuyển lộ trình; điều kiện hoàn thành bài. Đề xuất ban đầu là không khóa bài và gợi ý theo thứ tự cố định.

### 4.2. FR-02 Nội dung bài học — P0

**Mục đích:** Cung cấp kiến thức đủ để người học thực hiện phần luyện tập liên quan.

**Yêu cầu:**

- Mỗi bài có tên, mục tiêu và nội dung học.
- Hỗ trợ từ vựng gồm từ, nghĩa, ví dụ; phiên âm và audio khi có dữ liệu.
- Hỗ trợ giải thích ngữ pháp, đoạn đọc và audio nghe hiểu.
- Một bài có thể kết hợp nhiều loại nội dung, không bắt buộc đủ tất cả các loại.
- Cho lưu bài yêu thích và thêm từ vựng của bài vào bộ thẻ cá nhân.
- Ghi nhận bài đang học để người dùng mở lại.

**Nghiệm thu:** Người học đọc được nội dung, phát được audio được cung cấp, lưu được bài/từ và truy cập phần luyện tập tương ứng.

**CHƯA CHỐT:** thời lượng bài, cấu trúc trình soạn thảo, hỗ trợ hình ảnh/video, thời điểm cho xem transcript và lưu vị trí chi tiết trong bài. Thời lượng 5–15 phút chỉ là đề xuất thiết kế nội dung.

### 4.3. FR-03 Quiz trong bài — P0

**Mục đích:** Luyện kiến thức ngay sau khi học và nhận phản hồi để sửa sai.

**Yêu cầu:**

- Gắn quiz với bài học.
- Đề xuất ba dạng câu hỏi: trắc nghiệm một đáp án, điền từ và sắp xếp từ.
- Câu hỏi có nội dung, đáp án và giải thích; có thể tham chiếu đoạn đọc/audio.
- Cho kiểm tra câu trả lời và xem đúng/sai cùng giải thích.
- Tổng kết kết quả khi kết thúc lượt làm.
- Cho làm lại toàn bộ hoặc luyện riêng các câu sai.
- Lưu lịch sử từng lượt; không ghi đè lượt trước khi làm lại.

**Nghiệm thu:** Với bộ câu hỏi có đáp án xác định, hệ thống tính đúng kết quả, hiển thị giải thích và tạo được danh sách câu cần ôn.

**CHƯA CHỐT:** số câu, công thức tính điểm, bỏ qua câu, thứ tự câu và thời điểm hiển thị đáp án. Đề xuất: 5–10 câu; điểm dựa trên lần trả lời đầu tiên trước khi xem đáp án.

Đối với điền từ, đề xuất bỏ qua hoa/thường và khoảng trắng thừa, so với danh sách đáp án hợp lệ do Editor nhập. Chính sách dấu câu, lỗi chính tả và đáp án tương đương cần xác nhận; không mặc định dùng AI chấm tự luận.

### 4.4. FR-04 Flashcard cá nhân — P0

**Mục đích:** Lưu và ôn từ vựng cần nhớ.

**Yêu cầu:**

- Cho lưu từ vựng trong bài học vào bộ thẻ cá nhân.
- Cho tạo thẻ thủ công với từ, nghĩa và ví dụ.
- Mặt trước hiển thị từ; mặt sau hiển thị nghĩa, ví dụ, phiên âm/audio nếu có.
- Cho lật thẻ và tự đánh giá Nhớ hoặc Chưa nhớ.
- Cho xem, sửa và bỏ thẻ cá nhân khỏi danh sách ôn.
- Đề xuất tổ chức thẻ theo bộ/chủ đề.

**Nghiệm thu:** Người học lưu hoặc tạo một thẻ, mở phiên ôn, lật thẻ, gửi đánh giá và xem được trạng thái ôn đã cập nhật.

**CHƯA CHỐT:** quyền sửa thẻ lấy từ bài học, xử lý lưu trùng từ, số bộ thẻ, giới hạn số thẻ và có hỗ trợ nhập hàng loạt hay không. Chưa đưa chia sẻ bộ thẻ vào phạm vi.

### 4.5. FR-05 Ôn flashcard theo lịch — P0

**Mục đích:** Đưa các thẻ cần ôn trở lại đúng thời điểm theo quy tắc thống nhất.

**Yêu cầu:**

- Lưu trạng thái và thời điểm ôn tiếp theo cho từng thẻ của từng người học.
- Hiển thị số thẻ mới và thẻ đến hạn.
- Cho bắt đầu phiên ôn và ghi nhận từng lần đánh giá Nhớ/Chưa nhớ.
- Cập nhật lịch ôn dựa trên đánh giá.
- Cho ôn các thẻ quá hạn khi người học quay lại.

**Quy tắc ĐỀ XUẤT, chưa chốt:** Các khoảng cách ôn tăng theo 1 → 3 → 7 → 14 ngày. Chọn Chưa nhớ đưa thẻ về mốc ngắn; có thể đưa lại vào phiên hiện tại.

**Nghiệm thu:** Với thời gian được kiểm soát trong kiểm thử, thẻ xuất hiện đúng hạn và lịch mới khớp với quy tắc đã chọn.

**CHƯA CHỐT:** thuật toán cuối cùng, hành vi sau mốc 14 ngày, thời điểm ôn thẻ mới, cách lặp thẻ trong phiên, múi giờ và giới hạn thẻ mỗi ngày.

### 4.6. FR-06 Ôn câu hỏi từng làm sai — P0

**Mục đích:** Giúp người học quay lại kiến thức chưa nắm vững.

**Yêu cầu:**

- Tập hợp câu sai từ quiz và kiểm tra cuối chủ đề.
- Hiển thị câu hỏi cùng bài/chủ đề liên quan.
- Cho trả lời lại và nhận giải thích.
- Giữ lịch sử kết quả dù câu đã được xử lý khỏi danh sách cần ôn.
- Câu sai lặp lại không tạo nhiều bản trùng trong danh sách đang chờ ôn.

**Nghiệm thu:** Làm sai một câu khiến câu xuất hiện trong danh sách; lượt ôn tiếp theo cập nhật trạng thái và lịch sử đúng với quy tắc đã chốt.

**CHƯA CHỐT:** cần trả lời đúng một lần hay nhiều lần để coi là đã ôn xong; có hẹn lịch ôn lại câu hỏi hay không. Đề xuất ban đầu là trả lời đúng trong một lượt ôn mới thì bỏ khỏi danh sách chờ hiện tại.

### 4.7. FR-07 Kiểm tra cuối chủ đề — P0

**Mục đích:** Đánh giá tổng hợp kiến thức của nhiều bài trong một chủ đề.

**Yêu cầu:**

- Cung cấp bài kiểm tra gồm câu hỏi thuộc chủ đề.
- Chỉ hiển thị đáp án và giải thích sau khi nộp toàn bài.
- Chấm điểm và hiển thị kết quả, câu sai, nội dung liên quan cần ôn.
- Cho làm lại và lưu kết quả từng lượt.
- Gợi ý ôn dựa trên liên kết giữa câu sai với bài/kiến thức; chưa yêu cầu AI.

**Nghiệm thu:** Không lấy được đáp án qua giao diện/API dành cho người học trước thời điểm được xem; nộp bài trả kết quả đúng và tạo dữ liệu ôn tập tương ứng.

**CHƯA CHỐT:** ngưỡng đạt, số câu, giới hạn thời gian, giới hạn lượt làm, đề cố định hay ngẫu nhiên, điều kiện mở bài kiểm tra và xử lý gián đoạn. Đề xuất ban đầu: 15–20 câu và ngưỡng đạt 70%.

### 4.8. FR-08 Tiến độ và lịch sử học — P0

**Mục đích:** Người học thấy đã học gì và cần tiếp tục ở đâu.

**Yêu cầu:**

- Hiển thị bài đang học, đã hoàn thành và tiến độ theo chủ đề/lộ trình.
- Hiển thị lịch sử quiz, kiểm tra, điểm và thời gian thực hiện.
- Hiển thị số thẻ đến hạn và số câu đang cần ôn.
- Dùng chung dữ liệu tiến độ giữa web/mobile của cùng người học.
- Chỉ người có quyền phù hợp được truy cập dữ liệu cá nhân.

**Nghiệm thu:** Hoàn thành hoạt động trên một thiết bị; mở hoặc tải lại màn hình liên quan trên thiết bị khác sẽ nhận tiến độ đã lưu.

**CHƯA CHỐT:** cách tính phần trăm hoàn thành, lấy điểm cao nhất hay gần nhất, độ trễ đồng bộ và xử lý hoạt động đồng thời. Chưa yêu cầu đồng bộ thời gian thực hoặc sử dụng offline.

### 4.9. FR-09 Mục tiêu hằng ngày và chuỗi ngày học — P1

**Yêu cầu:**

- Cho đặt mục tiêu theo số bài học hoặc số thẻ ôn mỗi ngày.
- Hiển thị mức hoàn thành mục tiêu hôm nay.
- Hiển thị chuỗi ngày có hoạt động học hợp lệ.

**Nghiệm thu:** Hoạt động hợp lệ được tính đúng ngày; việc chỉ mở ứng dụng không tự động tăng chuỗi ngày học.

**CHƯA CHỐT:** loại mục tiêu được hỗ trợ, định nghĩa phiên ôn hoàn thành, múi giờ, cách đổi mục tiêu giữa ngày và quy tắc gián đoạn chuỗi. Đề xuất ghi nhận ngày học khi hoàn thành quiz hoặc phiên ôn.

### 4.10. FR-10 Phiên học hằng ngày — P1, bổ sung chưa chốt

**Mục đích:** Tạo danh sách hoạt động cụ thể để người học biết hôm nay cần làm gì.

**Yêu cầu ĐỀ XUẤT:**

- Ghép hoạt động theo thứ tự: flashcard đến hạn → câu sai cần ôn → bài tiếp theo.
- Hiển thị danh sách hoạt động và mức hoàn thành phiên.
- Cho bỏ qua hoạt động hoặc kết thúc sớm.
- Khi chưa có lịch sử học, gợi ý bắt đầu bằng bài đầu của lộ trình đã chọn.
- Sử dụng tiến độ hiện có, không tạo một bộ kết quả học độc lập.

**Nghiệm thu:** Với dữ liệu có thẻ đến hạn và câu sai, hệ thống tạo đúng danh sách ưu tiên; với người mới, không hiển thị hoạt động ôn không có dữ liệu.

**CHƯA CHỐT:** có bắt buộc trong bản nộp hay không; số lượng hoạt động, cách tiếp tục phiên dở, thay đổi danh sách trong ngày và xử lý khi đã học hết lộ trình.

### 4.11. FR-11 Nghe chép chính tả — P1, bổ sung chưa chốt

**Mục đích:** Luyện nghe chủ động thông qua nhập lại câu đã nghe.

**Yêu cầu ĐỀ XUẤT:**

- Mỗi câu có audio và transcript chính xác được biên soạn sẵn.
- Cho phát/nghe lại audio và nhập câu trả lời.
- Sau khi nộp, đánh dấu từ thiếu, thừa hoặc sai và hiển thị câu đúng.
- Cho thử lại, lưu số lần thử và kết quả.
- Có thể hỗ trợ tốc độ phát chậm và đưa câu sai vào phần ôn tập.

**Nghiệm thu:** Câu trả lời đúng được nhận diện; câu có từ thiếu/thừa/sai được phản hồi đúng theo chính sách so khớp đã chọn.

**CHƯA CHỐT:** có bắt buộc trong bản nộp hay không; công thức điểm, xử lý dấu câu/từ viết tắt/biến thể hợp lệ, số câu mỗi bài, tốc độ phát và tích hợp danh sách câu sai. Đề xuất 3–5 câu ngắn, bỏ qua hoa/thường và dấu câu cơ bản; không yêu cầu nhận diện giọng nói hoặc AI.

## 5. Yêu cầu quản lý nội dung và hệ thống

Phần này ghi nhận những khả năng cần để vận hành các chức năng học tập. Phân quyền chi tiết vẫn cần một vòng đặc tả riêng.

| Mã | Chức năng | Yêu cầu dự kiến | Trạng thái |
|---|---|---|---|
| CMS-01 | Quản lý lộ trình/chủ đề | Tạo, sửa, sắp xếp, quản lý trạng thái; gắn bài học vào chủ đề | ĐỀ XUẤT mở rộng từ quản lý danh mục trong tài liệu gốc |
| CMS-02 | Quản lý bài học | Biên soạn, xem trước, lưu nháp và xuất bản nội dung | Quản lý bài học THEO TÀI LIỆU GỐC; quy trình nháp/xuất bản ĐỀ XUẤT |
| CMS-03 | Quản lý câu hỏi | Nhập loại câu, đáp án, giải thích, liên kết bài/chủ đề; tạo quiz/kiểm tra | ĐỀ XUẤT để hỗ trợ chấm điểm và ôn tập |
| CMS-04 | Quản lý từ vựng và media | Quản lý nghĩa, ví dụ, phiên âm, audio và transcript tương ứng | ĐỀ XUẤT |
| ADM-01 | Quản lý tài khoản và Editor | Quản lý trạng thái tài khoản; cấp quyền cho Editor | THEO TÀI LIỆU GỐC; chưa đặc tả chi tiết |
| ADM-02 | Thống kê | Số nội dung, người học, hoạt động học và kết quả tổng hợp | THEO TÀI LIỆU GỐC; chỉ số và quyền xem CHƯA CHỐT |

**CHƯA CHỐT:** Editor có được tự xuất bản hay cần Admin duyệt; có được quản lý học viên hay không; quyền theo loại thao tác hay theo nội dung; xóa mềm/ẩn/xóa hẳn; xử lý lịch sử học khi nội dung đã xuất bản thay đổi.

## 6. Đối chiếu đề cương gốc và các phần chưa đưa vào phạm vi cốt lõi

| Nội dung | Cách xử lý trong bản SRS này |
|---|---|
| Đăng nhập, đăng xuất, đăng ký, hồ sơ cá nhân | Có trong đề cương gốc; chưa mô tả chi tiết ở vòng chức năng học tập |
| Quản lý học viên và Editor | Giữ ở mức yêu cầu tổng quát; cần đặc tả quyền |
| Tìm kiếm bài học, danh mục, học viên, Editor | Có trong đề cương gốc; vị trí tìm kiếm, bộ lọc và phạm vi cần chốt |
| Email nhắc học và thông báo trong hệ thống | Có trong đề cương gốc; đề xuất P1 nhưng chưa chốt kênh gửi, lịch gửi và cách tắt thông báo |
| Thanh toán online, normal/VIP | Đề xuất P2; chưa có xác nhận được loại khỏi phạm vi bắt buộc |
| Bình luận dưới bài học | Đề xuất P2; chưa có xác nhận được loại khỏi phạm vi bắt buộc |
| Xem bài học public không cần tài khoản | CHƯA CHỐT; cần xác định nội dung public và quyền lưu tiến độ |
| Bài yêu thích và lịch sử bài học | Đã đưa vào FR-02 và FR-08 |
| Bài kiểm tra đầu vào | P2 ĐỀ XUẤT; nếu làm chỉ gợi ý điểm bắt đầu, chưa chứng nhận trình độ |
| Tra từ ngay trong bài | P2 ĐỀ XUẤT; ưu tiên từ đã được biên soạn, chưa chọn dịch vụ từ điển ngoài |
| Thử thách học 7 ngày | P2 ĐỀ XUẤT; chưa chốt |
| AI, chấm phát âm/bài viết, bảng xếp hạng, thi đấu, offline | Chưa đưa vào phạm vi dự kiến cho 3 tháng |

Việc chuyển yêu cầu của đề cương gốc sang phần mở rộng cần được nhóm và giảng viên xác nhận. Không xem bảng này là quyết định đã phê duyệt cắt bỏ chức năng.

## 7. Quy tắc nghiệp vụ cần thống nhất

| Mã | Quy tắc hoặc vấn đề | Trạng thái |
|---|---|---|
| BR-01 | Tự đánh giá flashcard không được coi là điểm kiểm tra năng lực | ĐỀ XUẤT |
| BR-02 | Làm lại quiz/kiểm tra tạo lượt mới, giữ lịch sử lượt trước | ĐỀ XUẤT |
| BR-03 | Quiz cho phản hồi từng câu; kiểm tra cuối chủ đề trả đáp án sau khi nộp | ĐỀ XUẤT |
| BR-04 | Chấm điểm do phía máy chủ thực hiện; client không được tự quyết định điểm lưu | ĐỀ XUẤT |
| BR-05 | Không trả đáp án qua API người học trước thời điểm được phép xem | ĐỀ XUẤT |
| BR-06 | Dữ liệu học của mỗi người phải được tách quyền truy cập | ĐỀ XUẤT |
| BR-07 | Sửa câu hỏi đã có lượt làm không được làm sai lệch kết quả lịch sử | ĐỀ XUẤT yêu cầu; cơ chế phiên bản/lưu bản chụp CHƯA CHỐT |
| BR-08 | Nộp lại cùng một yêu cầu do mạng chậm không tạo điểm, tiến độ hoặc lịch ôn trùng | ĐỀ XUẤT yêu cầu; cơ chế xử lý CHƯA CHỐT |
| BR-09 | Bài nháp không hiển thị cho người học; nội dung bị ẩn không làm mất lịch sử đã có | ĐỀ XUẤT |
| BR-10 | Hoàn thành bài, đạt chủ đề và học trong ngày là các khái niệm riêng | CHƯA CHỐT điều kiện cụ thể |

## 8. Dữ liệu và tích hợp ở mức khái niệm

### 8.1. Dữ liệu cần quản lý

- Lộ trình, trình độ, chủ đề, bài học và trạng thái xuất bản.
- Từ vựng, ví dụ, audio, transcript và nội dung đọc/ngữ pháp.
- Câu hỏi, phương án, đáp án hợp lệ, giải thích và liên kết kiến thức.
- Quiz, bài kiểm tra, lượt làm, câu trả lời và kết quả.
- Bộ flashcard cá nhân, thẻ, lịch sử ôn và hạn ôn tiếp theo.
- Danh sách câu sai cần ôn và lịch sử luyện lại.
- Tiến độ bài học, bài yêu thích, mục tiêu và hoạt động theo ngày.
- Vai trò/quyền truy cập; dữ liệu phiên học hằng ngày và Dictation nếu được chọn.

Đây là danh sách khái niệm nghiệp vụ, chưa phải thiết kế bảng hoặc quyết định chia database theo service.

### 8.2. Ràng buộc công nghệ

- **ĐÃ CHỐT:** TypeScript, AWS, Supabase và kiến trúc microservice.
- **CHƯA CHỐT:** framework web/mobile/backend; danh sách service; quyền sở hữu dữ liệu; giao tiếp đồng bộ/bất đồng bộ; cách triển khai từng service.
- **CHƯA CHỐT:** AWS chịu trách nhiệm những thành phần nào; dùng các khả năng Auth/Database/Storage nào của Supabase; có cần hàng đợi, gateway hoặc cache hay không.
- Chưa chọn nhà cung cấp email, nguồn audio, từ điển ngoài hoặc dịch vụ AI.

Kiến trúc phải thể hiện được ranh giới trách nhiệm và cách triển khai các service. Số lượng service sẽ được quyết định sau khi chốt chức năng, phù hợp nhóm 4 người và thời gian 3 tháng. Bản SRS này không mặc định một chức năng tương ứng một service.

## 9. Yêu cầu phi chức năng và vận hành

| Mã | Yêu cầu | Trạng thái và giới hạn |
|---|---|---|
| NFR-01 | Phục vụ quy mô đồ án 20–100 người dùng | ĐÃ CHỐT về quy mô; chưa có số người đồng thời hoặc tải mục tiêu |
| NFR-02 | Có môi trường triển khai thực tế để giảng viên và người dùng thử truy cập | ĐÃ CHỐT; chưa xác định yêu cầu hoạt động liên tục |
| NFR-03 | Ưu tiên trial/credits và cấu hình có chi phí thấp | ĐÃ CHỐT; cần kiểm tra quyền lợi thực tế của tài khoản và chốt ngân sách dự phòng |
| NFR-04 | Bảo vệ dữ liệu cá nhân và chặn truy cập sai quyền | ĐỀ XUẤT bắt buộc; cần ma trận quyền và kiểm thử truy cập trực tiếp API |
| NFR-05 | Thông báo rõ khi lưu/nộp thất bại; không hiển thị thành công khi dữ liệu chưa được ghi nhận | ĐỀ XUẤT |
| NFR-06 | Không mất hoặc nhân đôi kết quả vì gửi lại cùng một lần nộp | ĐỀ XUẤT |
| NFR-07 | Web dùng được trên kích thước màn hình mục tiêu; mobile hoạt động trên nền tảng đã chọn | ĐỀ XUẤT; trình duyệt, Android/iOS và phiên bản tối thiểu CHƯA CHỐT |
| NFR-08 | Có migration, dữ liệu mẫu và hướng dẫn tái tạo môi trường | ĐỀ XUẤT để bàn giao và phục hồi demo |
| NFR-09 | Có log lỗi đủ để xác định service bị lỗi và thao tác thất bại, không ghi khóa bí mật | ĐỀ XUẤT; công cụ và thời gian lưu log CHƯA CHỐT |
| NFR-10 | Dùng kết nối HTTPS cho môi trường public; khóa đặc quyền chỉ nằm ở phía máy chủ | ĐỀ XUẤT |
| NFR-11 | Có bản sao dữ liệu cần thiết và hướng dẫn khôi phục trước bảo vệ | ĐỀ XUẤT; tần suất sao lưu và thời gian khôi phục CHƯA CHỐT |

Chưa có cam kết về số request/giây, độ trễ, uptime hoặc khả năng tự mở rộng. Các giá trị này cần được chốt theo tải demo thực tế; số tài khoản không đồng nghĩa số người dùng đồng thời.

## 10. Kịch bản nghiệm thu dự kiến

Các kịch bản dưới đây kiểm chứng chức năng sau khi các quy tắc liên quan được chốt. Nội dung P1/P2 chỉ được đưa vào nghiệm thu bắt buộc khi nhóm xác nhận triển khai.

| Mã | Kịch bản | Kết quả mong đợi | Liên quan |
|---|---|---|---|
| AT-01 | Người mới chọn lộ trình và học bài đầu | Nội dung đúng lộ trình; tiến độ cập nhật theo điều kiện hoàn thành đã chốt | FR-01, FR-02, FR-08 |
| AT-02 | Làm quiz với câu đúng và sai ở các dạng hỗ trợ | Chấm đúng, giải thích đúng, lưu lượt làm và câu cần ôn | FR-03, FR-06 |
| AT-03 | Lưu từ trong bài, tạo thẻ riêng và ôn | Thẻ thuộc đúng người; trạng thái và lịch ôn được lưu | FR-04, FR-05 |
| AT-04 | Đến hạn ôn hoặc quay lại sau ngày hẹn | Danh sách thẻ phản ánh đúng thời gian và quy tắc ôn | FR-05 |
| AT-05 | Làm sai, ôn đúng rồi làm sai lại một câu | Danh sách chờ và lịch sử cập nhật đúng, không có mục trùng | FR-06 |
| AT-06 | Làm kiểm tra và yêu cầu đáp án trước/sau khi nộp | Đáp án chỉ được trả đúng thời điểm; điểm và gợi ý ôn đúng | FR-07, BR-05 |
| AT-07 | Học trên web, sau đó mở mobile | Nhận được dữ liệu tiến độ đã lưu của cùng người học | FR-08 |
| AT-08 | Người dùng A yêu cầu dữ liệu học của B hoặc thao tác quản trị | Bị từ chối; không lộ dữ liệu | NFR-04 |
| AT-09 | Nộp lại do timeout hoặc bấm hai lần | Không tạo kết quả, tiến độ hay lịch ôn trùng cho cùng thao tác | BR-08, NFR-06 |
| AT-10 | Editor lưu nháp, xuất bản rồi thay đổi nội dung đã có kết quả học | Nháp không public; xuất bản đúng quyền; lịch sử vẫn nhất quán | CMS-02, BR-07, BR-09 |
| AT-11 | Tạo phiên hằng ngày khi có/không có dữ liệu ôn | Danh sách hoạt động đúng và xử lý được trạng thái trống | FR-10 |
| AT-12 | Dictation với câu đúng, thiếu từ, thừa từ và lỗi chính tả | Phản hồi theo đúng quy tắc so khớp được chốt | FR-11 |
| AT-13 | Đổi ngày, đổi mục tiêu và hoàn thành hoạt động | Mục tiêu và chuỗi ngày học không bị tính trùng/sai ngày | FR-09 |
| AT-14 | Audio không tải được hoặc mạng mất lúc nộp | Có thông báo rõ, cho thử lại và không báo lưu thành công sai | FR-02, FR-11, NFR-05 |
| AT-15 | Chạy luồng chính trên môi trường deploy với tải mục tiêu | Đáp ứng ngưỡng được nhóm chốt; ghi nhận lỗi và giới hạn thực tế | NFR-01, NFR-02 |

## 11. Danh sách quyết định còn mở

Danh sách này là đầu việc cần làm rõ, không phải danh sách lỗi của hệ thống. Chủ sở hữu bên dưới là vai trò được đề xuất, chưa phải phân công cho cá nhân cụ thể.

| Mã | Cần quyết định | Tác động | Người cần tham gia | Thời điểm nên chốt |
|---|---|---|---|---|
| OPEN-01 | Giảng viên cho phép điều chỉnh đề cương đến mức nào; thanh toán/VIP, bình luận, thông báo có bắt buộc không? | Phạm vi và khối lượng toàn dự án | Nhóm + GVHD | Trước khi cam kết backlog |
| OPEN-02 | Ngày nộp, mốc báo cáo và thời gian thực tế mỗi thành viên có thể dành | Lịch thực hiện, phân công | Cả nhóm | Khi lập kế hoạch sprint |
| OPEN-03 | Phạm vi trình độ, số lượng và nguồn nội dung; ai biên soạn/duyệt? | Chất lượng học tập, công sức nhập liệu | Nhóm + người phụ trách nội dung | Trước thiết kế nội dung và dữ liệu |
| OPEN-04 | Điều kiện hoàn thành bài/chủ đề; mở khóa bài; một hay nhiều lộ trình | Tiến độ và luồng học | Nhóm | Trước triển khai FR-01/08 |
| OPEN-05 | Loại câu hỏi, cách chấm, đáp án tương đương và thời điểm xem đáp án | Quiz, kiểm tra và API | Nhóm | Trước triển khai FR-03/07 |
| OPEN-06 | Quy tắc ôn flashcard đầy đủ và điều kiện xử lý xong câu sai | Thuật toán, dữ liệu và kiểm thử | Nhóm | Trước triển khai FR-05/06 |
| OPEN-07 | Thời gian, số câu, ngưỡng đạt, lượt làm và xử lý gián đoạn kiểm tra | Trải nghiệm kiểm tra | Nhóm | Trước triển khai FR-07 |
| OPEN-08 | Có cam kết cả phiên học hằng ngày và Dictation hay chỉ một phần? | Phạm vi P1 và lịch phát triển | Nhóm | Khi chốt MVP |
| OPEN-09 | Mobile Android/iOS, cách bàn giao và mức tương đương chức năng với web | Framework, kiểm thử và phát hành | Nhóm + GVHD | Trước chọn framework mobile |
| OPEN-10 | Ma trận quyền, quyền của khách, quy trình duyệt/xuất bản và khóa tài khoản | Bảo vệ dữ liệu, quản trị | Nhóm | Trước thiết kế API/phân quyền |
| OPEN-11 | Sửa/xóa nội dung đã có lịch sử; thẻ sao chép hay tham chiếu nội dung gốc | Mô hình dữ liệu, giữ lịch sử | Nhóm | Trước thiết kế database |
| OPEN-12 | Danh sách microservice, ranh giới dữ liệu, cách giao tiếp và deploy | Kiến trúc, vận hành | Nhóm | Sau chốt chức năng, trước thiết kế kỹ thuật |
| OPEN-13 | Framework và cách phân chia trách nhiệm AWS/Supabase | Công sức triển khai, chi phí | Nhóm | Khi chốt kiến trúc |
| OPEN-14 | Tài khoản AWS đã có hay tạo mới; credits, ngân sách dự phòng và thời gian duy trì demo | Khả năng triển khai và duy trì | Nhóm | Trước tạo tài nguyên có phí |
| OPEN-15 | Người dùng đồng thời, tải thử và thời gian phản hồi chấp nhận được | Tiêu chí hiệu năng | Nhóm | Trước kiểm thử hiệu năng |
| OPEN-16 | Mục tiêu hằng ngày, múi giờ và cách tính chuỗi ngày học | Thống kê và lịch ôn | Nhóm | Trước triển khai FR-05/09 |
| OPEN-17 | Email/nhắc học, kênh gửi, lịch gửi và lựa chọn tắt | Phụ thuộc dịch vụ ngoài | Nhóm | Sau đối chiếu OPEN-01 |
| OPEN-18 | Mức chi tiết lưu tiến độ khi thoát giữa bài/quiz và xử lý hai thiết bị cùng thao tác | Nhất quán dữ liệu, trải nghiệm | Nhóm | Trước thiết kế lưu tiến độ |

## 12. Điều kiện chốt và cập nhật SRS

Trước khi coi SRS là phạm vi chính thức, nhóm cần:

1. Đối chiếu các điều chỉnh với yêu cầu của giảng viên, đặc biệt những chức năng có trong đề cương gốc.
2. Đánh dấu từng FR/CMS/ADM là bắt buộc, tùy chọn hoặc loại khỏi phiên bản nộp.
3. Chốt các quy tắc ảnh hưởng đến dữ liệu và hành vi: hoàn thành bài, chấm điểm, ôn tập, quyền truy cập và thay đổi nội dung.
4. Bổ sung nền tảng mobile, tải kiểm thử, nội dung mẫu và tiêu chí nghiệm thu có thể đo được.
5. Lập thiết kế microservice và kế hoạch 3 tháng dựa trên phạm vi đã chốt; cập nhật SRS nếu thiết kế làm phát sinh thay đổi nghiệp vụ.

| Phiên bản | Thay đổi |
|---|---|
| 0.1 | Tổng hợp định hướng đã xác nhận; mô tả yêu cầu học tập, nội dung quản trị liên quan, nghiệm thu dự kiến và các quyết định còn mở |
