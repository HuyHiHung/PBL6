# Đề xuất cải thiện MVP web

Ngày lập: **20/09/2026**. Trạng thái: **Đề xuất, chưa triển khai theo tài liệu này**.

Mục tiêu là hoàn thiện trải nghiệm và độ tin cậy của các luồng đã có trước khi bổ sung chức năng mới. Tài liệu tổ chức theo đầu ra và thứ tự phụ thuộc, không ấn định lịch hoặc số tuần. Không thay thế [SRS](../srs.md) hay tự mở rộng phạm vi MVP.

Hiện dự án có frontend người học/Admin, ba backend và Supabase local. Bằng chứng gần nhất: 7 ca kiểm thử trình duyệt, 12 ca HTTP và 22 ca database đạt; đây chưa phải nghiệm thu toàn bộ sản phẩm. Xem [frontend](frontend.md), [backend](backend-verification.md) và [database](database-verification.md).

## 1. Danh sách ưu tiên

| Mã | Ưu tiên | Hạng mục | Đầu ra chính |
|---|---|---|---|
| IMP-01 | P0 | Học liệu demo hoàn chỉnh | Một lộ trình học xuyên suốt, audio thật, không lẫn dữ liệu test |
| IMP-02 | P0 | Google OAuth thực tế | Đăng nhập, callback và liên kết danh tính được kiểm chứng |
| IMP-03 | P0 | Bảo vệ bài làm chưa lưu | Trạng thái lưu rõ ràng, rời trang an toàn, retry không nhân đôi |
| IMP-04 | P0 | Bản demo online | Frontend/backend và Supabase Cloud hoạt động qua HTTPS |
| IMP-05 | P1 | Quản trị nội dung dễ dùng | Tìm kiếm, phân trang, sắp xếp, preview và kiểm tra xuất bản |
| IMP-06 | P1 | Hướng dẫn người học mới | Từ đăng nhập đến chọn lộ trình và bài đầu tiên |
| IMP-07 | P1 | Kiểm thử trước phát hành và CI | Các luồng quan trọng được kiểm tra tự động, lỗi chặn tích hợp |
| IMP-08 | P2 | Theo dõi và tối ưu vận hành | Truy vết lỗi, đo hiệu năng, tối ưu và cải thiện khả năng truy cập |

**P0:** cần ưu tiên để có bản demo có thể sử dụng và nghiệm thu. **P1:** hoàn thiện chất lượng vận hành và trải nghiệm. **P2:** tối ưu dựa trên dữ liệu đo thực tế. Các kiểm tra bảo vệ dữ liệu cơ bản vẫn bắt buộc trước khi public, không chờ P2.

## 2. Chi tiết và tiêu chí hoàn thành

### IMP-01 — Học liệu demo hoàn chỉnh

**Vấn đề:** dữ liệu hiện tại gồm fixture và dữ liệu test; audio bootstrap là âm thanh im lặng, chưa đại diện cho trải nghiệm học.

**Công việc:**

- [ ] Chuẩn bị một lộ trình hoàn chỉnh có mục tiêu, trình độ và thứ tự bài rõ ràng.
- [ ] Biên soạn bài có từ vựng, ngữ pháp, đọc và nghe; hướng dẫn tiếng Việt dễ hiểu.
- [ ] Dùng audio thật có quyền sử dụng, transcript khớp với nội dung nghe.
- [ ] Mỗi bài có quiz 5–10 câu; mỗi chủ đề có kiểm tra 10–20 câu, đáp án và giải thích được rà soát.
- [ ] Có quy trình nhập dữ liệu demo chạy lại an toàn; tách fixture kiểm thử khỏi danh mục người học. Không xóa lịch sử học để làm sạch màn hình demo.

**Hoàn thành khi:** một tài khoản mới có thể chọn lộ trình, học, làm quiz, ôn từ/câu sai và hoàn thành kiểm tra chủ đề bằng học liệu có ý nghĩa; danh mục demo không hiển thị nội dung kiểm thử kỹ thuật.

### IMP-02 — Google OAuth thực tế

**Vấn đề:** frontend đã có tích hợp SDK nhưng provider chưa bật và chưa được kiểm thử với Google thật.

**Công việc:**

- [ ] Cấu hình Google Client ID/Secret, màn hình đồng ý và callback cho từng môi trường; secret chỉ nằm phía Auth.
- [ ] Bật provider, cấu hình cờ frontend và chỉ cho phép redirect về địa chỉ ứng dụng đã khai báo.
- [ ] Kiểm thử đăng nhập lần đầu/lần sau, hủy ở Google, lỗi hoặc callback đã dùng.
- [ ] Kiểm thử Google/email cùng danh tính theo cơ chế Supabase; không tự ghép profile theo email.
- [ ] Kiểm thử email chưa xác minh, tài khoản bị khóa, phiên bị thu hồi và Editor bị thu hồi quyền.

