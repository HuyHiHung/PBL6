# Tìm kiếm, ghi chú cá nhân và Dictation

Ngày cập nhật: 20/09/2026. Phạm vi đã được chốt và triển khai trên web React, Content/Learning API và Supabase local. Identity tiếp tục quản lý phiên và quyền. Không lập lịch theo tuần; không thêm AI, nhận dạng giọng nói, offline hoặc chia sẻ ghi chú.

## 1. Hành vi sản phẩm

### Tìm kiếm — FR-12

- Ô tìm kiếm ở đầu trang dẫn đến `#/search`; từ khóa, loại, lộ trình và trang nằm trong URL. Debounce 300 ms, hủy request cũ, 20 kết quả/trang.
- Tìm tên lộ trình/chủ đề/bài và từ/ nghĩa tiếng Việt trong snapshot từ vựng của phiên bản bài đang xuất bản. Không tìm thân bài, ghi chú, đáp án hoặc transcript.
- Từ khóa sau trim dài 2–100 ký tự. So khớp chuỗi con, không phân biệt hoa/thường/dấu; escape `%`, `_`, `\`. Xếp exact → prefix → contains, rồi tên chuẩn hóa, ID và loại để ổn định.
- Toàn bộ cha phải còn xuất bản. Khách tìm được metadata; từ vựng của khách chỉ từ bài preview. Một từ thuộc hai bài được trả thành hai kết quả gắn bài nguồn.
- Kết quả lộ trình/chủ đề mở danh mục đã lọc; bài/từ vựng mở bài tương ứng. Có trạng thái trống/lỗi, bộ lọc và phân trang.

### Ghi chú — FR-13

- Một ghi chú riêng/người/bài, văn bản thuần tối đa 5.000 ký tự. Không tạo hàng khi chỉ mở bài; không nhận nội dung trắng.
- Vùng ghi chú ở cuối bài và trang `#/notes`. Lưu bằng nút; hiển thị trạng thái, cảnh báo rời trang khi chưa lưu; xóa có xác nhận.
- Tổng hợp 20 mục/trang, mới nhất trước, tên bài/trích đoạn/thời gian cập nhật. React hiển thị text, không render HTML nhập vào.
- Ghi chú gắn `lesson_id`, giữ qua các phiên bản. Hiển thị cảnh báo khác phiên bản lúc lưu. Bài bị ẩn vẫn đọc/sửa/xóa ghi chú đã có; không mở bài hoặc tạo ghi chú mới.
- `expectedVersion=0` tạo mới; cập nhật/xóa sai version trả 409. Version dùng sequence tăng toàn cục, tránh một tab cũ ghi đè sau khi ghi chú đã bị xóa và tạo lại.

### Dictation — FR-11

- Editor soạn bài luyện riêng trong CMS của bài học: tiêu đề, hướng dẫn, audio MP3/M4A và transcript 1–200 từ. Giới hạn media hiện hành 10 MiB; object key bất biến.
- Một bài có nhiều Dictation. `content.write` soạn; `content.publish` xuất bản/ẩn. Một bản nháp/root; bản xuất bản bất biến; muốn sửa phải tạo phiên bản mới.
- Người đăng nhập mở từ bài học hoặc `#/dictation`, lọc lộ trình/chủ đề, 20 mục/trang. Nghe lại không giới hạn ở 0,75× / 1× / 1,25×.
- Một lượt đang làm/người/Dictation. Bắt đầu khi đã có lượt mở trả lượt đó. Có lưu bản chép, nộp cuối cùng, hủy và lịch sử riêng. Bản chép tối đa 10.000 ký tự, bài nộp có 1–1.000 từ.
- Transcript chỉ trả sau nộp; kết quả gồm transcript chuẩn, bản chép, đúng/sai/thiếu/thừa và điểm luyện tập. Không ngưỡng đỗ; không cập nhật điểm quiz, tiến độ hay câu sai.
- Nội dung hoặc cha bị ẩn: yêu cầu tiếp tục kế tiếp hủy lượt đang làm với lý do `content_unavailable`; lịch sử đã nộp giữ nguyên. Lỗi mạng không được xem như nội dung bị ẩn.

## 2. Chấm phiên bản 1

NFC → lowercase → đổi hai dấu nháy cong thành `'`; lấy chuỗi chữ/số với dấu nháy nằm trong từ. Dấu câu/khoảng trắng phân tách từ. Không quy đổi `don't` thành `do not`, hoặc `two` thành `2`.

Căn chỉnh Levenshtein theo từ, sai/thiếu/thừa đều có chi phí 1. Khi truy ngược có hòa: diagonal (khớp/thay thế) → thiếu → thừa. Điểm `max(0,100*(1-(sai+thiếu+thừa)/số_từ_chuẩn))`, làm tròn một chữ số thập phân. Lưu alignment, số lỗi, điểm và policy version trong kết quả bất biến; không tính lại lịch sử khi đổi thuật toán.

## 3. Database và giao dịch

38 bảng nghiệp vụ: Identity 4, Content 18, Learning 16. Chi tiết tại [thiết kế database](database-design.md). Không FK hoặc SQL chéo service; Learning lấy nội dung qua API nội bộ xác thực.

