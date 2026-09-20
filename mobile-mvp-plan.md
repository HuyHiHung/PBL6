# Kế hoạch triển khai Sprout Mobile

Ngày lập: 20/09/2026. Trạng thái: **đề xuất triển khai**, chưa tạo ứng dụng hoặc nghiệm thu mobile. Kế hoạch tổ chức theo đầu ra và phụ thuộc, không chia theo tuần, phù hợp định hướng trong SRS.

Phương án mặc định theo SRS: bàn giao **app Android cài được**, dùng chung tài khoản, nội dung và dữ liệu học với web. iOS là hướng mở rộng; chưa cam kết kiểm thử hoặc phát hành iOS. Framework và cách phát hành dưới đây là đề xuất kỹ thuật, không phải quyết định đã được người dùng xác nhận.

## 1. Căn cứ và hiện trạng

- [SRS 0.5](srs.md) yêu cầu mobile có các chức năng người học MVP; quản trị nội dung/tài khoản tiếp tục qua Web Admin.
- Web hiện dùng React/TypeScript/Vite tại `apps/web`; repository chưa có `apps/mobile` hay cấu hình build native.
- Identity, Content và Learning đã có API cho tài khoản, học bài, quiz, kiểm tra, ôn tập và tiến độ. [Hợp đồng API](docs/backend-api.md) và mã route là căn cứ tích hợp.
- [Tìm kiếm, ghi chú và Dictation](docs/feature-expansion-plan.md) đã có trên web/backend, đưa vào phạm vi mobile đề xuất để duy trì chức năng người học.
- Backend đang hỗ trợ Supabase local. Tài liệu hiện tại chưa chứng minh triển khai public AWS/Supabase Cloud; Google chưa bật vì thiếu credential. Đây là các phụ thuộc phát hành, không coi là đã hoàn thành.
- `apps/web/src/api.ts` còn phụ thuộc Vite, browser và hash navigation; `packages/backend/src/contracts.ts` có snapshot chứa đáp án nội bộ. Không dùng nguyên hai module này làm SDK mobile.

## 2. Phạm vi sản phẩm

| Nhóm | Đầu ra mobile | Mức ưu tiên |
|---|---|---|
| Khách và tài khoản | Xem danh mục/học thử; đăng ký, xác minh email, đăng nhập, quên/đổi mật khẩu, hồ sơ, đăng xuất | Bắt buộc |
| Học hôm nay và lộ trình | Chọn lộ trình, bài tiếp theo, thẻ đến hạn, câu sai, tiếp tục hoạt động đã lưu | Bắt buộc |
| Bài học | Văn bản, ngữ pháp, đọc hiểu, audio/transcript, từ vựng, lưu từ và bài yêu thích | Bắt buộc |
| Quiz và kiểm tra | Trắc nghiệm/điền từ, kiểm tra hoặc lưu đáp án theo loại lượt, nộp/hủy/tiếp tục, kết quả và giải thích | Bắt buộc |
| Ôn tập | Tạo/sửa/xóa thẻ, thẻ mới/đến hạn, lật/đánh giá thẻ, luyện câu sai | Bắt buộc |
| Theo dõi | Tiến độ, lịch sử, bài yêu thích, cập nhật khi dữ liệu thay đổi trên web | Bắt buộc |
| Tìm kiếm | Từ khóa, bộ lọc, phân trang, mở bài/lộ trình từ kết quả | Bắt buộc trong đề xuất này |
| Ghi chú | Ghi chú theo bài, danh sách riêng, sửa/xóa và xử lý xung đột phiên bản | Bắt buộc trong đề xuất này |
| Dictation | Danh sách, phát audio theo tốc độ, nhập/lưu bản chép, tiếp tục/nộp/hủy, xem kết quả/lịch sử | Bắt buộc trong đề xuất này |
| Google | Đăng nhập bằng trình duyệt hệ thống, quay về app, dùng chung định danh Supabase | Đề xuất bổ sung mobile; phụ thuộc credential |

