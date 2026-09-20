# Backend MVP: chạy local và tích hợp

## Khởi động

Node.js 22+, Docker Desktop Linux containers. Từ thư mục gốc:

```sh
npm ci
npm run db:start
npm run db:migrate
npm run db:provision
npm run db:bootstrap
npm run build
npm run backend:start
```

| Service | Base URL | Schema |
|---|---|---|
| Identity | http://127.0.0.1:4001 | identity |
| Content | http://127.0.0.1:4002 | content |
| Learning | http://127.0.0.1:4003 | learning |

Mỗi service có `GET /health` kiểm tra kết nối database. Supervisor chạy ba tiến trình Node riêng, giữ terminal mở; Ctrl+C dừng chúng. Supabase tiếp tục chạy trong Docker. Build và restart sau khi sửa mã nguồn. Các lệnh test tích hợp ghi dữ liệu thử local; chạy lần lượt `npm run db:test` rồi `npm run backend:test`.

## Xác thực và hợp đồng chung

Frontend đăng ký/đăng nhập/email verification/password reset/Google bằng Supabase Auth; gửi `Authorization: Bearer <access_token>` khi gọi service. Không có bảng mật khẩu ứng dụng. Identity xác minh token với Auth trước khi dùng claims, kiểm tra phiên Auth, trạng thái profile, mốc thu hồi và quyền hiện tại. JWT còn hạn không bảo đảm phiên vẫn được chấp nhận.

Google provider chưa bật: cần cấu hình credential và callback như [hướng dẫn local](local-development.md). Không tự ghép tài khoản theo email. Tài khoản bootstrap dùng email/password; mật khẩu trong `.local/bootstrap.json`.

Body JSON dùng `Content-Type: application/json`, từ chối trường lạ. ID là UUID; `expectedVersion` là số nguyên lấy từ `row_version` gần nhất. Một số cột bigint trả dạng chuỗi: frontend chuyển `Number(row_version)` trước khi gửi. Câu trả lời chưa lưu có version 0. Xung đột trả 409, phải đọc lại dữ liệu trước khi quyết định gửi sửa tiếp.

Thao tác có idempotency dùng header `Idempotency-Key` UUID mới cho mỗi ý định, giữ cùng key khi retry sau timeout. Tạo lượt, kiểm tra câu, nộp bài, tạo thẻ, tạo phiên thẻ và đánh giá thẻ hỗ trợ chống gửi trùng. Payload nghiệp vụ khác với key cũ bị từ chối; `confirmBlank` chỉ là xác nhận UI, không thuộc fingerprint nộp bài hiện tại.

Lỗi có dạng `{"error":{"code":"VERSION_CONFLICT","requestId":"..."}}`. Validation có thêm `issues`. 400 dữ liệu không hợp lệ; 401 phiên không hợp lệ; 403 thiếu quyền/profile/khóa; 404 không tìm thấy hoặc không thuộc người dùng; 409 xung đột/trạng thái; 503 dependency không khả dụng. Các API được bảo vệ yêu cầu display name, ngoại trừ cập nhật hồ sơ. CORS mặc định cho `http://localhost:5173` và `http://localhost:5174`.

## Identity

| Method / route | Ý nghĩa / body |
|---|---|
| GET `/v1/me` | Profile, role, permission, phiên hiện tại |
| PATCH `/v1/me` | `{display_name, expectedVersion}` |
| POST `/v1/logout` | Thu hồi phiên hiện tại ở backend và Auth |
| POST `/v1/logout-all` | Thu hồi mọi phiên của chính tài khoản, dùng sau đổi mật khẩu |
| GET `/v1/admin/users?q=&page=1` | 20 tài khoản/trang; Editor chỉ quản lý learner |
| PATCH `/v1/admin/users/:id` | `{status, reason?, expectedVersion}`; khóa/vô hiệu hóa cần lý do |
| PUT `/v1/admin/users/:id/editor` | Admin: `{enabled, permissions, expectedVersion}` |
| GET `/v1/admin/summary` | Số tài khoản theo role/trạng thái, cần reports.view |

Quyền Editor: `content.write`, `content.publish`, `learners.manage`, `reports.view`. Admin có toàn quyền ứng dụng. Không cho tự đổi role qua profile, không cho sửa role admin qua API Editor.