**Hoàn thành khi:** luồng Google thực tế hoạt động, tên người dùng đã sửa và tiến độ được giữ; không tạo profile trùng, không nâng quyền hoặc vượt qua trạng thái khóa. Các trường hợp chưa thể kiểm chứng phải được ghi rõ.

**Phụ thuộc:** credential và cấu hình Google; khi lên online cần bổ sung domain/callback của IMP-04.

### IMP-03 — Bảo vệ bài làm chưa lưu

**Vấn đề:** đáp án chưa bấm Lưu/Kiểm tra hiện chưa đồng bộ; người dùng cần biết rõ phần nào đã được lưu.

**Công việc:**

- [ ] Hiển thị các trạng thái: chưa lưu, đang lưu, đã lưu, lưu thất bại.
- [ ] Cảnh báo khi rời trang có thay đổi chưa lưu, kể cả điều hướng trong ứng dụng và đóng/tải lại trang khi trình duyệt hỗ trợ.
- [ ] Cho thử lại yêu cầu lỗi mạng bằng cùng Idempotency-Key và cùng payload của thao tác chưa rõ kết quả.
- [ ] Sau timeout khi nộp bài, đọc lại trạng thái từ server trước khi cho tạo một ý định nộp khác.
- [ ] Khi xung đột phiên bản hoặc hai tab cùng sửa, hiển thị lựa chọn đọc dữ liệu mới; không âm thầm ghi đè.
- [ ] Nếu bổ sung khôi phục bản nhập tạm, tách theo tài khoản/lượt/câu; xóa khi đăng xuất và không chứa đáp án chấm điểm.

**Hoàn thành khi:** kiểm thử mất mạng lúc lưu/nộp, reload và hai tab không làm mất dữ liệu đã được server xác nhận; retry không nhân đôi kết quả; nội dung chưa lưu được thông báo rõ. Không tự chuyển quiz sang chấm ngay khi chọn đáp án, vì việc đó thay đổi cách học hiện tại.

### IMP-04 — Bản demo online

**Vấn đề:** hệ thống hiện mới được xác minh trên local; Lambda adapter chưa được kiểm chứng trên AWS.

**Công việc:**

- [ ] Triển khai frontend, ba backend và Supabase Cloud với domain/HTTPS phù hợp.
- [ ] Áp dụng cùng lịch sử migration, cấp credential runtime riêng cho từng service và cấu hình kết nối database phù hợp môi trường chạy.
- [ ] Cấu hình CORS, callback Auth, SPA fallback và đường dẫn nội bộ giữa các service.
- [ ] Quản lý secret theo môi trường; không đưa service key, tài khoản thử hoặc lịch sử giả lên public.
- [ ] Chuẩn bị dữ liệu demo theo IMP-01, tài khoản nghiệm thu có quyền tối thiểu và quy trình cấp quyền Admin.
- [ ] Kiểm tra health, log lỗi cơ bản, sao lưu/khôi phục và hướng xử lý khi triển khai thất bại.

**Hoàn thành khi:** người dùng truy cập bằng trình duyệt trên thiết bị khác và hoàn tất luồng học; không phụ thuộc localhost; quyền runtime, Auth, media private và callback hoạt động đúng. Chi phí/tài nguyên cần được xác định trước khi tạo hạ tầng trả phí.

### IMP-05 — Quản trị nội dung dễ dùng hơn

**Công việc:**

- [ ] Tìm kiếm và phân trang các danh sách lớn; bộ chọn không bỏ sót nội dung ngoài trang đầu.
- [ ] Kéo đổi thứ tự khối/câu hỏi, đồng thời có nút lên/xuống dùng được bằng bàn phím.
- [ ] Preview sử dụng cùng cách render với trang người học, gồm audio và từ vựng.
- [ ] Hiển thị checklist trước xuất bản: số câu, lựa chọn, đáp án, media và nguồn bài/chủ đề hợp lệ.
- [ ] Phân biệt rõ bản nháp với bản đã xuất bản; thao tác tạo phiên bản mới không gây hiểu nhầm là sửa lịch sử.
- [ ] Hoàn thiện xóa nháp và lời mời Editor nếu thuộc phạm vi SRS đã chốt; bổ sung API tương ứng trước khi mở nút trên UI.

**Hoàn thành khi:** Editor có thể soạn và kiểm tra một bài/đề mà không nhập JSON/UUID; người có quyền xuất bản hiểu và sửa được lỗi validation; người thiếu quyền vẫn bị backend từ chối.

### IMP-06 — Hướng dẫn người học mới

