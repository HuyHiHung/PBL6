# Sprout Mobile: chạy và build Android

Mã nguồn ở `apps/mobile`, dùng Expo SDK 57, React Native 0.86.3, React 19.2.3 và Expo Router. App dùng API thật của Identity/Content/Learning và Supabase Auth; không có backend hoặc database mobile riêng.

Đã chuẩn bị mã nguồn, cấu hình native/build và kiểm thử tự động. **Chưa có APK đã nghiệm thu, chưa chạy trên điện thoại/emulator, chưa triển khai public và chưa thử Google thật.** Người dùng hiện chưa có thiết bị Android và yêu cầu chuẩn bị app/hướng dẫn trước. Xem [bằng chứng kiểm thử](mobile-verification.md).

## 1. Chuẩn bị môi trường

- Node.js >= 22.13, npm, Docker Desktop; dùng `npm ci` tại gốc repository, không cài package riêng từng thư mục.
- Để chạy Android: Android Studio/Android SDK, platform-tools (ADB), SDK platform 36/build-tools phù hợp template Expo, Java phù hợp Gradle và điện thoại USB hoặc emulator. Chấp nhận license SDK bằng công cụ Android khi được yêu cầu.
- Máy hiện tại có Node 22.18 và Java 21 tại `C:\Program Files\Java\jdk-21`; PATH mặc định đang trỏ Java 8. Đặt `JAVA_HOME` cho terminal build, không dùng Java 8.
- Android command-line tools chính thức đã tải và kiểm tra checksum tại `.local/android-sdk/tools/cmdline-tools`. Đây chưa phải bộ SDK đã cài platform/build-tools và chưa có emulator. Có thể dùng Android Studio để quản lý SDK thay vì thư mục này.
- Windows không build iOS local. iOS chưa thuộc phạm vi kiểm thử/bàn giao hiện tại.