## Content

`GET /v1/catalog` public, chỉ trả cây đang xuất bản. `GET /v1/lessons/:id` cho guest nếu preview; bài khác cần phiên hợp lệ. Audio dùng signed URL ngắn hạn trong bucket private.

Các route dưới `/v1/admin` yêu cầu Editor/Admin. Đọc CMS cần content.write hoặc content.publish; biên soạn cần content.write; publish/status cần content.publish.

| Method / route | Chức năng |
|---|---|
| GET `/v1/admin/catalog` | Danh mục quản trị, có bản nháp/ẩn |
| POST `/v1/admin/courses`, `/topics`, `/lessons`, `/vocabulary` | Tạo nội dung gốc |
| PATCH `/v1/admin/:entity/:id/metadata` | Sửa metadata và thứ tự với expectedVersion |
| POST `/v1/admin/lessons/:id/revisions` | `{title, objectives, blocks}`; ID từ vựng/media nằm trong block tương ứng |
| GET `/v1/admin/lessons/:id/revisions` | Tối đa 20 phiên bản gần nhất |
| PATCH `/v1/admin/lesson-revisions/:id` | Thay nội dung bản nháp, expectedVersion |
| POST `/v1/admin/questions` | Tạo câu hỏi và bản nháp đầu tiên |
| POST `/v1/admin/questions/:id/revisions` | Phiên bản mới cho cùng question_id |
| GET `/v1/admin/questions` | Danh sách câu hỏi quản trị |
| GET, PATCH `/v1/admin/question-revisions/:id` | Xem hoặc sửa nháp gồm lựa chọn/đáp án |
| GET, POST `/v1/admin/assessments` | Danh sách / tạo đề hoặc phiên bản đề mới |
| PATCH `/v1/admin/assessment-revisions/:id` | `{title, question_revision_ids, expectedVersion}` |
| POST `/v1/admin/lessons/:id/publish` | `{lessonRevisionId, assessmentRevisionId, expectedVersion}`; bài và quiz cùng transaction |
| POST `/v1/admin/assessments/:id/publish` | `{revisionId, expectedVersion}` |
| PATCH `/v1/admin/:entity/:id/status` | `{status, expectedVersion}`; áp dụng đúng enum từng loại |
| POST `/v1/admin/media` | Body là bytes audio MP3/M4A với Content-Type audio/mpeg hoặc audio/mp4; object key mới, không ghi đè |
| GET `/v1/admin/media`, `/v1/admin/vocabulary` | Danh sách nguồn để chọn trong form CMS |
| GET `/v1/admin/assessment-revisions/:id` | Phiên bản đề và danh sách question_revision_ids theo thứ tự |

Question có `type=single_choice|fill_blank`, prompt, passage, audio_asset_id, options `[{option_key,text}]`, correct_option_key hoặc accepted_answers, explanation, transcript. Trường không áp dụng gửi null hoặc bỏ theo schema route. Khi xuất bản, database kiểm tra số lựa chọn, đáp án, số câu, nguồn chủ đề và pointer; bản đã xuất bản bất biến. Body đầy đủ và ví dụ CMS thực thi trong [tests/backend.test.mjs](../tests/backend.test.mjs); schema Zod là nguồn validation tại `services/content/src`.

## Learning

Mọi route cần phiên và profile; user_id luôn lấy từ Identity, không nhận từ client.

