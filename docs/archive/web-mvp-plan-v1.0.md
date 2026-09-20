# Kế hoạch triển khai MVP web hệ thống tự học tiếng Anh

| Thuộc tính | Nội dung |
|---|---|
| Phiên bản | 1.0 |
| Ngày lập | 19/09/2026 |
| Phạm vi | Web người học và Web Admin |
| Căn cứ chức năng | [SRS 0.3](srs.md) |
| Đã xác nhận | Tập trung bản web; có đăng nhập Google; giữ TypeScript, AWS, Supabase và microservice |
| Trạng thái | Kế hoạch thực hiện; chưa có mã nguồn hoặc hạng mục được đánh dấu hoàn thành |

Mục tiêu là có bản web sử dụng được với nội dung thật: người học đăng nhập bằng Google hoặc email, học theo lộ trình, làm bài, ôn tập và xem tiến độ; Editor/Admin vận hành được nội dung và tài khoản. Kế hoạch chia theo đầu ra kiểm chứng được và thứ tự phụ thuộc, không ấn định tuần hoặc ngày.

Các quy tắc sản phẩm lấy từ SRS; tài liệu này không định nghĩa lại cách chấm điểm hoặc lịch ôn. Lựa chọn framework, ranh giới service và thứ tự công việc dưới đây là phương án đề xuất. App mobile nằm ngoài bản phát hành web này, nhưng vẫn là phần cần bàn giao của toàn đồ án theo tài liệu học phần.

## 1. Phạm vi phải có khi phát hành

| Phần | Chức năng web | Yêu cầu SRS |
|---|---|---|
| Tài khoản | Email/mật khẩu, xác minh, Google, đăng xuất, phục hồi mật khẩu, hồ sơ | AUTH-01–05 |
| Học thử | Danh mục public, bài học thử và chuyển sang đăng nhập | GUEST-01 |
| Lộ trình và bài học | Chọn lộ trình, tiếp tục học, từ vựng/ngữ pháp/đọc/audio, transcript, bài yêu thích | FR-01–02 |
| Quiz | Trắc nghiệm một đáp án, điền từ, phản hồi, lưu lượt dở, kết quả và làm lại | FR-03 |
| Flashcard | Lưu từ, tạo/sửa/xóa thẻ, lật thẻ, Nhớ/Chưa nhớ và lịch ôn | FR-04–05 |
| Câu sai | Danh sách câu cần ôn, lượt luyện mới, cập nhật danh sách không sửa điểm cũ | FR-06 |
| Kiểm tra chủ đề | Lưu đáp án, nộp toàn bài, điểm, giải thích, gợi ý bài cần ôn | FR-07 |
| Theo dõi học | Tiến độ, lịch sử, điểm gần nhất/cao nhất và Học hôm nay rút gọn | FR-08, FR-10 |
| Nội dung quản trị | Lộ trình/chủ đề/bài/câu hỏi/từ vựng/media; nháp, xem trước, xuất bản, ẩn | CMS-01–04 |
| Vận hành quản trị | Học viên, Editor, cấp/thu hồi quyền, khóa tài khoản, tìm kiếm, thống kê | ADM-01–03 |

**Chưa thuộc bản web MVP:** app native, Dictation, mục tiêu/chuỗi ngày học, sắp xếp từ, nhiều bộ thẻ tùy chỉnh, AI, offline, bảng xếp hạng, thanh toán/VIP, bình luận và thông báo nhắc học. Các phần có trong đề cương gốc vẫn cần xác nhận việc hoãn với giảng viên theo CONF-01 của SRS.

Web người học phải dùng được trên màn hình điện thoại; đây là web responsive, không thay thế yêu cầu bàn giao app mobile. Web Admin ưu tiên thao tác trên máy tính, các trang không bị mất chức năng do tràn nội dung trên màn hình nhỏ.

## 2. Các màn hình cần xây

Đường dẫn bên dưới là gợi ý tổ chức giao diện, không phải hợp đồng API. Web người học và Web Admin có thể dùng hai origin riêng; cùng hệ thống tài khoản nhưng mỗi origin xử lý phiên/callback của mình.