**Công việc:**

- [ ] Sau lần đăng nhập đầu, dẫn tới hoàn tất hồ sơ nếu cần, chọn lộ trình và mở bài đầu tiên.
- [ ] Giải thích ngắn cách hoàn thành bài/chủ đề và cách dùng thẻ từ vựng.
- [ ] Phân biệt Học tiếp, Làm lại và Ôn tập; ưu tiên hành động phù hợp trạng thái thật của người học.
- [ ] Thiết kế trạng thái trống có hướng đi tiếp cho lịch sử, yêu thích, flashcard và câu sai.
- [ ] Cho bỏ qua hướng dẫn và vẫn tìm lại được từ giao diện; không bắt người đã học xem lại mỗi lần đăng nhập.

**Hoàn thành khi:** người mới có thể bắt đầu bài đầu tiên mà không cần người hướng dẫn trực tiếp; các hướng dẫn không che mất hoặc cản trở thao tác chính trên điện thoại.

### IMP-07 — Kiểm thử trước phát hành và CI

**Công việc:**

- [ ] Bổ sung browser test cho kiểm tra chủ đề: lưu/tiếp tục, bỏ trống, nộp và che đáp án trước nộp.
- [ ] Kiểm thử toàn bộ CMS: tạo → sửa nháp → xuất bản → phiên bản mới → ẩn; đối chiếu lịch sử học cũ.
- [ ] Kiểm thử quyền Editor độc lập, khóa tài khoản đang mở, nhiều tab và các lỗi mạng của IMP-03.
- [ ] Đưa typecheck, build, SQL lint, dựng database từ migration và kiểm thử cần thiết vào CI.
- [ ] Dùng môi trường/dữ liệu test riêng, secret CI được giới hạn quyền; log/ảnh/trace không chứa token hoặc mật khẩu.
- [ ] Ghi rõ các bước nghiệm thu thủ công còn lại, nhất là Google thật và các trình duyệt chưa được tự động hóa.

**Hoàn thành khi:** kiểm tra bắt buộc chạy được trên checkout sạch và phát hiện lỗi trước tích hợp; mỗi luồng quan trọng có bằng chứng kiểm thử hoặc mục nghiệm thu thủ công rõ ràng. Không dùng số lượng test thay thế độ phủ hành vi.

### IMP-08 — Theo dõi và tối ưu vận hành

**Công việc:**

- [ ] Truy vết yêu cầu giữa các service theo request ID và phân loại lỗi có thể xử lý; không ghi token/mật khẩu/đáp án riêng vào log.
- [ ] Đo thời gian tải trang, phản hồi API và truy vấn với lượng dữ liệu đại diện trước khi đặt mục tiêu tối ưu cụ thể.
- [ ] Kiểm tra khả dụng câu sai theo lô thay cho từng lời gọi Content riêng; giữ nguyên quy tắc generation và bảo toàn lịch sử.
- [ ] Tối ưu phân trang, index và số lượng kết nối khi có bằng chứng truy vấn chậm.
- [ ] Kiểm tra thứ tự focus, điều hướng bàn phím, tên truy cập, thông báo lỗi, độ tương phản và tràn bố cục.

**Hoàn thành khi:** có số đo trước/sau, tìm được nguyên nhân lỗi từ request ID, không suy giảm tính đúng của dữ liệu; luồng chính sử dụng được bằng bàn phím và trên màn hình nhỏ.

## 3. Thứ tự triển khai đề xuất

1. **IMP-01:** chuẩn hóa học liệu để có dữ liệu nghiệm thu xuyên suốt.
2. **IMP-03:** bảo vệ bài làm và xử lý lỗi; bổ sung các test tương ứng của IMP-07 ngay khi sửa.
3. **IMP-02 và IMP-04:** bật Google khi có credential, chuẩn bị bản online và kiểm thử lại callback trên domain thật.
4. **IMP-05 và IMP-06:** hoàn thiện trải nghiệm biên soạn và người học mới.
5. **IMP-07:** hoàn tất cổng kiểm thử trước phát hành; **IMP-08:** tối ưu theo kết quả đo.

Đây là thứ tự ưu tiên, không phải yêu cầu chờ hết hạng mục trước mới được kiểm thử hoặc sửa lỗi hạng mục khác.

## 4. Chưa ưu tiên mở rộng

Chưa thêm AI, bảng xếp hạng, thông báo, thanh toán hoặc các chức năng ngoài phạm vi đã chốt. Mỗi hạng mục hoàn thành cần cập nhật bằng chứng kiểm thử và [plan MVP](../web-mvp-plan.md); không đánh dấu hoàn thành chỉ vì tài liệu hoặc giao diện đã tồn tại.
