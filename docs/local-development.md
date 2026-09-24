# Vận hành Docker và database local

## Thành phần và phiên bản

- Node.js 22+, npm; dependency được khóa bằng `package-lock.json`.
- Supabase CLI **2.117.0**, Postgres.js **3.4.9**, PostgreSQL major **17** trong `supabase/config.toml`.
- Docker Desktop chạy Linux containers. Supabase CLI tạo các container `supabase_*_pbl6` và quản lý volume/lifecycle. [Hướng dẫn CLI chính thức](https://supabase.com/docs/guides/local-development/cli/getting-started).
- Bật database, API gateway, Auth, Storage, Studio, hộp thư local. Tắt Realtime, Analytics, Edge Runtime và S3 endpoint vì chưa dùng trong MVP hiện tại.
- Ba schema nghiệp vụ không được expose qua Data API. Frontend sau này gọi HTTP service; không dùng browser để truy cập trực tiếp các bảng này.

## Khởi tạo và sử dụng

Tại thư mục gốc dự án:

```sh
npm ci
npm run db:start
npm run db:provision
npm run db:bootstrap
npm run db:status
```

Lần đầu Docker tải image nên có thể mất vài phút. Studio ở `http://127.0.0.1:55323`, Auth/Storage ở `http://127.0.0.1:55321`, hộp thư thử ở `http://127.0.0.1:55324`, Postgres cổng 55322. Studio kết nối tài khoản quản trị local; quyền Studio không đại diện cho quyền runtime.

`db:provision` tạo mật khẩu runtime ngẫu nhiên lần đầu và dùng lại khi chạy lại. File `.local/runtime.json` chứa URL cho Identity, Content, Learning; chỉ service tương ứng nhận credential của mình. Migration tạo role NOLOGIN và không chứa mật khẩu. Provision local bật LOGIN sau đó. Không dùng credential postgres hoặc Supabase service key làm kết nối nghiệp vụ của ba service.

`db:bootstrap` chỉ chấp nhận project `pbl6` và endpoint 127.0.0.1:55321/55322 do CLI local trả về. Script không dùng một DATABASE_URL từ môi trường để âm thầm trỏ cloud. Tài khoản tạo qua Auth Admin API; bucket/object qua Storage API; profile, học liệu và thẻ tạo sau khi nhận UUID Auth thật. Chạy lại không đổi dữ liệu đã có.

| File local bị Git bỏ qua | Nội dung |
|---|---|
| `.local/bootstrap.json` | UUID/email/mật khẩu tài khoản thử |
| `.local/runtime.json` | Mật khẩu và database URL ba runtime role |
| `.local/*-before.json` | Fingerprint kiểm tra nâng cấp/bootstrap |
| `.env` hoặc `.env.*` | Cấu hình bí mật theo môi trường nếu dùng |

Không đưa các file này vào frontend, log hoặc source control. Lệnh `db:start`/`db:status` của dự án đã lọc output credential của CLI; gọi CLI status trực tiếp có thể hiển thị key local.

## Migration, seed và dựng sạch

Mười một file SQL hiện thực tám nhóm của thiết kế: 001–007 tạo schema/bảng; 008 thực thi ràng buộc/quyền/index; 009 bổ sung giao dịch Learning; 010 tinh chỉnh validation; migration ngày 20/09 sửa catalog version để API nhận đúng row_version sau cập nhật. Chỉ có một lịch sử tại `supabase/migrations`.

Backend local đã có ba tiến trình riêng tại cổng 4001–4003. Chạy `npm run build` rồi `npm run backend:start` sau provision/bootstrap; xem [hợp đồng API](backend-api.md). Supervisor tự lấy credential local và tạo token nội bộ trong `.local/backend.json`, không in secret ra console.

```sh
# Tạo migration mới, rồi viết SQL trong file timestamp vừa tạo
npm run db:new -- ten_thay_doi

# Chỉ áp dụng migration chưa chạy lên local, giữ dữ liệu hiện có
npm run db:migrate

# Kiểm tra SQL và nghiệp vụ database
npm run db:lint
npm run db:test
```

Không sửa file migration đã áp dụng/chia sẻ; thêm file mới. `supabase/seed.sql` chỉ chứa INSERT danh mục/mục từ không phụ thuộc Auth, không có DDL/mật khẩu. Các thao tác Auth/media nằm trong bootstrap. Không tạo cấu trúc bằng Studio mà bỏ qua migration.

**Dựng lại từ đầu xóa dữ liệu của local pbl6.** Chỉ thực hiện khi dữ liệu này có thể tái tạo:

```sh
npm run db:reset
npm run db:provision
npm run db:bootstrap
npm run db:lint
npm run db:test
```

Reset tạo lại Auth user với UUID mới; bootstrap cập nhật fixture tương ứng. Việc chạy bootstrap lần hai **không reset database** giữ nguyên UUID và dữ liệu. `db:test` dùng rollback cho phần lớn ca; các ca hai kết nối cần commit và để lại một ít dữ liệu thử UUID ngẫu nhiên trong local. Không chạy bộ test vào database public. Các script test cũng xác minh project/cổng local trước khi kết nối.

Để kiểm tra một migration chỉ thay cấu trúc/hàm không cần đổi dữ liệu:

```sh
node scripts/check-upgrade.mjs capture
npm run db:migrate
node scripts/check-upgrade.mjs verify
```

Fingerprint so sánh toàn bộ 33 bảng nghiệp vụ và tập UUID Auth. Migration có backfill hợp lệ cần kiểm thử biến đổi dữ liệu riêng, không dùng điều kiện mọi byte phải giống nhau. Có thể dùng tham số cuối `bootstrap` để so sánh trước/sau chạy lại bootstrap.

## Giao diện dữ liệu dành cho backend

Runtime Learning có các hàm transaction riêng, không expose cho browser:

| Hàm | Đầu vào chính | Hiệu lực |
|---|---|---|
| `learning.check_answer` | user, item, answer JSON, idempotency UUID, answer version, attempt version | Kiểm tra và khóa đáp án quiz/review; giải quyết câu sai đúng generation |
| `learning.submit_attempt` | user, attempt, idempotency UUID, attempt version | Nộp quiz/test, lưu điểm, hoàn thành bài và cập nhật câu sai cùng transaction |
| `learning.rate_flashcard` | user, session item, rating, idempotency UUID | Một lần đánh giá; lịch 1/3/7/14 ngày; bỏ qua thẻ đã reset/xóa |
| `identity.session_state` | session UUID, user UUID | Tra thời điểm tạo/hạn phiên qua hàm SECURITY DEFINER hẹp, không cấp SELECT auth.sessions |

HTTP backend còn phải xác minh token/phiên/quyền hiện tại, khả dụng nội dung qua Content API, owner và DTO. Các hàm database không thay thế middleware Auth. Các bảng có RLS theo runtime role; không giả định `auth.uid()` có người dùng cuối khi kết nối SQL trực tiếp. Mã lỗi version `40001`, vi phạm nghiệp vụ `23514`, quyền `42501` phải được HTTP layer ánh xạ theo thông điệp cụ thể, không trả toàn bộ lỗi SQL cho client.

`creation_xid` trên attempts/sessions là trường kỹ thuật chặn thêm snapshot item sau transaction tạo, không gửi qua DTO. CMS dùng advisory transaction lock chung cho Content để tránh race giữa sửa draft và xuất bản; phù hợp quy mô ít Editor của MVP, sẽ đo contention trước khi tách khóa theo course.

## Google OAuth local

Email/password và hộp thư local đã bật, yêu cầu xác minh email đối với đăng ký thông thường. Để bật Google:

1. Tạo OAuth web client trên Google Cloud; thêm callback **Google → Supabase**: `http://127.0.0.1:55321/auth/v1/callback`.
2. Cung cấp biến môi trường `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` và `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` cho tiến trình CLI; không ghi secret vào config.toml.
3. Đổi `auth.external.google.enabled` thành true rồi dừng/khởi động lại stack.
4. Giữ callback **Supabase → ứng dụng** trong allow-list: `http://localhost:5173/auth/callback` và `http://localhost:5174/auth/callback`. Web/Admin chưa được xây trong bước database này.
5. Sau khi có frontend, kiểm thử Google/email trùng danh tính, hủy callback, khóa tài khoản và thu hồi quyền theo SRS. Hiện chưa có bằng chứng các ca Google đạt.

## Dừng và xử lý lỗi

```sh
npm run db:stop
npm run db:start
```

Stop thông thường giữ dữ liệu. Không thêm `--no-backup` khi còn dữ liệu cần giữ. Khi Docker không kết nối, mở Docker Desktop và kiểm tra Linux containers. Khi trùng cổng 55320–55324, kiểm tra project/container đang dùng trước; không dừng hoặc xóa volume dự án khác. Khi đổi cổng/project ID, phải cập nhật guard local trong scripts có chủ đích.

Từ 24/09/2026, project dùng dải **55320–55324** thay cho 54320–54324: Windows đã dành riêng dải 54228–54327 khiến Docker không bind được cổng cũ dù container từng báo healthy. Kiểm tra bằng `netsh interface ipv4 show excludedportrange protocol=tcp`. Không cần dừng WinNAT hoặc thay mạng toàn máy.

Với checkout đang dùng cổng cũ: sao lưu DB/Storage trước, chạy `npm run db:stop`, `npm run db:start`, `npm run db:provision` (giữ mật khẩu runtime đã lưu), rồi `npm run mobile:configure`. Khởi động lại backend/web và đăng nhập lại vì địa chỉ Auth đã đổi. Không chạy `db:reset` hay import lại học liệu. `db:status` chỉ báo địa chỉ cấu hình; cần kiểm tra HTTP/Auth và `/health` của backend để xác nhận kết nối thực tế.

Stack local dùng cấu hình phát triển; không đưa các container này cùng credential demo lên Internet. Supabase Cloud sẽ dùng cùng SQL migrations, runtime password/OAuth/SMTP riêng, kiểm tra lịch sử và dry-run trước `db push`. Không chạy bootstrap/demo seed lên public. Chưa deploy Cloud/AWS trong bước này.


## Mở rộng ngày 20/09/2026

Đã thêm tìm kiếm học liệu, ghi chú cá nhân và Dictation. [Plan và hợp đồng endpoint](feature-expansion-plan.md), [kết quả kiểm chứng](feature-expansion-verification.md). Local nâng cấp bằng `npm run db:migrate`, `npm run db:dictation-demo`, `npm run build` rồi khởi động lại backend. Route web: `#/search`, `#/notes`, `#/dictation`, `#/dictation-attempt/:id`; CMS Dictation nằm trong màn hình sửa bài. Audio mẫu có lời đọc riêng, không dùng fixture im lặng của quiz.