| Nhóm | Đường dẫn gợi ý | Nội dung chính |
|---|---|---|
| Khách | `/`, `/courses`, `/preview/:lessonId` | Giới thiệu, danh mục và bài học thử |
| Tài khoản | `/login`, `/register`, `/auth/callback`, `/verify-email`, `/forgot-password`, `/reset-password` | Email/Google, xác minh và phục hồi phiên |
| Trang học | `/today`, `/courses/:courseId`, `/lessons/:lessonId` | Gợi ý, thứ tự bài, nội dung và tiếp tục học |
| Quiz | `/quizzes/:quizId`, `/attempts/:attemptId` | Bắt đầu/tiếp tục quiz, câu hỏi và kết quả |
| Flashcard | `/flashcards`, `/flashcards/review` | Bộ thẻ, tạo/sửa bằng form, phiên ôn |
| Câu sai | `/mistakes`, `/mistakes/review` | Lọc theo chủ đề và luyện lại |
| Kiểm tra | `/topics/:topicId/test` | Hướng dẫn, lượt dở, làm bài, nộp và liên kết kết quả |
| Cá nhân | `/progress`, `/history`, `/favorites`, `/profile` | Tiến độ, lịch sử, bài đã lưu và hồ sơ |
| Admin nội dung | `/admin/courses`, `/admin/lessons`, `/admin/questions`, `/admin/vocabulary`, `/admin/media` | Danh sách, form soạn, xem trước, xuất bản/ẩn |
| Admin vận hành | `/admin`, `/admin/learners`, `/admin/editors`, `/admin/audit` | Thống kê, tài khoản, quyền và lịch sử thao tác |

Mỗi màn hình dữ liệu có trạng thái đang tải, trống, lỗi và thử lại. Mọi form chỉ báo lưu thành công sau xác nhận từ hệ thống; các thao tác có thể làm mất phần đang nhập phải có cảnh báo phù hợp.

## 3. Nền tảng kỹ thuật đề xuất

