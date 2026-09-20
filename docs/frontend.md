# Sprout — frontend MVP

Cập nhật 20/09/2026. React 19.3, TypeScript, Vite 8.3, Supabase JS và Lucide. UI tiếng Việt, màu kem/xanh lá; responsive desktop và điện thoại. Một ứng dụng tại `apps/web` có hai khu vực người học và quản trị theo quyền, cùng phiên đăng nhập. Chưa tách thành hai deployment độc lập.

## Chạy ngay

Sau khi Supabase và backend đã chạy theo README:

```sh
npm run web:dev
```

Mở **http://localhost:5173**. Khu quản trị: **http://localhost:5173/#/admin**. Dùng tài khoản bootstrap trong `.local/bootstrap.json`, hoặc đăng ký qua giao diện và mở email xác minh tại http://127.0.0.1:54324. Không công khai file tài khoản thử.

`web:dev` chỉ truyền URL và anon key public vào Vite; không truyền credential runtime hoặc service key vào biến `VITE_*`. Google hiện chưa bật: nút Google báo chưa khả dụng, không điều hướng người dùng sang trang lỗi của Auth.

## Các màn hình

| Khu vực | Luồng đã nối API |
|---|---|
| Tài khoản | Email/password, đăng ký, gửi lại xác minh, callback PKCE, quên/đổi mật khẩu, hồ sơ, đăng xuất |
| Học hôm nay | Thẻ đến hạn, thẻ mới, câu sai và bài tiếp theo của lộ trình |
| Lộ trình | Tìm theo tên, chọn lộ trình, danh sách bài, học thử, kiểm tra chủ đề |
| Bài học | Văn bản/ngữ pháp/đọc/audio/transcript/từ vựng; lưu bài, lưu từ, mở quiz |
| Lượt làm | Chọn đáp án/điền từ, kiểm tra quiz hoặc lưu câu kiểm tra, nộp, kết quả và giải thích, hủy lượt |
| Ôn tập | Thẻ cá nhân CRUD, lọc mới/đến hạn, lật thẻ, Nhớ/Chưa nhớ, ôn câu sai |
| Theo dõi | Tiến độ, catalog thay đổi, lịch sử đã nộp/đang làm, bài yêu thích và tìm kiếm |
| CMS | Cấu trúc lộ trình/chủ đề/bài; biên soạn block; từ vựng/audio; câu hỏi và đáp án; đề quiz/kiểm tra; nháp, xem trước, xuất bản, ẩn |
| Quản trị | Tìm tài khoản, trạng thái, cấp/thu hồi Editor và quyền; báo cáo ngày, điểm trung bình, người học hoạt động |

Form quản trị sử dụng ô nhập, lựa chọn bài/tệp/từ vựng và checkbox câu hỏi. Không yêu cầu nhập JSON hoặc UUID. Bản đã xuất bản chỉ tạo phiên bản mới, không sửa trực tiếp. Nút bị ẩn theo quyền chỉ là UX; backend vẫn xác thực và phân quyền từng thao tác.

Frontend không tính đáp án đúng. Chỉ hiển thị key/explanation khi backend cho phép. Dữ liệu được render dạng text của React, không chèn HTML từ nội dung. Cập nhật gửi expectedVersion; lỗi xung đột yêu cầu tải lại. Thao tác idempotent giữ key khi retry mạng trong phiên trang hiện tại. Không có hàng đợi offline; đáp án chưa bấm Lưu/Kiểm tra chưa được đồng bộ.

## Cấu trúc mã

- `src/main.tsx`: shell, hash routes, phiên và bảo vệ trang.
- `src/auth.tsx`: form tài khoản và callback qua Supabase SDK.
- `src/learning.tsx`: các màn hình học và ôn tập.
- `src/admin.tsx`: CMS/tài khoản/báo cáo, lazy-loaded khi mở Admin.
- `src/api.ts`: HTTP client, lỗi thân thiện và Idempotency-Key.
- `src/ui.tsx`: trạng thái loading/error/retry, form action và phân trang.
- `src/style.css`: design system, bố cục và responsive.
- `scripts/frontend-local.mjs`: launcher cấu hình public từ Supabase local.

Hai API đọc CMS được bổ sung cho danh sách từ vựng/media, cùng API đọc một phiên bản đề. Identity có `POST /v1/logout-all` để backend từ chối mọi phiên cũ sau đổi mật khẩu. Auth local được đồng bộ SRS: tối thiểu 8 ký tự, có chữ và số; UI giới hạn 72 ký tự.