| Method / route | Body / kết quả |
|---|---|
| PUT `/v1/enrollment` | `{course_id}` chọn một lộ trình |
| POST `/v1/lessons/:id/open` | Ghi lần mở và ngày học |
| GET `/v1/favorites?q=&page=1` | Tìm kiếm trước phân trang 20 |
| PUT, DELETE `/v1/favorites/:id` | Lưu/bỏ lưu bài |
| POST `/v1/attempts` | `{assessment_id}` + Idempotency-Key; trả attempt_id |
| GET `/v1/attempts?page=1` | Lịch sử 20/trang |
| GET `/v1/attempts/:id` | Lượt làm với DTO che đáp án |
| POST `/v1/items/:id/check` | Quiz/ôn sai: `{answer, expectedVersion, attemptVersion}` + key |
| PUT `/v1/items/:id/answer` | Kiểm tra chủ đề: `{answer, expectedVersion, attemptVersion}` |
| POST `/v1/attempts/:id/submit` | `{expectedVersion, confirmBlank}` + key |
| POST `/v1/attempts/:id/cancel` | `{expectedVersion}` |
| GET `/v1/mistakes?topic_id=&page=1` | Câu sai còn khả dụng |
| POST `/v1/mistake-reviews` | `{topic_id?}` + key; tối đa 10 câu |
| POST `/v1/flashcards` | `{source_vocabulary_id, lesson_id}` hoặc `{word, meaning, example}` + key |
| GET `/v1/flashcards?filter=all&topic_id=&page=1` | filter all/new/due, 20/trang |
| PATCH `/v1/flashcards/:id` | `{word, meaning, example, expectedVersion}` |
| DELETE `/v1/flashcards/:id` | `{expectedVersion}`; xóa mềm |
| GET `/v1/flashcards/:id/audio` | URL audio nguồn nếu có |
| POST `/v1/flashcard-sessions` | `{}` + key; tối đa 20 thẻ, ưu tiên thẻ đến hạn |
| GET `/v1/flashcard-sessions/:id` | Phiên, snapshot thẻ, trạng thái item |
| POST `/v1/flashcard-items/:id/rate` | `{rating:"remember"}` hoặc `again` + key |
| POST `/v1/flashcard-sessions/:id/cancel` | `{expectedVersion}` |
| GET `/v1/progress`, `/v1/today` | Tiến độ và nội dung cần học/ôn |
| POST `/v1/catalog-seen` | `{course_id, catalog_version}` xác nhận phiên bản danh mục hiện tại |
| GET `/v1/admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD` | reports.view; tối đa 366 ngày, Asia/Ho_Chi_Minh |

Answer là `{"option_key":"A"}` hoặc `{"text":"hello"}`. Sau mỗi lần check/save, dùng version mới trả về. Quiz/ôn sai chỉ lộ đáp án câu đã check; kiểm tra chủ đề chỉ lộ sau nộp. Tiếp tục lượt có nội dung bị ẩn sẽ bị hủy, lịch sử snapshot vẫn giữ. Điểm dùng tỷ lệ gốc; UI không dùng số đã làm tròn để xét đạt.

## Ranh giới và cấu hình triển khai

Frontend không gọi `/internal/*`. Identity cung cấp verify và danh sách learner cho báo cáo; Content cung cấp snapshot riêng có key cho Learning. Route nội bộ kiểm tra `X-Service-Token` constant-time. Mỗi service chỉ kết nối schema mình sở hữu; không dùng kết nối postgres để chạy API.

Local supervisor tự cấu hình. Khi triển khai độc lập cần `DATABASE_URL` đúng runtime role, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IDENTITY_URL`, `CONTENT_URL`, `IDENTITY_INTERNAL_TOKEN`, `CORS_ORIGINS`; Content/Learning cần `CONTENT_INTERNAL_TOKEN`; Identity/Content cần `SUPABASE_SERVICE_ROLE_KEY`. Không đưa các secret này vào biến frontend `VITE_*`.

Node entrypoint: `dist/services/<service>/src/index.js`, HOST mặc định loopback, PORT mặc định 4001/4002/4003. Lambda handler: `dist/services/<service>/src/lambda.handler`. Các adapter Lambda mới được biên dịch, chưa deploy/kiểm thử AWS. Cloud phải cấu hình mạng nội bộ/TLS và secret riêng trước khi public.


## Mở rộng ngày 20/09/2026

Đã thêm tìm kiếm học liệu, ghi chú cá nhân và Dictation. [Plan và hợp đồng endpoint](feature-expansion-plan.md), [kết quả kiểm chứng](feature-expansion-verification.md). Local nâng cấp bằng `npm run db:migrate`, `npm run db:dictation-demo`, `npm run build` rồi khởi động lại backend. Route web: `#/search`, `#/notes`, `#/dictation`, `#/dictation-attempt/:id`; CMS Dictation nằm trong màn hình sửa bài. Audio mẫu có lời đọc riêng, không dùng fixture im lặng của quiz.
