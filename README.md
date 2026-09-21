# PBL6 — English Learning MVP

Đã triển khai **Sprout — web học tiếng Anh** bằng React/TypeScript, có khu quản trị theo quyền, kết nối ba backend Identity/Content/Learning và Supabase local chạy trong Docker. Có đăng ký/email verification/password recovery, học liệu, quiz/kiểm tra, ôn tập, tiến độ và CMS. Google cần credential trước khi bật.

## Chạy local

Cần Node.js 22.12+, npm và Docker Desktop đang chạy Linux containers. Dependency được ghim trong package-lock; không cần cài CLI global.

```sh
npm ci
npm run db:start
npm run db:migrate
npm run db:provision
npm run db:bootstrap
npm run db:dictation-demo
npm run build
npm run backend:start
```

Giữ terminal backend mở, mở terminal khác:

```sh
npm run web:dev
```

Mở **http://localhost:5173**; khu quản trị tại **http://localhost:5173/#/admin** sau khi đăng nhập bằng Admin/Editor. Dùng hostname `localhost` để khớp CORS và callback Auth local. Frontend tự lấy URL và anon key public; không cần chép service key vào browser.

| Công cụ | Địa chỉ |
|---|---|
| Web người học và quản trị | http://localhost:5173 |
| Supabase Studio | http://127.0.0.1:54323 |
| Supabase API/Auth/Storage | http://127.0.0.1:54321 |
| Hộp thư local | http://127.0.0.1:54324 |
| PostgreSQL | 127.0.0.1:54322 |
| Identity API | http://127.0.0.1:4001/health |
| Content API | http://127.0.0.1:4002/health |
| Learning API | http://127.0.0.1:4003/health |

Giữ terminal backend mở; Ctrl+C dừng ba service. Sau khi sửa TypeScript, build và khởi động lại. Chạy `npm run typecheck`, `npm run db:lint`, `npm run db:test`, `npm run backend:test` ở terminal khác. Các test tích hợp ghi dữ liệu thử vào local; không trỏ chúng tới môi trường public.

`npm run db:status` hiển thị địa chỉ mà không in secret. `npm run db:stop` dừng stack và giữ dữ liệu để khởi động lại. Các container và volume thuộc project `pbl6`, do Supabase CLI quản lý; không cần thêm một Docker Compose/Postgres khác.

Bootstrap tạo ba tài khoản `admin@pbl6.local.test`, `editor@pbl6.local.test`, `learner@pbl6.local.test`; mật khẩu ngẫu nhiên nằm trong `.local/bootstrap.json`. Thông tin kết nối riêng cho ba runtime role nằm trong `.local/runtime.json`. Cả hai file đều bị loại khỏi Git. Tài khoản thử được xác minh qua Auth Admin API để dùng local, không thay thế kiểm thử luồng đăng ký/xác minh email.

Học liệu bootstrap gồm một bài và quiz 5 câu. Audio quiz cũ là fixture im lặng để kiểm tra Storage. Dictation có MP3 lời đọc riêng: chạy `npm run db:dictation-demo`; [nguồn audio](content/dictation/README.md). Google OAuth có cấu hình mẫu nhưng chưa bật vì cần Client ID/Secret.

## Tài liệu

- [Demo tiếng Anh cho 5 nhóm ngành kỹ thuật: danh mục, đánh giá nhu cầu và học liệu](content/demo/technical-demo.md) — gói Markdown/JSON, chưa nhập CMS.
- [Audit học liệu kỹ thuật và công cụ import bản nháp](content/demo/technical-audit.md) — đã kiểm chứng DB bằng transaction rollback, chưa import vĩnh viễn.

- [Hướng dẫn Docker, database, migration và Google local](docs/local-development.md)
- [Frontend: chạy, cấu trúc, cấu hình và kiểm thử](docs/frontend.md)
- [API backend và hướng dẫn tích hợp frontend](docs/backend-api.md)
- [Kết quả kiểm thử backend](docs/backend-verification.md)
- [Kết quả kiểm thử database](docs/database-verification.md)
- [Thiết kế database và ERD](docs/database-design.md)
- [Plan MVP web](web-mvp-plan.md)
- [Plan MVP mobile: Android, chức năng, tích hợp và nghiệm thu](mobile-mvp-plan.md)
- [Mobile: chạy development build và chuẩn bị APK](docs/mobile-development.md)
- [Mobile: kết quả kiểm thử và phần chưa nghiệm thu](docs/mobile-verification.md)
- [Đề xuất cải thiện MVP và tiêu chí hoàn thành](docs/mvp-improvements.md)
- [SRS](srs.md)

Chỉ dùng stack và tài khoản bootstrap này để phát triển local. Deploy public dùng Supabase Cloud với cùng migration và cấu hình/secret riêng.

## App Android

Mã nguồn React Native/Expo nằm trong `apps/mobile`, có bốn tab Hôm nay/Khám phá/Ôn tập/Cá nhân và các luồng học dùng chung API với web. Đã kiểm thử client, màn hình bằng React Native renderer và API local; chưa nghiệm thu APK hoặc điện thoại thật.

Khi Supabase/backend local đang chạy, dùng `npm run mobile:configure` để tạo cấu hình public. Có Android SDK và thiết bị/emulator thì chạy `npm run mobile:configure -- --reverse`, sau đó `npm run mobile:android`. Các lần sau dùng `npm run mobile:dev -- --reverse`. Xem [hướng dẫn đầy đủ](docs/mobile-development.md), đặc biệt phần Java/SDK và Auth callback.

Kiểm thử: `npm run mobile:typecheck`, `npm run mobile:test`, `npm run mobile:test:ui`, `npm run mobile:test:api` (cần build/backend local). `npm run mobile:export` tạo bundle Hermes, không tạo APK. Web/mobile dùng React 19.2.3 tương thích Expo; package-lock quản lý chung npm workspaces.

## Ba tính năng bổ sung

Tìm kiếm học liệu tại `#/search`, ghi chú riêng tại `#/notes`, luyện nghe chép chính tả tại `#/dictation`. CMS bài học có mục biên soạn/xuất bản Dictation. Tất cả dùng API thật; transcript chỉ hiện sau nộp.

- [Plan, quy tắc và API](docs/feature-expansion-plan.md)
- [Bằng chứng kiểm thử](docs/feature-expansion-verification.md)

Sau nâng cấp chạy `npm run db:migrate`, build và khởi động lại backend. Kiểm thử thêm: `npm run features:test`, `npm run web:test`, `npm run db:test:clean` (database tạm, không reset dữ liệu đang dùng).