## Build và cấu hình public

```sh
npm run web:typecheck
npm run web:build:local
npm run web:test
npm run web:format
```

Build nằm tại `dist/web`, chứa HTML/CSS/JS tĩnh. `web:build:local` nhúng địa chỉ local, chỉ dành cho local. Khi build cho môi trường khác, sao chép `apps/web/.env.example` thành `apps/web/.env.production.local`, điền URL public và anon/publishable key đúng project rồi chạy `npm run web:build`. Không dùng service-role key. Backend cần CORS origin và HTTPS tương ứng.

Các route UI dùng hash. Host vẫn phải phục vụ `index.html` ở `/auth/callback` (SPA fallback) cho PKCE. Callback phải nằm trong allowlist Supabase. Google cần bật provider, cấu hình Client ID/Secret bên Auth và `VITE_GOOGLE_ENABLED=true` khi build. Launcher local đọc cờ provider trong `supabase/config.toml`; khởi động lại frontend sau thay đổi. Không có Google Client Secret trong frontend. [Supabase OAuth SDK](https://supabase.com/docs/reference/javascript/auth-signinwithoauth), [Vite build/configuration](https://vite.dev/guide/).

## Bằng chứng kiểm thử

Đã chạy ngày 20/09/2026 trên Windows, Node 22.18, Edge headless, backend và Supabase thật:

| Kiểm tra | Kết quả |
|---|---|
| TypeScript frontend + production bundle local | Đạt |
| Playwright browser | **7/7 đạt** |
| Backend HTTP sau bổ sung API | **12/12 đạt** |
| Database sau restart Auth | **22/22 đạt** |
| Rà bundle với secret local thực tế | Không có service key, credential runtime hoặc mật khẩu thử |

Browser tests: guest/preview/audio/mobile menu; đăng nhập và quiz 100% giữ kết quả sau reload; tạo/lật/đánh giá thẻ; learner bị chặn Admin và logout; Admin tạo lộ trình/mở editor/media/report; sai mật khẩu/mất kết nối/retry; đăng ký mật khẩu 8 ký tự, email xác minh và email reset qua Mailpit với callback thật. Xem `tests/web/frontend.spec.ts`.

Ảnh desktop, mobile 390px và Admin đã được xem để kiểm tra bố cục, nằm trong `.local/web-desktop.png`, `.local/web-mobile.png`, `.local/web-admin.png`. Playwright dùng Edge có sẵn; máy khác cần cài Edge hoặc đổi channel trong config. Test tạo dữ liệu thử local và giữ lịch sử, không chạy trên public.

## Chưa nghiệm thu

Google thật chưa kiểm thử vì chưa có credential. Chưa deploy Cloud/AWS hoặc chạy cross-browser Safari/Firefox, kiểm thử tải, audit accessibility đầy đủ. Bộ Playwright chưa phủ toàn bộ form CMS, topic test trên UI, mọi trường hợp cạnh tranh nhiều tab hoặc liên kết Google/email. Backend có kiểm thử topic test và cạnh tranh database riêng.

Chưa có xóa nháp và mời Editor qua email (backend chưa hỗ trợ). Danh sách quản trị lớn cần tiếp tục bổ sung phân trang/tìm kiếm; lựa chọn media hiện đọc 100 tệp gần nhất. Nội dung local gồm fixture và dữ liệu test, audio bootstrap im lặng; chưa phải bộ học liệu nghiệm thu. Đây là frontend hoạt động trên local, chưa đánh dấu toàn bộ MVP sẵn sàng phát hành.


## Mở rộng ngày 20/09/2026

Đã thêm tìm kiếm học liệu, ghi chú cá nhân và Dictation. [Plan và hợp đồng endpoint](feature-expansion-plan.md), [kết quả kiểm chứng](feature-expansion-verification.md). Local nâng cấp bằng `npm run db:migrate`, `npm run db:dictation-demo`, `npm run build` rồi khởi động lại backend. Route web: `#/search`, `#/notes`, `#/dictation`, `#/dictation-attempt/:id`; CMS Dictation nằm trong màn hình sửa bài. Audio mẫu có lời đọc riêng, không dùng fixture im lặng của quiz.