| Migration bổ sung | Trách nhiệm |
|---|---|
| `20260920000200_feature_expansion` | unaccent/search; 2 bảng Content, 3 bảng Learning; pointer/FK/partial unique; snapshot completeness, immutable guards, RLS và grants |
| `20260920000300_note_versions` | sequence version ghi chú chống stale sau xóa/tạo lại |
| `20260920000400_search_permissions` | quyền gọi unaccent cho Content runtime |
| `20260920000500_dictation_apostrophes` | đồng nhất hai dấu nháy cong khi kiểm tra transcript ở database |

Không sửa migration cũ. Local/Cloud dùng cùng 15 migration; không backfill dữ liệu học. Mỗi bảng mới có grants/RLS/trigger riêng, không phụ thuộc vòng lặp migration cũ.

Bắt đầu/nộp dùng `Idempotency-Key` và `request_dedup`: key trùng payload khác trả 409. Bắt đầu khóa theo người dùng, tạo public/private snapshot trong cùng transaction. Nộp khóa lượt, kiểm tra owner/status/version, ghi bản chép cuối và kết quả trong cùng transaction. Snapshot keys chỉ chèn trong transaction tạo lượt; phiên đã hoàn tất không sửa/xóa.

## 4. Hợp đồng API

| Service | Endpoint | Dữ liệu chính |
|---|---|---|
| Content | `GET /v1/search?q=&type=&course_id=&page=` | `items,total,page`; type all/course/topic/lesson/vocabulary |
| Content | `GET /v1/dictations?course_id=&topic_id=&lesson_id=&page=`; `GET /v1/dictations/:id` | người đăng nhập, metadata/audio; không transcript |
| Content | `GET /v1/admin/dictations?lesson_id=` | danh sách các root và phiên bản, có transcript cho CMS |
| Content | `POST /v1/admin/dictations`; `POST /v1/admin/dictations/:id/revisions` | title/instructions/audio_asset_id/transcript; tạo root thêm lesson_id/position |
| Content | `PATCH /v1/admin/dictation-revisions/:id` | trường biên soạn + expectedVersion của revision |
| Content | `POST /v1/admin/dictations/:id/publish` | revisionId + expectedVersion của root |
| Content | `PATCH /v1/admin/dictations/:id/status` | published/hidden + expectedVersion của root |
| Content | `GET /internal/dictations/:id` | snapshot và transcript; chỉ API nội bộ |
| Learning | `GET /v1/notes?page=`; `GET /v1/lessons/:id/note` | ghi chú của principal, available/revision_changed |
| Learning | `PUT /v1/lessons/:id/note`; `DELETE /v1/lessons/:id/note` | content + expectedVersion; DELETE chỉ version |
| Learning | `POST /v1/dictation-attempts` | dictation_id + Idempotency-Key; trả attempt_id |
| Learning | `GET /v1/dictation-attempts?page=`; `GET /v1/dictation-attempts/:id` | lịch sử/chi tiết của owner; transcript chỉ sau nộp |
| Learning | `PUT /v1/dictation-attempts/:id/answer` | answer + expectedVersion |
| Learning | `POST /v1/dictation-attempts/:id/submit` | answer + expectedVersion + Idempotency-Key |
| Learning | `POST /v1/dictation-attempts/:id/cancel` | expectedVersion |

400: dữ liệu sai; 401/403: phiên/quyền; 404: không tìm thấy/khác owner/nội dung không khả dụng; 409: stale version, trạng thái hoặc payload khác cùng key. Các API danh sách ngoài search trả `items,page`; trang có 20 phần tử cho phép thử trang tiếp theo (có thể rỗng).

## 5. Chạy và kiểm chứng

Sau `npm ci`, Docker/Supabase đang chạy:

```sh
npm run db:migrate
npm run db:provision
npm run db:bootstrap
npm run db:dictation-demo
npm run build
npm run backend:start
```

Terminal khác: `npm run web:dev`. Mở `http://localhost:5173`. Tài khoản local xem `.local/bootstrap.json`, không commit secrets. Script Dictation chỉ chạy local, upload MP3 riêng và có thể chạy lại; không tự đưa tài khoản/lịch sử giả lên Cloud.

```sh
npm run db:test
npm run backend:test
npm run features:test
npm run web:test
npm run db:lint
npm run db:test:clean
npm run web:build:local
```

Các bộ test ghi dữ liệu thử vào local; chạy tuần tự vì có ca tạm ẩn nội dung fixture. `db:test:clean` tạo database tạm, sao chép **schema Auth không dữ liệu**, chạy mọi migration + seed, rồi xóa đúng database tạm; không reset database đang dùng. Đây không phải kiểm thử triển khai Supabase Cloud hoặc reset toàn bộ container.

Audio mẫu: [nguồn và quyền sử dụng](../content/dictation/README.md), MP3 có lời đọc gốc bằng giọng tổng hợp. Không dùng fixture im lặng của quiz làm audio Dictation. Chưa thay thế việc giảng viên duyệt học liệu.

Xem [bằng chứng kiểm thử](feature-expansion-verification.md) cho kết quả thực tế, giới hạn và cách chạy lại.
