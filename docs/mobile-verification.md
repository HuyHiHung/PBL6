# Kiểm chứng Sprout Mobile

Ngày: 20/09/2026. Môi trường: Windows, Node 22.18.0, Supabase Docker local; Identity/Content/Learning tại cổng 4001/4002/4003. Thiết bị thật/emulator: **chưa có**, theo phản hồi người dùng chỉ chuẩn bị app và hướng dẫn chạy trước.

## Các kiểm tra đã thực hiện

| Kiểm tra | Kết quả và phạm vi |
|---|---|
| Mobile TypeScript | Đạt; bao gồm app, client public và test UI |
| Backend TypeScript/build | Đạt; client public được build để kiểm thử API |
| Web TypeScript/build local | Đạt sau khi đồng bộ React/React DOM 19.2.3 |
| `web:test` | 12/12 Playwright tests đạt sau khi đồng bộ React, gồm đăng ký/xác minh/reset email trên browser |
| Expo Doctor | 21/21 đạt sau khi loại duplicate React/reanimated/worklets |
| `mobile:test` | 8/8: key giữ qua restart sau timeout; gộp double-tap; phân biệt ý định; 409; account isolation; storage failure; cấm ghi khi guest/cấm internal; abort timeout; báo thu hồi phiên |
| `mobile:test:ui` | 10/10: note 409 giữ bản nhập; kiểm tra lưu đáp án trước nộp và không lộ key; guest không mount dữ liệu riêng; session lớn/Unicode; ghi storage thất bại; đọc/ghi đồng thời; callback trùng chỉ exchange một lần; kiểm tra route/recovery; hướng dẫn khi PKCE lỗi; đổi tài khoản xóa profile cũ trước khi nhận profile mới |
| `mobile:test:api` | 1 luồng tích hợp nhiều bước đạt với backend/Auth/Storage thật, xem chi tiết bên dưới |
| `backend:test` | 12/12 đạt |
| `features:test` | 9/9 đạt |
| Export Android | Đã tạo bundle Hermes (không phải APK) |
| Expo prebuild Android | Thành công; manifest có scheme Sprout và loại quyền microphone |

Các lần chạy trong sandbox ban đầu bị chặn Docker/Hermes hoặc lỗi `uv_os_get_passwd`; các lệnh tương ứng đã chạy lại ngoài sandbox và đạt. Đây là lỗi môi trường công cụ, không phải bằng chứng APK đã chạy trên thiết bị.

## Tích hợp client mobile thực tế

`tests/mobile-api.test.mjs` tạo người học thử qua Supabase Auth local, đăng nhập thật và dùng `packages/api-client` để:

1. Đọc hồ sơ/catalog, chọn lộ trình, mở bài.
2. Ghi note ở client mobile, đọc/sửa ở client thứ hai; xác nhận mobile bị 409 khi dùng version cũ.
3. Giả lập mất phản hồi sau khi server tạo thẻ thành công, tạo lại client và gửi lại; chỉ có một thẻ trên server.
4. Bắt đầu lượt quiz, đọc/tiếp tục ở client thứ hai; cùng attempt ID và chưa có answer key.
5. Bắt đầu Dictation, tải bytes audio thật, lưu bản chép, đọc lại từ client thứ hai, nộp và chỉ sau đó nhận transcript.
6. Đọc tiến độ, đăng xuất, xác nhận token cũ bị từ chối.

Hai client này là HTTP client chạy trong Node, **không phải hai thiết bị native/web-browser**. Dữ liệu thử được giữ ở local theo quy ước các bộ test hiện có.

## Các kiểm tra còn thiếu trước nghiệm thu mobile

- Chưa build/ký/cài APK; chưa chạy Android emulator hoặc điện thoại.
- Chưa xem ảnh giao diện native để nghiệm thu bố cục/font/bàn phím/safe area.
- Chưa chứng minh email verification/reset và Google callback trên Android; allowlist mới cần nạp lại stack local.
- Chưa thử SecureStore, audio interruption/hết hạn URL, AppState/background/process kill trên hệ điều hành thật. Unit test dùng native mocks không chứng minh các hành vi này.
- Chưa thử public HTTPS, mạng di động, iOS, phát hành cửa hàng hoặc nâng cấp APK.
- Nội dung nghiệm thu 9 bài/3 chủ đề vẫn cần được xuất bản/rà soát theo SRS; test local chỉ chứng minh luồng với nội dung đã có.

## Trạng thái so với plan

- MOB-00–05: đã có mã nguồn và cấu hình cho các nhóm chức năng; không đánh dấu hoàn tất nghiệm thu thiết bị.
- MOB-06: kiểm thử tự động và API đã thực hiện; còn kiểm thử native thực tế.
- MOB-07: có profile build và hướng dẫn; chưa phát hành APK/hệ thống public.

Các bước chạy, cấu hình và giới hạn nằm trong [hướng dẫn mobile](mobile-development.md).