Google bắt buộc trên web theo SRS, nhưng phạm vi mobile chưa được chốt riêng. Triển khai adapter và callback trong hạng mục tài khoản; chỉ nghiệm thu Google mobile khi kiểm thử provider thật. Bản email/password có thể dùng để thử nội bộ; nếu chọn Google vào bản bàn giao thì thiếu credential là điều kiện chưa đạt phát hành.

Không đưa vào đợt này: CMS trong app, học offline đầy đủ, tự đồng bộ hàng đợi khi có mạng, push notification, AI/chấm phát âm, thanh toán, bảng xếp hạng, phát audio nền và phát hành cửa hàng. Các phần được đề nghị hoãn trong đề cương gốc vẫn theo điểm cần xác nhận của SRS.

## 3. Kiến trúc kỹ thuật đề xuất

**React Native + Expo + TypeScript**, điều hướng bằng Expo Router. Lựa chọn này dựa trên nền tảng React/TypeScript của dự án; UI dùng component native và kế thừa màu sắc, kiểu chữ, nội dung của Sprout. Expo Router hỗ trợ điều hướng và deep link trên Android/iOS. [Tài liệu Expo Router](https://docs.expo.dev/router/introduction/).

```text
apps/web ─────┐
             ├── Identity / Content / Learning ── Supabase Postgres
apps/mobile ─┘               │
       └── Supabase Auth     └── Supabase Storage (URL có hạn)
```

- Giữ ba service và lịch sử migration hiện có. Điểm, hoàn thành bài, lịch ôn và quyền truy cập do backend quyết định; mobile không gọi SQL hay `/internal/*`.
- Tạo `packages/api-client` cho HTTP client và DTO public có kiểu cụ thể; truyền base URL, hàm lấy token, fetch và bộ sinh UUID từ nền tảng. Tách DTO public khỏi snapshot chứa đáp án của backend.
- Chuyển web sang client chung từng bước sau khi client đã ổn định; chạy lại kiểm thử web cho phần thay đổi. Không buộc viết lại giao diện web để làm mobile.
- Dùng Supabase JS cho Auth với storage adapter của mobile, `detectSessionInUrl: false`, refresh token theo vòng đời app và cơ chế khóa refresh theo hướng dẫn SDK. [Supabase React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native).
- Đề xuất `expo-secure-store` để lưu phiên nhạy cảm. Kiểm tra kích thước session thực tế, lỗi ghi/đọc và hành vi cài lại; không âm thầm chuyển token sang storage thuần văn bản nếu adapter thất bại. [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).
- Audio dùng `expo-audio`, có play/pause, seek, tải/lỗi/thử lại; Dictation có 0,75× / 1× / 1,25×. Dừng hoặc pause khi rời màn hình/app vào nền theo chính sách thống nhất. [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/).
- Giữ cache đọc trong bộ nhớ, làm mới khi quay lại màn hình và sau thao tác ghi. Bản nhập chưa lưu phải được phân biệt với dữ liệu server đã xác nhận.

### Cấu trúc dự kiến

```text
apps/mobile/
  app/                 # Auth, tabs, lesson, attempt, review, dictation
  src/components/      # Form, trạng thái, thẻ, audio player
  src/features/        # Màn hình và logic theo nghiệp vụ
  src/lib/             # Auth, storage, API, cấu hình, retry
  src/theme/           # Màu, spacing, typography của Sprout
  app.config.ts
  eas.json
  package.json
  tsconfig.json
packages/api-client/   # DTO public và client độc lập nền tảng
tests/mobile/          # Kịch bản và bằng chứng kiểm thử native
docs/mobile-development.md
docs/mobile-verification.md
```

Repository hiện có một package gốc chứa dependency web/backend, chưa khai báo workspaces. MOB-00 cần cấu hình npm workspaces và package mobile riêng; giữ React/React Native theo bộ phiên bản tương thích của Expo, không ép dùng phiên bản React đang ghim cho web. Kiểm tra Metro không resolve nhầm React, chỉnh phạm vi `tsconfig.json` gốc đang bao gồm `packages/**/*.ts`, duy trì một chiến lược lockfile nhất quán và build được cả web/backend/mobile. [Expo monorepos](https://docs.expo.dev/guides/monorepos/).

## 4. Màn hình và trải nghiệm

Đề xuất bốn tab chính: **Hôm nay · Khám phá · Ôn tập · Cá nhân**.

| Vị trí | Màn hình con |
|---|---|
| Hôm nay | Bài tiếp theo, hoạt động dở, thẻ đến hạn, câu sai, truy cập tiến độ |
| Khám phá | Lộ trình/chủ đề/bài học, tìm kiếm và bộ lọc, danh sách Dictation |
| Ôn tập | Bộ thẻ, tạo/sửa thẻ, phiên ôn, danh sách và lượt ôn câu sai |
| Cá nhân | Tiến độ, lịch sử, bài đã lưu, ghi chú, hồ sơ, đổi mật khẩu, đăng xuất |
| Màn hình chi tiết | Bài học, quiz/kiểm tra, kết quả, Dictation và kết quả |
| Tài khoản | Đăng nhập/đăng ký/xác minh email/khôi phục mật khẩu/callback |

Mỗi màn hình có trạng thái tải, trống, lỗi và thử lại. Bảo đảm safe area, bàn phím không che ô nhập/nút lưu, nút Back Android đúng luồng, vùng chạm tối thiểu mục tiêu 48dp và chữ phóng lớn vẫn đọc được. Màn hình làm bài giữ rõ trạng thái “chưa lưu/đã lưu/đang gửi”; chặn gửi lặp khi request đang chạy.

Rời ghi chú hoặc Dictation khi có bản nhập chưa lưu phải cảnh báo. Khi hệ điều hành đóng app, chỉ hứa khôi phục dữ liệu đã lưu trên server; nếu thêm lưu nháp cục bộ thì tách theo user và không tự nộp khi có mạng.

## 5. Hạng mục nền tảng cần giải quyết

### 5.1. Kết nối local và public

`scripts/backend-local.mjs` hiện ép service nghe tại `127.0.0.1`; Content tạo URL media từ `SUPABASE_URL`, hiện thường là loopback. Đổi riêng base URL mobile sẽ chưa giải quyết đường dẫn audio.

- Android Emulator: cấu hình host tương ứng; Android cung cấp địa chỉ `10.0.2.2` để tới loopback máy phát triển. Thiết bị thật có thể dùng USB `adb reverse` cho từng cổng cần thiết hoặc môi trường HTTPS thử nghiệm. [Android Emulator networking](https://developer.android.com/studio/run/emulator-networking).
- Ưu tiên một cấu hình USB reverse được kiểm chứng cho local; nếu dùng LAN, launcher phải cho phép cấu hình bind và phân biệt URL nội bộ với URL media client truy cập. Chỉ mở cổng phát triển cần thiết; không public route nội bộ/Postgres/Studio.
- Kiểm tra từ thiết bị cả ba API, Auth, đường dẫn email và audio URL thực tế. Native client không cần mở CORS wildcard để hoạt động; giữ allowlist dành cho web.
- HTTP local chỉ dành cho cấu hình debug. Bản phát hành dùng HTTPS và không chứa địa chỉ máy cá nhân.
- Build mobile chỉ nhận URL public và anon/publishable key; không chứa service-role key, database URL hay service token. Lập `.env.example` và cấu hình riêng development/preview/production.

### 5.2. Auth và deep link

- Đăng ký scheme ứng dụng và callback chính xác trong Supabase; đề xuất `sprout://auth/callback` cho development build, xác minh scheme/package trước khi cố định.
- OAuth mở trình duyệt hệ thống, xử lý callback khi app đang chạy hoặc chưa chạy; với PKCE phải lưu verifier và exchange code đúng một lần. Không tái sử dụng handler `location`/hash của web.
- Xác minh email và đặt lại mật khẩu phải hoạt động khi người dùng mở email trên điện thoại. Nếu mở ở thiết bị khác không có verifier, dùng luồng web/OTP đã thiết kế và kiểm thử; không coi mọi liên kết PKCE đều dùng được xuyên thiết bị.
- Xử lý callback hết hạn/đã dùng, hủy Google, tài khoản thiếu tên/bị khóa, refresh thất bại. Sau đổi mật khẩu gọi luồng thu hồi mọi phiên như web; đăng xuất thường chỉ thu hồi phiên hiện tại và xóa cache cục bộ.
- Không log token, mã callback hoặc mật khẩu. Không ghép tài khoản bằng chuỗi email ở client. Hướng dẫn nền tảng: [Supabase mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking/).

### 5.3. Tiếp tục lượt học, retry và xung đột

- Mỗi ý định tạo lượt/check/nộp/đánh giá thẻ dùng UUID idempotency ổn định cho các lần gửi lại cùng payload. Với mutation chưa rõ kết quả, lưu bản ghi tối thiểu trước khi gửi để khôi phục sau process restart; gắn user, endpoint, payload và key, xóa khi đã xác nhận kết quả.
- Đây là khôi phục request đã gửi, không phải hàng đợi làm bài offline. Mở lại app phải đối chiếu server và chỉ retry cùng payload khi phù hợp; không tự sinh lượt mới hoặc tự nộp bản nhập mới.
- Các API cập nhật bằng `expectedVersion`/`attemptVersion` nhận version mới sau mỗi lần ghi. Khi 409 hoặc timeout, đọc lại server trước khi quyết định; giữ bản nhập để người dùng chọn, không ghi đè phiên bản mới từ web.
- Không tự động retry mọi POST. Chỉ dùng idempotency tại endpoint hỗ trợ; PUT/PATCH không có key phải xử lý kết quả chưa rõ bằng cách đọc lại.
- Làm mới tiến độ/lịch sử khi quay lại app, vào màn hình hoặc kéo để tải lại; không yêu cầu realtime.
- Audio hiện có URL ký hạn 120 giây tại Content. Khi URL hết hạn, tải lại qua API public tương ứng của bài/lượt/thẻ rồi thay source, giữ vị trí nếu còn hợp lệ; không thay query chữ ký hay kéo dài quyền ở client. Nội dung bị ẩn phải xử lý theo trạng thái backend.

## 6. Thứ tự triển khai theo đầu ra

| Mã | Công việc và phụ thuộc | Điều kiện hoàn thành |
|---|---|---|
| MOB-00 | Dựng Expo app, workspace/TypeScript, cấu hình môi trường, development build; spike mạng/Auth/audio trên điện thoại | Cài app, mở lại độc lập, đọc danh mục và phát audio thật; web/backend vẫn build được; ghi bộ phiên bản và thiết bị mục tiêu |
| MOB-01 | Client/DTO public, session storage, lỗi, retry/version; đăng ký/đăng nhập/hồ sơ/deep link; sau MOB-00 | Email verification/reset thật chạy được; khôi phục phiên, khóa/thu hồi/đăng xuất đúng; callback lỗi không gây crash |
| MOB-02 | Shell bốn tab, học hôm nay, danh mục/chọn lộ trình, bài học/audio/từ vựng/yêu thích; sau MOB-01 | Hoàn thành luồng khách → đăng nhập → chọn lộ trình → đọc/nghe/lưu từ bằng API thật |
| MOB-03 | Quiz, kiểm tra chủ đề, tiếp tục/hủy/nộp, kết quả, tiến độ và lịch sử; sau MOB-02 | Web và mobile cùng điểm/trạng thái; process restart/timeout không tạo lượt hoặc kết quả trùng; không lộ đáp án sớm |
| MOB-04 | Thẻ CRUD, phiên ôn, đánh giá thẻ và ôn câu sai; sau MOB-03 | Lịch ôn do server cập nhật một lần; tiếp tục phiên chung web/mobile; xử lý thẻ đã sửa/xóa/reset |
| MOB-05 | Tìm kiếm, ghi chú, Dictation và lịch sử; sau MOB-02, dùng cơ chế lượt của MOB-03 | Tìm kiếm đúng quyền; note 409 giữ bản nhập; Dictation lưu/tiếp tục/nộp/audio chạy, transcript chỉ có sau nộp |
| MOB-06 | UX thiết bị, kiểm thử tích hợp/native và hồi quy web; sau MOB-01–05 | Toàn bộ tiêu chí mục 7 đạt trên emulator và điện thoại thật; không còn lỗi chặn luồng học hoặc mất dữ liệu đã lưu |
| MOB-07 | Hệ thống public HTTPS, build ký, cài/nâng cấp APK, tài liệu và demo; chuẩn bị hạ tầng từ MOB-01, đóng sau MOB-06 | APK dùng được qua mạng di động, không cần Metro/máy phát triển; minh chứng học chung web/mobile trên hệ thống public |

Đường triển khai chính: **MOB-00 → MOB-01 → MOB-02 → MOB-03 → MOB-04/MOB-05 → MOB-06 → MOB-07**. Triển khai public và credential Google cần chuẩn bị sớm để tránh chặn bước cuối.

Phân công đề xuất cho nhóm bốn người: (1) nền tảng mobile/Auth/build; (2) nội dung/quiz/tiến độ; (3) ôn tập/tìm kiếm/ghi chú/Dictation; (4) API chung/mạng/public/kiểm thử tích hợp. Chỉ tách việc màn hình sau khi thống nhất DTO, điều hướng và xử lý phiên/lỗi; mỗi hạng mục cần người khác rà soát.

## 7. Kiểm thử và tiêu chí nghiệm thu

| Mã | Kịch bản bắt buộc | Kết quả cần chứng minh |
|---|---|---|
| MAT-01 | Cài APK, tắt Metro, mở lại app | Chạy độc lập, gọi đúng môi trường |
| MAT-02 | Đăng ký, xác minh email, login/reset, callback khi app tắt/đang mở | Hoàn thành luồng thật; link sai/hết hạn có cách phục hồi |
| MAT-03 | Khóa tài khoản, thu hồi phiên, logout, đổi tài khoản | Yêu cầu kế tiếp bị chặn đúng; không lộ cache người dùng trước |
| MAT-04 | Khách tìm/học thử; truy cập bài riêng/nháp/ẩn | Chỉ thấy nội dung được phép; không ghi tiến độ khách |
| MAT-05 | Học/audio/lưu từ/yêu thích; kiểm tra URL media hết hạn | Audio thật phát được và tải lại URL; thao tác lặp không tạo trùng |
| MAT-06 | Quiz và kiểm tra: đúng/sai/bỏ trống/lưu/nộp/hủy | Quy tắc chấm và thời điểm lộ đáp án đúng như web/backend |
| MAT-07 | Bắt đầu trên web, tiếp tục mobile và chiều ngược lại | Cùng lượt, câu đã lưu, tiến độ và lịch sử khi tải lại |
| MAT-08 | Timeout sau server commit, nhấn hai lần, app bị đóng lúc gửi | Retry không nhân đôi lượt, điểm, thẻ hoặc lịch ôn |
| MAT-09 | Web/mobile cùng sửa đáp án hoặc ghi chú | 409 được xử lý rõ; không tự ghi đè dữ liệu mới |
| MAT-10 | Ôn thẻ, sửa/xóa/reset từ thiết bị khác, ôn câu sai | Phiên và lịch ôn nhất quán, xử lý item không còn hợp lệ |
| MAT-11 | Dictation: tốc độ, lưu, resume, nộp và bài bị ẩn | Không lộ transcript trước nộp; kết quả giữ nguyên; mất mạng không bị hiểu là bài bị ẩn |
| MAT-12 | Back, xoay màn hình nếu hỗ trợ, bàn phím, chữ lớn, app nền/foreground | Không mất bản nhập do chuyển màn hình ngoài ý muốn; không chồng audio hoặc che nút |
| MAT-13 | APK release trên điện thoại dùng mạng di động; nâng cấp bản ký cùng khóa | Học và đồng bộ được trên public; cập nhật không làm mất tiến độ server |
| MAT-14 | Google thật nếu đưa vào bản bàn giao | Hủy/đăng nhập lại/tài khoản liên kết giữ đúng định danh và tiến độ |

Kiểm thử tự động tập trung vào client/session, idempotency/version, lifecycle và màn hình có trạng thái phức tạp; dùng test native phù hợp Expo và một công cụ E2E Android được kiểm chứng trong MOB-00. Playwright hiện tại tiếp tục kiểm thử web, không dùng kết quả đó thay cho bằng chứng APK. Ghi rõ model thiết bị, Android version, build ID, môi trường, bước thử và kết quả trong `docs/mobile-verification.md`.

Khi chỉnh package/client/API chung: chạy `npm run typecheck`, `npm run web:typecheck`, build liên quan và các bộ `backend:test`, `features:test`, `web:test` tương ứng thay đổi. Các test tích hợp ghi dữ liệu chỉ chạy local/test. Script `mobile:typecheck`, `mobile:test`, `mobile:android` sẽ được tạo trong MOB-00, hiện chưa tồn tại.

Đủ dữ liệu nghiệm thu theo SRS: 3 chủ đề, 9 bài, quiz và kiểm tra tương ứng, audio thật, trạng thái thẻ đến hạn/câu sai/bài ẩn; bổ sung ghi chú và Dictation. Các gói demo chưa import/publish không được tính là dữ liệu sẵn sàng.

## 8. Phát hành và bàn giao

1. Chốt application ID, tên Sprout, icon/splash, Expo SDK và Android tối thiểu dựa trên máy kiểm thử và phiên bản SDK tương thích; ghi vào tài liệu, không tự cam kết phiên bản Android chưa thử.
2. Build development để kiểm thử native/deep link; build preview/release ký để bàn giao APK. EAS hỗ trợ cấu hình APK cài trực tiếp; AAB dùng cho quy trình Google Play nếu bổ sung sau. Kiểm tra tài khoản/quota trước khi chọn EAS; có phương án Android build local trên máy đủ SDK. [Expo APK build](https://docs.expo.dev/build-reference/apk/).
3. Dùng Supabase Cloud và ba API public theo kiến trúc đã chọn, áp dụng migration có kiểm soát; tách secret, bootstrap/demo và tài khoản vận hành. Kiểm tra health, Auth, media và hợp đồng API trước khi nhúng endpoint vào build.
4. Quản lý khóa ký ngoài Git và có bản sao lưu; versionName/versionCode rõ ràng. Bàn giao APK, checksum, cấu hình môi trường mẫu, hướng dẫn cài/nâng cấp/build, release notes và các giới hạn còn lại.
5. Demo: học/nộp quiz trên web → mở app thấy tiến độ → ôn thẻ/ghi chú/Dictation trên app → tải lại web thấy dữ liệu tương ứng. Có bằng chứng chạy qua Internet.

**Điều kiện hoàn thành:** APK đã cài và kiểm thử trên thiết bị thật; các chức năng đã chọn đạt mục 7; hệ thống public sẵn sàng; tài liệu build/triển khai/kiểm thử đầy đủ. Việc chạy được qua Expo Go hoặc emulator riêng lẻ chưa đủ nghiệm thu bàn giao.

## 9. Các quyết định cần chốt khi bắt đầu

| Điểm cần chốt | Phương án đang dùng để lập plan |
|---|---|
| Nền tảng và hình thức nộp | Android APK; đối chiếu yêu cầu triển khai với giảng viên; iOS/cửa hàng ngoài đợt đầu |
| Framework | React Native + Expo, xác nhận qua spike MOB-00 |
| Google mobile | Có thiết kế tích hợp; nghiệm thu phụ thuộc phạm vi được chọn và credential thật |
| Hạ tầng public | Dùng lại ba service/Supabase; kiểm chứng đường triển khai AWS và cấu hình HTTPS |
| Thiết bị, phiên bản, build | Chốt từ thiết bị nhóm có và SDK tương thích, không ấn định theo suy đoán |

Plan này bổ sung cho kế hoạch web, không sửa trạng thái yêu cầu đã xác nhận trong SRS. Khi bắt đầu code, đánh dấu tiến độ từng MOB và ghi bằng chứng nghiệm thu; không đổi “đề xuất” thành “đã triển khai” chỉ vì đã tạo tài liệu.