Tham khảo [môi trường Expo](https://docs.expo.dev/get-started/set-up-your-environment/), [Android sdkmanager](https://developer.android.com/tools/sdkmanager).

## 2. Backend và dữ liệu local

Chạy theo [hướng dẫn dự án](../README.md). Nếu chưa có stack:

```powershell
npm ci
npm run db:start
npm run db:migrate
npm run db:provision
npm run db:bootstrap
npm run db:dictation-demo
npm run build
npm run backend:start
```

Giữ backend chạy. Nếu đã có dữ liệu/stack, không reset database hoặc bootstrap lại chỉ để mở mobile. Dùng `npm run db:status` và `/health` để kiểm tra.

`supabase/config.toml` đã thêm callback `sprout://auth/callback` và callback recovery. Stack đang chạy từ cấu hình cũ cần được dừng/khởi động lại bằng `npm run db:stop` rồi `npm run db:start` để nạp allowlist; các lệnh này giữ dữ liệu. Sau đó khởi động lại backend nếu các tiến trình bị mất kết nối. Chưa thực hiện restart stack trong lần triển khai này.

## 3. Chạy development build

Kết nối điện thoại bằng USB, bật Developer options/USB debugging và xác nhận máy tính trên điện thoại. Hoặc khởi động một emulator. `adb devices` cần hiển thị thiết bị ở trạng thái `device`, không phải `unauthorized`. Với nhiều thiết bị, chọn một bằng `ANDROID_SERIAL`.

Từ thư mục gốc, terminal riêng:

```powershell
npm run mobile:configure -- --reverse
npm run mobile:android
```

Lệnh đầu tạo `apps/mobile/.env.local` từ URL/anon key của Supabase local, không ghi service-role key. `--reverse` nối các cổng `4001/4002/4003/55321/55324/5173/8081` từ điện thoại về máy tính. Lệnh thứ hai chạy `expo run:android`, build và cài development app; cần SDK đầy đủ trước khi chạy.

Các lần sau, khi app native đã cài:

```powershell
npm run mobile:dev -- --reverse
```

Metro chạy ở localhost, dùng qua USB reverse. Nếu development client không tự mở kết nối, chọn development server `http://127.0.0.1:8081` trong app. Sau mỗi lần rút USB/khởi động lại emulator, chạy lại cấu hình reverse. Khi thay config plugin hoặc dependency native, build lại bằng `mobile:android`.

Chưa có thiết bị/SDK vẫn có thể chuẩn bị `.env.local` bằng `npm run mobile:configure` và chạy các kiểm thử ở mục 6. `mobile:dev` phục vụ JavaScript, không tự tạo APK và không thay cho native build.

### Vì sao dùng USB reverse?

Backend và URL audio ký hiện dùng `127.0.0.1`. Reverse cho phép app gọi cả API lẫn audio mà không mở service nội bộ ra LAN. Đổi riêng URL API sang IP máy tính không sửa được URL audio trả về từ Content. Expo tunnel chỉ đưa Metro ra ngoài, không tự đưa backend/Supabase ra ngoài.

Với emulator, reverse cũng dùng được. Nếu chuyển sang `10.0.2.2` hoặc LAN, phải cấu hình đồng bộ API/Auth/media và bind phù hợp; cấu hình đó chưa được launcher này hỗ trợ. [Android networking](https://developer.android.com/studio/run/emulator-networking).

## 4. Luồng đã nối API

| Khu vực | Chức năng |
|---|---|
| Hôm nay | Bài tiếp theo, thẻ đến hạn/mới, câu sai, tiến độ/lịch sử |
| Khám phá | Danh mục, chọn lộ trình, chủ đề, bài học, audio/transcript, từ vựng, quiz, kiểm tra |
| Ôn tập | Thẻ CRUD, phiên ôn/lật/đánh giá, tiếp tục/hủy phiên, câu sai |
| Cá nhân | Hồ sơ, tiến độ, lịch sử, bài yêu thích, ghi chú, retry thao tác chưa nhận xác nhận, đăng xuất |
| Tìm kiếm | Debounce, lọc loại/lộ trình, phân trang, mở đúng bài hoặc danh mục |
| Ghi chú | Ghi chú riêng, cảnh báo bản nhập, xung đột version, sửa/xóa khi bài đã ẩn |
| Dictation | Lọc lộ trình/chủ đề/bài, audio/tốc độ, lưu/tiếp tục/nộp/hủy, transcript và đối chiếu kết quả |
| Auth | Email/password, đăng ký/gửi lại xác minh, callback PKCE, recovery, Google theo cờ cấu hình |

Guest chỉ truy cập danh mục/học thử/tìm kiếm public. Quiz/kiểm tra/Dictation chỉ hiển thị đáp án hoặc transcript khi DTO backend cho phép. Chấm điểm, hoàn thành bài và lịch ôn nằm ở backend.

### Dữ liệu chưa lưu và mất mạng

- Câu trả lời phải bấm Lưu/Kiểm tra; ghi chú/Dictation có nút Lưu. Có cảnh báo rời màn hình khi đã sửa.
- Bản nhập trong bộ nhớ không được bảo đảm sau khi hệ điều hành đóng app; dữ liệu đã được server xác nhận có thể tiếp tục trên thiết bị khác.
- Mutation hỗ trợ idempotency được lưu mã/payload trong SecureStore trước khi gửi. Nếu timeout, lần gửi lại cùng nội dung giữ nguyên key, kể cả tạo lại client sau restart. Mục Cá nhân liệt kê thao tác còn chờ xác nhận để người dùng chủ động gửi lại.
- Đây không phải cơ chế học offline hoặc tự nộp hàng đợi. Các PUT/PATCH xung đột cần đọc lại và đối chiếu; không áp dụng retry mù.
- Phiên/token và bản ghi retry được chia chunk trong SecureStore, ghi qua manifest và khóa đọc/ghi. Không fallback sang plaintext. Dữ liệu được tách theo tài khoản và phản hồi trễ từ tài khoản cũ bị bỏ.
- Audio dừng khi rời màn hình/vào nền, không xin quyền microphone. Nút Tải lại audio lấy URL ký mới qua API public và giữ vị trí khi có thể.

## 5. Auth callback và Google

Development app có scheme `sprout`, package Android `com.pbl6.sprout`. Dùng development build, không dùng Expo Go để nghiệm thu scheme/OAuth/SecureStore.

Email xác minh/reset nên mở trên thiết bị đã gửi yêu cầu vì PKCE cần verifier lưu trên thiết bị đó. Callback sai/hết hạn/đã dùng hiện thông báo phục hồi; nút khôi phục web dẫn tới trang cấu hình bằng `EXPO_PUBLIC_WEB_RECOVERY_URL`. Trên web cần gửi một yêu cầu khôi phục mới; không chuyển code PKCE từ mobile sang web.

Google chỉ hiện khi `EXPO_PUBLIC_GOOGLE_ENABLED=true`. Cần bật provider/credential tại Supabase, cấu hình callback Google → Supabase và allowlist Supabase → app. Client không giữ Google secret và không ghép hồ sơ theo chuỗi email. [Supabase native linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking).

Đổi mật khẩu dùng phiên recovery rồi gọi `/v1/logout-all`; logout thông thường thu hồi phiên hiện tại. Cả hai cần kiểm thử thực tế trên điện thoại trước khi nghiệm thu Auth mobile.

## 6. Kiểm thử và đóng gói

```powershell
npm run mobile:typecheck
npm run mobile:test
npm run mobile:test:ui
npm run build
npm run mobile:test:api
npm run mobile:export
```

`mobile:test:api` dùng Supabase/API local đang chạy và tạo tài khoản/dữ liệu thử; không chạy trên public. Test UI dùng React Native renderer và mock API/native modules, kiểm tra tương tác và trạng thái; không thay thế kiểm thử bố cục, audio và lifecycle trên thiết bị.

`mobile:export` tạo **bundle Hermes Android** tại `apps/mobile/dist`, không phải APK. Tạo native project từ cấu hình:

```powershell
cd apps/mobile
npx expo prebuild --platform android --no-install
npx expo-doctor
```

Thư mục `android/` được generate và bị bỏ khỏi Git. Không lưu chỉnh sửa thủ công duy nhất ở đó; đưa thay đổi bền vững vào app config/config plugin.

Web/mobile hiện thống nhất React/React DOM 19.2.3 theo Expo; native animation/worklets được ghim bằng overrides ở package gốc. DTO public nằm tại `packages/api-client`; không import snapshot chứa đáp án nội bộ. Web hiện vẫn giữ client cũ để hạn chế thay đổi nghiệp vụ.

## 7. APK và triển khai public sau này

- Development APK local: `mobile:android` tạo bản phục vụ phát triển, cần Metro.
- APK độc lập để bàn giao: cấu hình môi trường public HTTPS rồi build profile `preview` trong `eas.json` bằng EAS hoặc quy trình native ký tương ứng. Profile `production` tạo AAB cho Google Play; chưa cấu hình tài khoản cửa hàng.
- Trước EAS: tạo/liên kết EAS project, cấu hình `EAS_PROJECT_ID`, credential ký và biến public trong environment `preview`/`production`. Chưa có các tài khoản/credential này trong repo.
- `APP_ENV=production` từ chối thiếu cấu hình, URL HTTP hoặc loopback. `.env.local` hiện chỉ dành cho local; không đóng gói giá trị này vào bản public.
- Deploy ba API và Supabase Cloud theo kiến trúc dự án, cùng migration nhưng secret/tài khoản riêng; không mang tài khoản bootstrap local lên public. Public deployment chưa được thực hiện trong lần này.
- Bản bàn giao cần kiểm thử cài mới/nâng cấp, dùng mạng di động, email/Google callback, audio hết hạn, background/kill app và đồng bộ hai chiều. Xem các MAT trong [plan](../mobile-mvp-plan.md).

Tham khảo [Expo APK builds](https://docs.expo.dev/build-reference/apk/). Tài liệu này không xác nhận APK đã được build/ký hay app đã được phát hành.