Hai ứng dụng web dùng React và TypeScript, khởi tạo bằng Vite, chia sẻ thành phần giao diện và kiểu dữ liệu. Một monorepo chứa web, admin, các service, hợp đồng API và cấu hình triển khai. Vite có mẫu React/TypeScript để khởi tạo dự án. [Tài liệu Vite](https://vite.dev/guide/).

Supabase phụ trách Auth, Postgres và Storage. AWS triển khai backend TypeScript bằng Lambda/API Gateway; web tĩnh qua S3 và CloudFront. Đây là lựa chọn triển khai cho dự án, chưa phải cấu hình đã tạo hoặc xác nhận chi phí. Lambda hỗ trợ chạy mã TypeScript sau bước biên dịch sang JavaScript. [Tài liệu AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-typescript.html).

| Service | Trách nhiệm | Nhóm dữ liệu sở hữu |
|---|---|---|
| Identity | Hồ sơ ứng dụng, vai trò, quyền, trạng thái khóa, kiểm tra quyền/phiên; tích hợp Supabase Auth | Hồ sơ, quyền Editor, nhật ký quản trị tài khoản, trạng thái thu hồi phiên ứng dụng |
| Content | Lộ trình, chủ đề, bài, câu hỏi/đáp án, từ vựng, media và phiên bản xuất bản | Nội dung, bản nháp, phiên bản, liên kết media, nhật ký nội dung |
| Learning | Lượt làm, chấm điểm, flashcard, lịch ôn, câu sai, tiến độ và thống kê học | Bản chụp câu hỏi của lượt làm, câu trả lời, kết quả, thẻ, sự kiện ôn và tiến độ |

- Ba service có gói triển khai riêng. Một Postgres được dùng ban đầu với schema/quyền truy cập tách theo service; đây là cách tách quyền sở hữu dữ liệu, chưa phải ba database độc lập.
- Service trao đổi qua hợp đồng API nội bộ có xác thực, không ghi trực tiếp vào bảng của service khác. Shared package chứa hợp đồng và tiện ích chung, không chứa model cho phép truy cập chéo dữ liệu.
- Khi bắt đầu quiz/kiểm tra, Learning lấy bản nội dung bất biến từ Content qua kênh nội bộ. API người học chỉ trả dữ liệu được phép xem; đáp án không nằm trong bundle web hoặc phản hồi trước thời điểm được xem.
- Kết quả, tiến độ và danh sách câu sai thuộc Learning để cập nhật nhất quán trong cùng giao dịch. Chấm điểm, lịch ôn và xử lý yêu cầu lặp luôn do backend quyết định.
- Identity kiểm tra trạng thái/quyền trên yêu cầu được bảo vệ. Backend còn kiểm tra chủ sở hữu và điều kiện của từng tài nguyên. Chặn truy cập trực tiếp dữ liệu học/đáp án qua các kênh Supabase ngoài API ứng dụng.
- Dùng migration và dữ liệu mẫu có thể chạy lại. Chưa thêm message broker, cache riêng hoặc service riêng cho từng loại màn hình.

## 4. Hạng mục đăng nhập Google

### 4.1. Đầu ra sản phẩm

Nút **Tiếp tục với Google** có ở đăng nhập/đăng ký người học và đăng nhập Admin. Người mới hoàn tất hồ sơ rồi bắt đầu học; người cũ nhận lại dữ liệu. Đăng nhập từ Admin chỉ mở trang quản trị nếu có quyền. Google là phương thức bổ sung, không thay thế email/mật khẩu.

Đối chiếu AUTH-05: cùng tài khoản giữ nguyên tiến độ và quyền; tài khoản khóa vẫn bị chặn; hủy/lỗi quay lại được; không bắt người dùng Google tạo mật khẩu; đặt mật khẩu ứng dụng sau này không tạo hồ sơ mới. Không xây tính năng liên kết hai email khác nhau trong MVP.

### 4.2. Thiết lập và triển khai

1. Chuẩn bị Google Cloud project, màn hình đồng ý và OAuth client loại Web application; khai báo origin web và redirect URI trỏ tới callback của Supabase. Bật Google provider trong Supabase bằng Client ID/Secret. [Hướng dẫn Google của Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google).
2. Phân biệt callback Google → Supabase với callback Supabase → web. Trong Supabase khai báo Site URL và các URL callback chính xác của web/admin cho từng môi trường; URL production không dùng wildcard rộng. [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
3. Chọn luồng OAuth redirect với PKCE; callback đổi code thành phiên qua SDK, chỉ một nơi chịu trách nhiệm đổi code. Hoàn tất trên cùng trình duyệt/origin đã khởi tạo; đăng nhập ở origin Admin có callback riêng trên origin Admin. Trường hợp nhiều tab/lặp callback phải có xử lý phục hồi. [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow).
4. Chỉ dùng thông tin nhận dạng cơ bản phục vụ đăng nhập. Client Secret cấu hình tại provider/backend, không đưa vào mã web. Không thêm One Tap hoặc xin truy cập dữ liệu dịch vụ Google khác trong MVP.
5. Sau callback gọi API hoàn tất hồ sơ theo định danh Supabase đã xác thực. Kiểm tra quyền/trạng thái, tạo hồ sơ một lần nếu mới, trả thông tin người dùng và trang đích được phép. Chỉ chấp nhận đường dẫn nội bộ đã kiểm tra, không dùng trực tiếp URL do người dùng truyền vào.
6. Với tài khoản email đã tồn tại, dựa vào cơ chế liên kết của Supabase Auth; kiểm thử cả email đã xác minh và email chưa xác minh. Không tự nối bảng người dùng bằng email từ client. [Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking).
7. Khi đã có phiên, áp dụng cùng cơ chế kiểm tra API như email/mật khẩu. Để đáp ứng yêu cầu khóa/đăng xuất có hiệu lực ngay ở yêu cầu tiếp theo, phải kiểm tra thêm trạng thái phiên/tài khoản, không chỉ kiểm tra chữ ký và hạn JWT. Supabase có `session_id` để nhận diện phiên. [User sessions](https://supabase.com/docs/guides/auth/sessions).

### 4.3. Điều kiện kiểm tra tích hợp thật

- Có quyền cấu hình Google Cloud/Supabase; các secret được nhập vào nơi quản lý cấu hình, không đưa vào tài liệu hoặc Git.
- Có URL local và URL triển khai của web/admin; thử callback trên cả hai bề mặt. Cấu hình đối tượng được phép đăng nhập phù hợp nhóm người thử, không coi thử thành công bằng tài khoản chủ dự án là đã mở cho người dùng ngoài.
- Có tài khoản Google dùng thử độc lập, tài khoản email đã xác minh cùng địa chỉ và tình huống email đăng ký trước chưa xác minh.
- Luồng email/xác minh/phục hồi/mời Editor vẫn cần cấu hình SMTP hoạt động. SMTP mặc định của Supabase có hạn chế người nhận và không dành cho production. [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

Đây là đầu vào cần có lúc tích hợp, không phải yêu cầu cung cấp mật khẩu hay secret qua cuộc trò chuyện. Việc lập kế hoạch và đặc tả không phụ thuộc đã có các tài khoản cấu hình này.

## 5. Thứ tự công việc theo đầu ra

Mỗi hạng mục bao gồm giao diện, xử lý backend, dữ liệu, trạng thái lỗi và kiểm thử liên quan. Không đánh dấu hoàn thành chỉ vì đã có trang giao diện hoặc API trả dữ liệu giả. Các ô dưới đây đều chưa thực hiện.

### WEB-00 Nền tảng và môi trường

**Phụ thuộc:** Chưa có.

- [ ] Khởi tạo monorepo, hai web app, ba service và cấu hình môi trường mẫu.
- [ ] Thống nhất hợp đồng API, mã lỗi, cách truyền phiên, mã thao tác chống gửi trùng và quyền sở hữu dữ liệu.
- [ ] Migration khởi tạo, tài khoản quản trị thử, seed tối thiểu, kiểm tra kiểu/lint/build trong CI.
- [ ] Triển khai skeleton web/admin/API có health check, HTTPS, log và quy trình cập nhật/khôi phục phiên bản.

**Đầu ra nghiệm thu:** Từ hướng dẫn có thể dựng môi trường, mở web/admin đã deploy và gọi API; không có secret trong bundle. Chi phí dự kiến, cấu hình hạn mức và cách dừng tài nguyên đã được ghi lại trước khi vận hành có phí.

### WEB-01 Tài khoản và Google

**Phụ thuộc:** WEB-00 và cấu hình tích hợp ở mục 4.

- [ ] AUTH-01–05: email, xác minh, Google, callback, hồ sơ, phục hồi mật khẩu, đăng xuất.
- [ ] Quyền Người học/Editor/Admin, kiểm tra tài khoản khóa/phiên thu hồi, bảo vệ route và API; dùng tài khoản seed để kiểm thử trước khi có UI quản lý quyền.
- [ ] Xử lý tài khoản trùng email, hồ sơ tạo dở và điều hướng sau đăng nhập.

**Đầu ra nghiệm thu:** Google và email đăng nhập thật được trên môi trường triển khai; tài khoản cũ giữ dữ liệu; người học không vào được Admin. Đạt AT-16–17, AT-23–27 và phần phân quyền liên quan của AT-08.

### WEB-02 Nội dung và đọc bài

**Phụ thuộc:** WEB-01.

- [ ] CMS-01–04: form lộ trình/chủ đề/bài, từ vựng/audio, câu hỏi/quiz/đề kiểm tra; kiểm tra dữ liệu, nháp, xem trước, xuất bản và ẩn.
- [ ] GUEST-01 và FR-01–02: danh mục, học thử, chọn lộ trình, mở bài, audio/transcript, yêu thích và tìm kiếm.
- [ ] Cơ chế phiên bản nội dung, kiểm soát media và cung cấp bản nội dung nội bộ cho Learning.
- [ ] Nhập một chủ đề, một bài học hoàn chỉnh và quiz để nối luồng thật; các chủ đề còn lại bổ sung trước phát hành.

**Đầu ra nghiệm thu:** Editor soạn, người có quyền xuất bản, người học đọc/nghe được cùng bài; khách chỉ xem bài học thử; bản nháp/đáp án không bị lộ. Đạt phần nội dung của AT-10, AT-18, AT-21. Nghiệm thu lịch sử sau sửa nội dung hoàn tất thêm tại WEB-03/05.

### WEB-03 Quiz và tiến độ cơ bản

**Phụ thuộc:** WEB-02.

- [ ] FR-03: tạo/tiếp tục lượt, trắc nghiệm/điền từ, kiểm tra từng câu, kết thúc, kết quả và làm lại.
- [ ] Chấm điểm phía server, cố định phiên bản, lưu câu đã gửi, xử lý nộp trùng và hai tab đồng thời.
- [ ] FR-01/08: trạng thái bài, ngưỡng đạt, tiến độ, bài tiếp theo và lịch sử quiz; tạo dữ liệu câu sai cho WEB-04.

**Đầu ra nghiệm thu:** Người mới đăng nhập Google → học bài → làm quiz → nhận điểm → thấy bài hoàn thành và có thể xem lại lịch sử. Đạt AT-01–02 và các phần quiz của AT-09/10/19.

Đây là mốc demo đầu tiên có luồng học hoàn chỉnh ở mức một bài; chưa phải bản web MVP đủ điều kiện phát hành.

### WEB-04 Flashcard và ôn câu sai

**Phụ thuộc:** WEB-03; danh sách câu sai sử dụng kết quả quiz đã lưu.

- [ ] FR-04: lưu từ từ bài, tạo/sửa/xóa thẻ, chống trùng nguồn và giữ bản sao cá nhân.
- [ ] FR-05: thẻ mới/đến hạn, phiên tối đa 20 thẻ, Nhớ/Chưa nhớ, tiếp tục phiên và lịch 1–3–7–14 ngày theo SRS.
- [ ] FR-06: danh sách câu sai, lọc chủ đề, luyện tối đa 10 câu, ôn đúng bỏ khỏi danh sách, sai lại đưa trở lại.
- [ ] FR-10: trang Học hôm nay dùng dữ liệu thật về thẻ/câu sai/bài tiếp theo, xử lý người mới và trạng thái trống.

**Đầu ra nghiệm thu:** Lưu từ khi học rồi ôn được; hạn ôn đúng với thời gian kiểm soát; câu sai không trùng; ôn đúng không thay điểm quiz cũ. Đạt AT-03–05, AT-11 và phần ôn tập của AT-09.

### WEB-05 Kiểm tra chủ đề và lịch sử đầy đủ

**Phụ thuộc:** WEB-03 và WEB-04 để cập nhật danh sách cần ôn.

- [ ] FR-07: đề cố định theo phiên bản, lưu đáp án dở, sửa trước nộp, xác nhận câu trống, nộp toàn bài, điểm/giải thích và bài gợi ý.
- [ ] FR-08: phân biệt hoàn thành bài, đạt kiểm tra, hoàn thành chủ đề/lộ trình; điểm gần nhất/cao nhất, lịch sử và tiến độ khi thêm/ẩn bài.
- [ ] Hoàn tất kiểm thử nội dung bị sửa/ẩn khi có lượt đang làm, không lộ transcript/đáp án và xử lý thao tác từ hai trình duyệt.

**Đầu ra nghiệm thu:** Làm kiểm tra thật, chỉ xem đáp án sau nộp; câu sai xuất hiện ở mục ôn; mọi trạng thái tiến độ đúng SRS. Đạt AT-06, AT-19 và phần còn lại của AT-09/10.

### WEB-06 Vận hành Web Admin

**Phụ thuộc:** WEB-01/02 cho tài khoản/nội dung; WEB-03–05 cho thống kê học.

- [ ] ADM-01: tìm/lọc học viên, mời tài khoản, xem tiến độ tổng hợp, khóa/mở khóa/vô hiệu hóa.
- [ ] ADM-02: mời/nâng vai trò Editor, cấp/thu hồi từng quyền, ngăn tự nâng quyền hoặc mất Administrator cuối cùng.
- [ ] ADM-03: bộ đếm nội dung/học viên/hoạt động, điểm tổng hợp, bảng và biểu đồ theo ngày; phân trang và tìm kiếm đúng quyền.
- [ ] Nhật ký thay đổi tài khoản/quyền/nội dung; kiểm tra vai trò trên mọi endpoint quản trị.

**Đầu ra nghiệm thu:** Admin vận hành hệ thống từ giao diện; khóa hoặc thu hồi quyền tác động đến phiên đang mở, kể cả Google; thống kê khớp dữ liệu gốc. Đạt đầy đủ AT-08, AT-17, AT-20, AT-26.

### WEB-07 Hoàn thiện và phát hành bản web

**Phụ thuộc:** WEB-00–06.

- [ ] Hoàn thiện 3 chủ đề, 9 bài, ít nhất 45 câu quiz, 3 đề kiểm tra với 10 câu/đề, ít nhất 3 bài nghe và một bài học thử theo SRS mục 2.3; rà soát đáp án, giải thích và nguồn học liệu.
- [ ] Kiểm tra toàn bộ luồng trên desktop và trình duyệt điện thoại; thao tác bàn phím, nhãn form, trạng thái lưu/nộp, lỗi audio/mạng và session hết hiệu lực.
- [ ] Chạy các ca nghiệm thu web trong mục 6; kiểm thử Google thật với người ngoài tài khoản quản trị dự án.
- [ ] Kiểm tra cấu hình môi trường, HTTPS, quyền truy cập dữ liệu, log, sao lưu/khôi phục và quay lại phiên bản trước nếu bản mới lỗi.
- [ ] Chuẩn bị hai URL web/admin, tài khoản thử theo vai trò, hướng dẫn chạy cục bộ, deploy, dữ liệu mẫu, báo cáo kiểm thử và hướng dẫn demo.

**Đầu ra nghiệm thu:** Người dùng mới tự đăng nhập và đi hết chu trình học trên URL triển khai; Editor/Admin vận hành được; kết quả lưu thật và tải lại không mất. Các lỗi ngăn học, lộ đáp án, vượt quyền hoặc nhân đôi kết quả phải được xử lý trước khi đánh dấu xong.

## 6. Kiểm thử và điều kiện hoàn thành bản web

### 6.1. Phạm vi kiểm thử

Áp dụng AT-01–27 trong SRS, ngoại trừ AT-12/13 thuộc phần mở rộng. Với AT-07/15 có mobile trong SRS tổng thể, bản web dùng biến thể dưới đây; không đánh dấu phần app mobile đã được kiểm thử:

| Mã cho bản web | Kịch bản | Điều kiện đạt |
|---|---|---|
| WEB-AT-07 | Học trên trình duyệt A, tiếp tục bằng cùng tài khoản trên trình duyệt B hoặc web điện thoại | Tải lại nhận đúng dữ liệu đã lưu; cùng lượt không bị tạo mới; thay đổi cũ không ghi đè dữ liệu mới |
| WEB-AT-15 | Web người học và Web Admin trên môi trường triển khai | Chu trình chính chạy thật ở desktop và web điện thoại; ghi rõ trình duyệt, kích thước màn hình và kết quả đo tải |
| WEB-AT-28 | Google ở web người học và origin Admin, callback local và production | Callback về đúng origin; chỉ tạo/xác nhận phiên tại nơi khởi tạo; người thiếu quyền không vào Admin |
| WEB-AT-29 | Mất mạng khi hoàn tất hồ sơ Google; reload hoặc thử lại callback | Không nhân đôi hồ sơ, không mất tiến độ; nếu code không dùng lại được thì có đường đăng nhập mới |

Tự động hóa các kiểm tra nghiệp vụ dễ sai: chấm điểm/chuẩn hóa, hoàn thành bài/chủ đề, lịch ôn và chống gửi trùng. Kiểm thử tích hợp cho quyền, phiên bản nội dung, giao dịch nộp bài và đồng thời. Kiểm thử đầu cuối cho chu trình học chính; OAuth Google còn phải có ca kiểm thử thực tế bằng tài khoản được phép, không dùng riêng kết quả mock để kết luận tích hợp đạt.

**Mục tiêu tải đề xuất cho bản web:** 20 người đồng thời trong 15 phút; với các API nghiệp vụ đọc/ghi thường dùng, p95 không quá 2 giây, lỗi ngoài các tình huống cố ý kiểm thử dưới 1%. Không tính thời gian ở trang Google, gửi email, upload hoặc tải audio vào độ trễ API này; các phần đó kiểm tra riêng. Ghi vùng triển khai, điều kiện mạng, bộ dữ liệu và ảnh hưởng khởi động nguội; đây là ngưỡng cần nhóm xác nhận, chưa phải kết quả đã đạt hay yêu cầu chính thức của học phần.

### 6.2. Cổng nghiệm thu cuối

- [ ] WEB-00–07 có kết quả kiểm chứng và các ca nghiệm thu tương ứng.
- [ ] Đăng nhập Google/email và phục hồi tài khoản hoạt động với người dùng thử thực tế; trùng email không làm tách tiến độ.
- [ ] Người học hoàn thành được học bài → quiz → ôn → kiểm tra → xem tiến độ; Admin tạo và xuất bản được nội dung của luồng đó.
- [ ] Không lộ đáp án trước hạn xem, không đọc/sửa dữ liệu người khác, không tự nâng quyền, không vượt khóa bằng Google.
- [ ] Nộp lặp/mất mạng/hai tab không nhân đôi hoặc làm mất kết quả; lịch sử vẫn đúng khi sửa/ẩn nội dung.
- [ ] Nội dung nghiệm thu đủ và được rà soát; không còn dữ liệu giữ chỗ trong đường demo.
- [ ] Web/Admin đã triển khai; tài liệu chạy, kiểm thử, deploy và khôi phục dùng được; giới hạn tải và ngân sách đã được xác nhận/ghi nhận.

## 7. Những điểm cần theo dõi khi bắt đầu làm

| Vấn đề | Cách xử lý trong kế hoạch |
|---|---|
| Chưa có Google OAuth hoặc URL callback | Hoàn thiện cấu hình ở WEB-01; vẫn làm được WEB-00 và thiết kế nội dung; chưa coi Google login hoàn thành bằng giao diện mô phỏng |
| Email đăng ký/khôi phục không tới người dùng ngoài nhóm | Cấu hình SMTP và thử gửi thật; tách email phục vụ tài khoản khỏi tính năng nhắc học đang hoãn |
| Dữ liệu học tách đôi khi thêm Google | Lấy định danh đã xác thực làm khóa hồ sơ; kiểm tra AT-24/27 trước khi cho người dùng thử |
| Tài khoản khóa hoặc phiên cũ vẫn gọi được API | Kiểm tra trạng thái/quyền/thu hồi phiên ở backend từ WEB-01; không chỉ dựa vào việc ẩn nút hoặc JWT còn hạn |
| Nội dung và đáp án chưa đủ chất lượng | Có bài mẫu thật ở WEB-02; đủ bộ học liệu trước WEB-07, có người rà soát khác người nhập |
| Microservice làm tăng công sức kết nối | Giới hạn ba ranh giới tại mục 3, cùng hợp đồng API; kiểm tra tích hợp từ luồng một bài ở WEB-03 |
| Phạm vi đề cương gốc chưa được điều chỉnh | Giữ CONF-01 trong SRS; ghi rõ bản web MVP là một mốc sản phẩm, không tự coi đã đủ toàn bộ yêu cầu đồ án |

## 8. Cách dùng hai tài liệu

[SRS](srs.md) trả lời **sản phẩm phải hoạt động thế nào**. Kế hoạch này trả lời **cần xây phần nào, phụ thuộc gì và khi nào được coi là xong** theo kết quả thực tế. Khi thay đổi nghiệp vụ, cập nhật SRS trước rồi điều chỉnh hạng mục và ca nghiệm thu liên quan; không âm thầm cắt chức năng chỉ trong backlog.

Các tài liệu bổ sung được tạo trong quá trình thực hiện gồm hợp đồng API, mô hình dữ liệu theo service, cấu hình OAuth/môi trường không chứa secret, báo cáo kiểm thử và hướng dẫn triển khai. Chưa có hạng mục nào được triển khai trong lần lập kế hoạch này.
