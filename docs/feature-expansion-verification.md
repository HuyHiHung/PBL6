# Kiểm chứng tìm kiếm, ghi chú và Dictation

Ngày chạy: 20/09/2026. Windows, Node 22.18, Supabase local/Docker, ba HTTP service tại 4001–4003 và Vite tại localhost:5173. Dùng runtime role thật, Auth thật, Storage private và Edge headless. Không trỏ test tới Cloud.

## Kết quả

| Bộ kiểm tra | Kết quả | Bằng chứng local (không commit secrets/log thô) |
|---|---|---|
| Database hồi quy | 22/22 qua; kiểm tra inventory đã cập nhật thành 38 bảng, RLS và ranh giới service | `.local/regression-database.log` |
| HTTP hồi quy | 12/12 qua | `.local/regression-backend.log` |
| Tính năng mở rộng | 9/9 qua | `.local/expansion-test.log` |
| Web toàn bộ | 11/11 qua: 7 ca cũ + 4 ca mở rộng | `.local/regression-web.log` |
| Web sau chốt hiển thị điểm | 4/4 ca mở rộng qua lại | `.local/expansion-web-test.log` |
| Web lỗi audio/mạng bổ sung | 1/1 qua, thao tác lưu bằng bàn phím, viewport 390 px không tràn ngang | `.local/expansion-network-test.log` |
| Migration sạch | 15 migration + seed, 38 bảng; database tạm có schema Auth thực nhưng không có dữ liệu Auth | `.local/clean-migrations.log` |
| Nâng cấp có dữ liệu | Sau migration bổ sung đầu tiên, fingerprint 33 bảng gốc và Auth IDs giữ nguyên; các migration tiếp theo chỉ sửa hàm/quyền/version default | `.local/upgrade-before.json` là checkpoint trước nâng cấp |
| Bootstrap Dictation chạy lại | Fingerprint cả 38 bảng và Auth IDs không đổi | `.local/dictation-bootstrap-check.log` |
| SQL lint | Không có schema errors | `.local/expansion-lint.log` |
| TypeScript backend/frontend | Qua | `npm run typecheck`, `npm run web:typecheck` |
| Build backend/frontend | Qua | `npm run build`, `.local/expansion-web-build.log` |

Hiện có **55 ca kiểm thử riêng biệt**: 22 database + 12 HTTP + 9 mở rộng + 12 web. Các lần chạy lại một ca không được tính thêm. `npm run web:test` hiện tự thu thập cả ca audio/mạng mới.

## Những hành vi đã kiểm chứng

- Search không dấu/hoa thường, wildcard literal, filter, guest preview; published snapshot mới phản ánh ngay; cha ẩn bị loại. Fixture 25 kết quả kiểm tra rank exact/prefix/contains, trang 20+5 không trùng, truy vấn lặp giữ thứ tự; đổi pointer trở lại làm kết quả snapshot cũ biến mất.
- Ghi chú khác người không đọc được; tạo/lưu/xóa, hidden lesson vẫn sửa, không tạo mới trên bài ẩn. Version cũ bị từ chối kể cả sau xóa/tạo lại; đổi lesson revision báo `revision_changed`. UI hiển thị chuỗi `<script>` dưới dạng văn bản, tải lại vẫn giữ nội dung, cảnh báo rời trang giữ bản nhập khi người dùng từ chối.
- Dictation tokenization gồm dấu nháy cong/trắng/dấu câu, thiếu/thừa/sai, từ lặp và tie, điểm âm chặn 0, contraction/số không tự tương đương. API từ chối transcript rỗng/201 từ, chấp nhận 200 từ với dấu nháy cong; database publication dùng cùng quy tắc nháy.
- Hai request bắt đầu đồng thời trả một attempt; save stale 409; blank submit 400; hai lần nộp cùng key/payload trả cùng kết quả; đổi payload cùng key 409. Transcript chỉ có trong DTO đã submitted; người khác không truy cập lượt. Xuất bản transcript mới không sửa kết quả cũ.
- Editor thiếu publish bị từ chối; published revision không sửa; pointer sai cha, cập nhật kết quả đã nộp và cập nhật private keys bị chặn. Cross-schema runtime bị từ chối; đủ RLS trên 5 bảng mới.
- Trình duyệt: tìm → học bài → ghi chú; CMS tạo/publish/hide; Dictation save/reload/resume/submit/review, playbackRate 0.75, 22 từ đúng cho audio mẫu. Audio lỗi có thông báo; save mất mạng giữ bản nhập và retry thành công. Ảnh desktop/mobile đã mở để kiểm tra bố cục.

Nguồn test: [database](../tests/database.test.mjs), [HTTP](../tests/backend.test.mjs), [mở rộng](../tests/expansion.test.mjs), [web mở rộng](../tests/web/expansion.spec.ts). Các fixture thử nằm trong local; không phải dữ liệu deploy.

## Giới hạn đã ghi nhận

- Chưa chạy triển khai Supabase Cloud, Google OAuth thực hoặc Safari/iOS. Kiểm tra sạch dùng database tạm với baseline Auth, không reset toàn bộ container và bootstrap Auth mới trong môi trường độc lập.
- Audio mẫu là lời đọc tổng hợp từ kịch bản gốc; chưa qua giảng viên duyệt phát âm/học liệu. Audio cũ trong quiz bootstrap vẫn là fixture im lặng.
- Build Vite thành công nhưng cảnh báo chunk chính khoảng 502 kB trước gzip; chưa benchmark tốc độ tìm kiếm với kho dữ liệu lớn hoặc kiểm thử tải. Search hiện đọc dữ liệu trực tiếp như kế hoạch.
- Kiểm tra nâng cấp so sánh trước/sau được thực hiện trước các bộ test làm thay đổi dữ liệu fixture. Không dùng checkpoint ban đầu để so sánh lại sau khi đã tạo thêm tài khoản/lịch sử thử.

Các lệnh chạy lại và yêu cầu môi trường tại [kế hoạch bàn giao](feature-expansion-plan.md).
