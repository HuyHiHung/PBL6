# Đặc tả yêu cầu chức năng MVP hệ thống hỗ trợ tự học tiếng Anh

| Thuộc tính | Giá trị |
|---|---|
| Phiên bản | 0.4 |
| Ngày cập nhật | 19/09/2026 |
| Trạng thái | Đề xuất phạm vi MVP để nhóm thống nhất sản phẩm |
| Đối tượng đọc | Thành viên nhóm, giảng viên hướng dẫn, người thiết kế và kiểm thử |
| Căn cứ | SRS 0.1; NHOM_5.docx; Kế hoạch PBL6_CNCNPM 2026_2027.docx; yêu cầu tập trung hoàn thiện chức năng của người dùng |

MVP giúp sinh viên học tiếng Anh nền tảng theo một chu trình đầy đủ: **chọn lộ trình → học bài → làm quiz → lưu và ôn từ vựng → luyện câu sai → kiểm tra cuối chủ đề → xem tiến độ**. Tài liệu xác định sản phẩm cần có, hành vi từng chức năng và điều kiện nghiệm thu. Không bao gồm lịch phát triển, phân công nhân sự hay thiết kế kỹ thuật chi tiết.

**Cách đọc trạng thái:** Những định hướng đã xác nhận được ghi tại mục 1. Phạm vi bản web, đăng nhập Google và thiết kế database sử dụng Supabase local/cloud cùng migration đã được người dùng yêu cầu lưu để triển khai. Các ngưỡng điểm, số lượng nội dung và quy tắc sản phẩm khác giữ trạng thái hiện có; việc duyệt thiết kế database không thay thế xác nhận điều chỉnh đề cương của giảng viên. Các điểm cần xác nhận bên ngoài nằm tại mục 12.

Kế hoạch triển khai riêng cho Web người học và Web Admin nằm tại [Kế hoạch MVP web](web-mvp-plan.md). Tài liệu đó tổ chức công việc theo đầu ra và phụ thuộc, không chia theo tuần. SRS này tiếp tục giữ các yêu cầu của toàn sản phẩm; nghiệm thu bản web không bao gồm app mobile.

[Thiết kế database](docs/database-design.md) quy định bảng, quan hệ, ràng buộc, quyền truy cập, giao dịch và thứ tự migration. Đây là tài liệu thiết kế; việc có tài liệu không có nghĩa database, migration SQL hoặc các chức năng đã được triển khai và kiểm thử.

## 1. Định hướng và ràng buộc

### 1.1. Những nội dung đã xác nhận

| Mã | Nội dung |
|---|---|
| DEC-01 | Đối tượng chính là sinh viên học tiếng Anh nền tảng |
| DEC-02 | Điểm nổi bật là lộ trình học và ôn tập |
| DEC-03 | Sử dụng TypeScript, AWS và Supabase |
| DEC-04 | Kiến trúc microservice |
| DEC-05 | Nhóm có 4 thành viên, mức độ quen AWS/Supabase trung bình đến khá |
| DEC-06 | Bối cảnh ban đầu dự kiến khoảng 3 tháng; bản này không lập kế hoạch theo lịch |
| DEC-07 | Quy mô đồ án khoảng 20–100 người dùng, có triển khai thực tế; chưa xác định số người đồng thời |
| DEC-08 | Ưu tiên chi phí thấp và trial/credits; chưa chốt ngân sách |
| DEC-09 | Nhóm muốn điều chỉnh đề cương theo trọng tâm học tập; chưa có xác nhận của giảng viên về các phần được cắt |
| DEC-10 | Yêu cầu hiện tại là hoàn thiện chức năng để làm sản phẩm, không lập lịch thực hiện |
| DEC-11 | Lập kế hoạch MVP riêng cho Web người học và Web Admin, ưu tiên bản web trước |
| DEC-12 | Bổ sung đăng nhập bằng Google vào phạm vi MVP web, bên cạnh email/mật khẩu |
| DEC-13 | Dùng Supabase local khi phát triển/kiểm thử; Supabase Cloud khi triển khai public |
| DEC-14 | Cấu trúc database được quản lý bằng một lịch sử Supabase SQL migration chung cho local và cloud |
| DEC-15 | Một Postgres với ba schema nghiệp vụ identity, content, learning; mỗi service sở hữu dữ liệu và runtime role riêng |
| DEC-16 | Supabase quản lý Auth/Storage; hồ sơ ứng dụng dùng auth.users.id, không tạo hệ thống mật khẩu hoặc định danh Google riêng |
| DEC-17 | Tách migration cấu trúc, seed dữ liệu, bootstrap tài khoản thử và upload media; không tự động đưa dữ liệu học thử lên cloud |
| DEC-18 | Giữ phiên bản nội dung đã xuất bản, bản chụp lượt làm và lịch sử; dùng transaction, ràng buộc chống trùng và kiểm soát phiên bản để bảo vệ dữ liệu học |

### 1.2. Ràng buộc học phần

Tài liệu học phần yêu cầu **Web Admin, Web người học và app mobile**, tất cả được triển khai thực tế. Mobile có thể là Android, iOS hoặc cả hai. Hồ sơ bàn giao gồm yêu cầu, phân tích, thiết kế, kiểm thử, tài liệu triển khai, báo cáo, slide, mã nguồn và dữ liệu.

Đề xuất MVP bàn giao app Android cài đặt được, có đầy đủ luồng học cốt lõi. Hình thức bàn giao và cách chứng minh đã triển khai mobile cần đối chiếu với giảng viên. Việc dùng TypeScript và microservice là định hướng nhóm đã chọn, không được diễn giải thành yêu cầu bắt buộc của học phần.

## 2. Phạm vi sản phẩm

### 2.1. Phạm vi bắt buộc trong MVP đề xuất

| Nhóm | Chức năng | Tham chiếu |
|---|---|---|
| Tài khoản | Đăng ký, xác minh email, đăng nhập email/mật khẩu và Google, đăng xuất, quên mật khẩu, hồ sơ cơ bản | AUTH-01–05; Google bắt buộc trong MVP web |
| Lộ trình | Chọn lộ trình, xem chủ đề/bài học, tiếp tục học, gợi ý bài tiếp theo | FR-01 |
| Bài học | Từ vựng, ngữ pháp, đọc, audio nghe hiểu, transcript, bài yêu thích | FR-02 |
| Luyện tập | Quiz trắc nghiệm một đáp án và điền từ; chấm điểm, giải thích, lịch sử | FR-03 |
| Ôn tập | Thẻ từ vựng cá nhân, lịch ôn, luyện lại câu sai | FR-04–06 |
| Đánh giá | Kiểm tra cuối chủ đề, kết quả, gợi ý bài cần ôn | FR-07 |
| Tiến độ | Bài đã hoàn thành, điểm cao nhất/gần nhất, lịch sử, dữ liệu chung web/mobile | FR-08 |
| Gợi ý hôm nay | Màn hình ưu tiên thẻ đến hạn, câu sai và bài tiếp theo | FR-10 phiên bản rút gọn |
| Nội dung | Lộ trình, chủ đề, bài học, từ vựng, câu hỏi, media; nháp, xuất bản, ẩn | CMS-01–04 |
| Quản trị | Học viên, Editor, cấp quyền, tìm kiếm và thống kê cơ bản | ADM-01–03 |
| Khách | Xem danh mục đã xuất bản và bài được đánh dấu học thử | GUEST-01 |

### 2.2. Phần mở rộng

**P1:** Mục tiêu và chuỗi ngày học (FR-09), Dictation (FR-11), sắp xếp từ, nhiều bộ flashcard do người học tự tổ chức, phiên học hằng ngày có danh sách cố định và tiếp tục phiên dở.

**Đề xuất chưa làm trong MVP:** Thanh toán/VIP, bình luận, email nhắc học, hộp thông báo, kiểm tra đầu vào, tra từ bằng dịch vụ ngoài, thử thách, AI, chấm phát âm/bài viết, bảng xếp hạng, thi đấu, học offline và đồng bộ thời gian thực.

Thanh toán/VIP, bình luận và thông báo có trong đề cương gốc. Chúng là **phạm vi đề nghị hoãn, chờ xác nhận**, không phải các yêu cầu đã được phê duyệt loại bỏ. Nếu cần giữ, phải đặc tả bổ sung; không coi MVP hiện tại đã đáp ứng đầy đủ đề cương gốc.

### 2.3. Nội dung dùng để nghiệm thu

Đề xuất giao diện tiếng Việt, nội dung tiếng Anh có giải thích tiếng Việt; một lộ trình nền tảng định hướng A1. Nội dung A2 để mở rộng. Không quảng bá kết quả kiểm tra là chứng nhận CEFR.

Bộ nội dung tối thiểu để chứng minh sản phẩm:

- 3 chủ đề gần với sinh viên, mỗi chủ đề 3 bài; tổng cộng 9 bài hoàn chỉnh.
- Mỗi bài có mục tiêu, nội dung học, ít nhất 5 mục từ và 5 câu quiz. Từ được dùng lại giữa các bài khi phù hợp.
- Mỗi chủ đề có một bài kiểm tra 10 câu riêng, không dùng lại nguyên câu của quiz trong cùng chủ đề.
- Mỗi chủ đề có ít nhất một bài nghe có audio và transcript khớp; toàn bộ nội dung có cả ngữ pháp và đọc hiểu.
- Ít nhất một bài học thử; dữ liệu mẫu có câu đúng/sai, bài nháp/ẩn và thẻ đến hạn để kiểm thử các trạng thái.
- Mọi câu có đáp án hợp lệ, giải thích và bài liên quan. Nội dung/audio phải có nguồn hoặc được nhóm tự biên soạn, kèm thông tin cho phép sử dụng; có người khác người nhập rà soát trước xuất bản.

Số lượng trên là yêu cầu dữ liệu nghiệm thu đề xuất, không phải giới hạn lưu trữ hay tuyên bố đã bao phủ trình độ A1.

## 3. Vai trò và phạm vi web mobile

| Hành động | Khách | Người học | Editor | Administrator |
|---|---|---|---|---|
| Xem danh mục public và bài học thử | Có | Có | Có | Có |
| Học, làm bài, quản lý dữ liệu cá nhân | Không | Của mình | Khi dùng giao diện người học | Khi dùng giao diện người học |
| Xem nội dung trong Web Admin | Không | Không | Có | Có |
| Biên soạn nội dung | Không | Không | Khi có quyền biên soạn | Có |
| Xuất bản/ẩn nội dung | Không | Không | Khi có quyền xuất bản | Có |
| Xem/thêm/khóa học viên | Không | Không | Khi có quyền quản lý học viên | Có |
| Xem thống kê tổng hợp | Không | Không | Khi có quyền xem báo cáo | Có |
| Quản lý Editor và cấp quyền | Không | Không | Không | Có |

Editor mới mặc định chỉ có quyền xem và biên soạn. Administrator cấp riêng quyền xuất bản, quản lý học viên và xem báo cáo. Quyền quản lý học viên không bao gồm cấp quyền hoặc quản lý Editor/Administrator. Không có chức năng tự nâng quyền từ hồ sơ cá nhân.

Web và mobile phải có cùng quy tắc chấm điểm, hoàn thành bài và lịch ôn; hỗ trợ toàn bộ nhóm chức năng người học trong MVP. Web Admin là nơi vận hành nội dung và tài khoản, không yêu cầu có giao diện quản trị trong app mobile.

## 4. Tài khoản và truy cập

### AUTH-01 Đăng ký và xác minh email

Khách nhập tên hiển thị, email và mật khẩu để tạo tài khoản người học qua phương thức email/mật khẩu. Tên hiển thị dài 2–50 ký tự; mật khẩu 8–72 ký tự, có chữ và số. Email được chuẩn hóa khoảng trắng ở hai đầu; cùng email không tạo thêm tài khoản. Email xác minh có hạn sử dụng; liên kết hết hạn cho phép yêu cầu gửi lại, có giới hạn tần suất và thông báo khi cần chờ. Đăng nhập Google dùng luồng AUTH-05, không bắt tạo mật khẩu hoặc xác minh email lần nữa khi nhà cung cấp đã xác minh hợp lệ.

Tài khoản chưa xác minh chỉ được dùng phạm vi khách và thao tác xác minh. Không cho bắt đầu hoạt động có lưu tiến độ. Khi xác minh xong, người học đăng nhập và chọn lộ trình. Thông báo đăng ký/gửi lại không tiết lộ thêm hồ sơ hay trạng thái của email khác.

**Nghiệm thu:** Email hợp lệ xác minh được và đăng nhập thành công; email chưa xác minh không lưu kết quả học; đăng ký lặp không tạo tài khoản thứ hai.

### AUTH-02 Đăng nhập đăng xuất và phiên sử dụng

Đăng nhập bằng email/mật khẩu hoặc Google theo AUTH-05; thông báo chung khi thông tin đăng nhập không hợp lệ. Hệ thống duy trì phiên trên thiết bị, yêu cầu đăng nhập lại khi phiên hết hiệu lực và không làm mất các kết quả đã được xác nhận lưu. Đăng xuất kết thúc phiên ứng dụng trên thiết bị hiện tại, không đăng xuất tài khoản Google khỏi trình duyệt; đăng nhập trên web và mobile cùng tài khoản được phép khi nền tảng đó đã được triển khai.

Tài khoản bị khóa bị từ chối đăng nhập và các thao tác cần quyền ngay ở yêu cầu tiếp theo, kể cả đang có phiên. Thông báo khóa không hiển thị thông tin quản trị nội bộ. Có giới hạn thử đăng nhập liên tục; không hiển thị mật khẩu trong log hay giao diện quản trị.

**Nghiệm thu:** Đăng xuất không còn truy cập được dữ liệu riêng qua phiên đó; tài khoản bị khóa không thể tiếp tục nộp bài hoặc dùng Web Admin.

### AUTH-03 Quên và đặt lại mật khẩu

Người dùng yêu cầu liên kết đặt lại mật khẩu ứng dụng qua email. Thông báo phản hồi giống nhau với email tồn tại và không tồn tại, không tiết lộ tài khoản đang dùng Google hay mật khẩu. Liên kết chỉ dùng một lần, có thời hạn, không cho đặt mật khẩu yếu hơn AUTH-01. Sau đổi mật khẩu, các phiên ứng dụng cũ bị thu hồi và người dùng đăng nhập lại. Mở liên kết từ điện thoại phải hoàn thành được luồng đặt lại, có thể qua trang web.

Tài khoản chỉ dùng Google được tiếp tục đăng nhập Google; nếu muốn dùng thêm email/mật khẩu, có thể tạo mật khẩu ứng dụng qua luồng xác minh email phục hồi này. Thao tác phải giữ nguyên tài khoản và tiến độ, không tạo hồ sơ mới hoặc thay mật khẩu Google. Việc xác minh này chỉ bảo vệ thao tác đặt mật khẩu ứng dụng, không phải bước bắt buộc khi đăng nhập Google.

**Nghiệm thu:** Mật khẩu mới dùng được; mật khẩu cũ, liên kết đã dùng và phiên đã thu hồi không tiếp tục cho truy cập.

### AUTH-04 Hồ sơ cá nhân

Người học xem email, phương thức đăng nhập đang có và sửa tên hiển thị; đặt/đổi mật khẩu ứng dụng qua AUTH-03. Email là định danh không sửa trong MVP. Không yêu cầu avatar, ngày sinh, số điện thoại hoặc dữ liệu cá nhân không phục vụ việc học. Tên nhận từ Google chỉ dùng khởi tạo, không ghi đè tên người dùng đã sửa ở các lần đăng nhập sau.

**Nghiệm thu:** Sửa tên được lưu và thấy trên thiết bị khác khi tải lại; yêu cầu sửa vai trò, trạng thái hoặc hồ sơ người khác bị từ chối.

### AUTH-05 Đăng nhập bằng Google

**Phạm vi:** Bắt buộc trong MVP web theo yêu cầu người dùng. Dùng cùng tài khoản ứng dụng và dữ liệu học với phương thức email/mật khẩu. Tích hợp Google trên app mobile được xử lý trong phạm vi mobile sau.

**Luồng chính:**

1. Trang đăng nhập/đăng ký có nút “Tiếp tục với Google”. Trang đăng nhập Web Admin cũng hỗ trợ phương thức này, nhưng vẫn kiểm tra quyền quản trị sau xác thực.
2. Người dùng được chuyển đến Google để chọn tài khoản và đồng ý cung cấp thông tin đăng nhập cơ bản. Ứng dụng không thu thập mật khẩu Google.
3. Sau xác thực thành công, hệ thống kiểm tra phiên hợp lệ, email đã được xác minh và trạng thái tài khoản ứng dụng; chỉ khi hợp lệ mới cho truy cập chức năng cần đăng nhập.
4. Người mới có đúng một hồ sơ vai trò Người học; tên được gợi ý từ Google, cho bổ sung nếu thiếu/không hợp lệ. Không bắt đặt mật khẩu riêng. Tiếp tục chọn lộ trình, hoặc trở về bài đã yêu cầu mở nếu có đường dẫn hợp lệ.
5. Người cũ dùng lại hồ sơ, tiến độ, thẻ và lịch sử. Nếu không có trang đích hợp lệ thì về Học hôm nay; Editor/Admin đăng nhập từ Web Admin về trang quản trị được phép.

**Tài khoản trùng email và quyền:**

- Với email đã xác minh trùng tài khoản hiện có, dùng cơ chế liên kết danh tính do Supabase Auth hỗ trợ và định danh người dùng đã xác thực; không tự ghép hai hồ sơ chỉ từ chuỗi email gửi lên giao diện. Supabase mô tả cơ chế tự liên kết và xử lý danh tính chưa xác minh trong [Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking).
- Nếu liên kết chưa thể hoàn thành an toàn, hiển thị cách thử lại/đăng nhập phương thức cũ, không tự tạo hồ sơ học thứ hai hay sao chép dữ liệu. Email khác là tài khoản khác; chưa có ghép/tách tài khoản thủ công trong MVP.
- Đăng nhập Google không tự cấp quyền Editor/Admin, không mở lại tài khoản bị khóa và không thu hồi quyền đã được cấp hợp lệ. Quyền lấy từ hệ thống, không suy ra từ tên hoặc miền email Google.
- Hồ sơ được khởi tạo theo định danh xác thực, có thể thử lại sau lỗi mà không tạo trùng. Đăng ký email/mật khẩu sau Google cùng email cũng không tạo tài khoản thứ hai; hướng dẫn dùng Google hoặc AUTH-03 để đặt mật khẩu ứng dụng.

**Ngoại lệ và phiên:** Hủy/khước từ ở Google quay về trang đăng nhập với thông báo, không ghi nhận đăng nhập thành công. Lỗi mạng, mã callback không hợp lệ/đã dùng hoặc phiên hết hạn có đường thử lại. Sau khi đã xác thực nhưng tạo hồ sơ thất bại, cho thử lại bước hoàn tất hồ sơ bằng cùng định danh. Chỉ điều hướng về đường dẫn nội bộ được phép; không dùng địa chỉ tùy ý từ tham số trả về. Các quy tắc khóa tài khoản, đăng xuất và bảo vệ dữ liệu của AUTH-02 vẫn áp dụng.

**Nghiệm thu:** Đăng nhập mới không cần mật khẩu ứng dụng; đăng nhập lại không sinh thêm hồ sơ; Google và email/mật khẩu cùng tài khoản giữ cùng tiến độ; hủy OAuth không tạo phiên ứng dụng mới; tài khoản bị khóa vẫn bị chặn; người học không vào được Web Admin; callback lỗi không làm mất dữ liệu hoặc chuyển tới trang ngoài được chèn vào.

### GUEST-01 Học thử

Khách xem tên, mô tả và chủ đề của nội dung đã xuất bản; tìm kiếm theo tên và đọc/phát audio của bài có cờ học thử. Các bài còn lại hiển thị yêu cầu đăng nhập. Khách không làm quiz/kiểm tra, lưu bài, tạo thẻ hoặc ghi tiến độ. Đăng ký xong không tự sinh kết quả học từ hoạt động học thử.

**Nghiệm thu:** Khách không lấy được bài không cho học thử, nội dung nháp, đáp án hoặc dữ liệu cá nhân qua đường dẫn trực tiếp.

## 5. Chức năng học tập trong MVP

### FR-01 Lộ trình học

- Xem cấu trúc lộ trình → chủ đề → bài; mục tiêu, thứ tự và tiến độ của từng phần.
- Chọn một lộ trình đang học chính. Khi có thêm lộ trình, đổi lộ trình không xóa tiến độ cũ.
- Không khóa bài theo điều kiện tiên quyết. Người học được mở mọi bài đã xuất bản thuộc lộ trình.
- Bài chuyển từ Chưa học sang Đang học khi người học mở bài thành công; chuyển sang Hoàn thành khi có ít nhất một lượt quiz đạt 70% trở lên.
- Làm lại với điểm thấp hơn không hủy trạng thái hoàn thành. Thay đổi nội dung cũng không tự hủy kết quả đã đạt.
- “Tiếp tục học” mở bài chưa hoàn thành được học gần nhất trong lộ trình; nếu không có thì mở bài chưa hoàn thành đầu tiên theo thứ tự biên soạn. Khi tất cả bài hoàn thành, gợi ý kiểm tra chủ đề chưa đạt, sau đó là ôn tập.

**Nghiệm thu:** Mở bài tạo trạng thái Đang học; đạt đúng 70% hoàn thành bài; làm lại dưới 70% vẫn giữ kết quả đã đạt; chuyển lộ trình rồi quay lại không mất tiến độ.

### FR-02 Bài học và bài yêu thích

- Bài có tên, mục tiêu và các phần từ vựng/ngữ pháp/đọc/nghe do Editor sắp xếp. Không bắt buộc mỗi bài có đủ bốn loại.
- Từ vựng có từ, nghĩa và ví dụ; phiên âm/audio là tùy chọn. Người học thêm từ vào bộ thẻ cá nhân ngay trong bài.
- Bài nghe có phát/tạm dừng/nghe lại và nút xem transcript; transcript của phần học được mở bất kỳ lúc nào. Tư liệu kiểm tra có quy tắc riêng tại FR-07.
- Cho lưu/bỏ yêu thích; danh sách đã lưu có tìm kiếm theo tên. Lưu cùng bài nhiều lần chỉ có một mục.
- Ghi nhớ bài đang học; không yêu cầu lưu vị trí cuộn, đoạn audio đang phát hoặc trạng thái từng khối nội dung.
- Audio lỗi có thông báo và nút thử lại; phần nội dung còn lại vẫn đọc được.
- Bài bị ẩn không mở lại được từ danh sách đã lưu; hiển thị “Nội dung không còn khả dụng” và cho bỏ lưu. Lịch sử học vẫn còn.

**Nghiệm thu:** Đọc bài, nghe audio, mở transcript, lưu từ và lưu/bỏ bài hoạt động trên cả web/mobile; thao tác lặp không tạo mục trùng.

### FR-03 Quiz trong bài

Mỗi bài có một quiz đang xuất bản, gồm 5–10 câu theo thứ tự cố định. MVP hỗ trợ trắc nghiệm một đáp án và điền từ; sắp xếp từ để mở rộng. Quy tắc chung:

1. Bắt đầu tạo một lượt làm và cố định phiên bản câu hỏi của lượt đó. Mỗi người chỉ có một lượt đang làm cho cùng quiz; được tiếp tục hoặc hủy lượt dở để bắt đầu lượt mới.
2. Người học chọn/nhập đáp án rồi nhấn “Kiểm tra”. Lần kiểm tra đầu tiên khóa câu trả lời của câu đó và mới hiển thị đúng/sai, đáp án, giải thích.
3. Có thể bỏ qua tạm thời; muốn kết thúc khi còn câu trống phải xác nhận. Câu bỏ trống được tính sai.
4. Điểm = số câu đúng / tổng số câu × 100; các câu có trọng số bằng nhau. Hiển thị một chữ số thập phân; xét đạt bằng tỷ lệ gốc, không dùng điểm đã làm tròn.
5. Phản hồi từng câu không tự hoàn thành bài. Khi kết thúc lượt, lưu kết quả tổng, cập nhật hoàn thành bài và danh sách câu sai; cho xem đáp án/giải thích toàn bộ câu, kể cả câu bỏ trống. Lượt đã hủy không tính vào tiến độ hoặc danh sách câu sai.
6. Làm lại toàn quiz tạo lượt mới. “Luyện câu sai” dùng FR-06; không thay điểm lượt cũ và không thay thế điều kiện đạt quiz.
7. Câu đã kiểm tra được lưu ngay. Thoát rồi quay lại tiếp tục từ dữ liệu đã được xác nhận lưu; phần đang gõ chưa gửi có thể mất và phải được giải thích trên giao diện.

**Chấm điền từ:** Chuẩn hóa Unicode, bỏ khoảng trắng hai đầu, gộp khoảng trắng liên tiếp, không phân biệt hoa/thường rồi so khớp với danh sách đáp án hợp lệ do Editor nhập. Không tự bỏ dấu câu, sửa chính tả, đổi dạng từ hoặc suy luận từ đồng nghĩa. Ví dụ `  Good   morning ` khớp `good morning`; `it's` và `it is` chỉ cùng được chấp nhận nếu đều được biên soạn là đáp án đúng.

**Nghiệm thu:** Câu đã kiểm tra không đổi được điểm trong lượt; bộ 10 câu đúng 7 câu đạt 70%; câu trống tính sai; tiếp tục lượt dở giữ câu đã gửi; khi lượt chưa kết thúc, không lấy được đáp án câu chưa kiểm tra qua dữ liệu dành cho người học.

### FR-04 Flashcard cá nhân

- MVP có một bộ thẻ mặc định; lọc theo chủ đề nguồn, thẻ mới, đến hạn hoặc tất cả. Người học không phải tạo bộ trước khi lưu từ.
- Lưu từ trong bài tạo bản sao từ/nghĩa/ví dụ và liên kết nguồn. Một người lưu lại cùng mục từ nguồn không tạo thẻ thứ hai; hai mục từ khác nghĩa có thể có thẻ riêng.
- Cho tạo thẻ thủ công với từ và nghĩa bắt buộc, ví dụ tùy chọn. Khi từ trùng trong bộ cá nhân, cảnh báo nhưng cho phép lưu nếu người học muốn giữ nghĩa khác.
- Thẻ có mặt trước là từ, mặt sau là nghĩa/ví dụ/phiên âm/audio nếu có. Người học phải lật thẻ mới chọn “Nhớ” hoặc “Chưa nhớ”.
- Cho sửa nội dung bản sao cá nhân, không sửa dữ liệu chung. Nếu sửa từ hoặc nghĩa, xác nhận đưa thẻ về trạng thái mới và đến hạn ngay; sửa ví dụ không đổi lịch ôn.
- Cho xóa thẻ khỏi danh sách học sau xác nhận. Lịch sử ôn vẫn được giữ; thẻ đã xóa không còn được tính đến hạn. Lưu lại nguồn đó khôi phục một thẻ hoạt động, đặt thành thẻ mới và không mất lịch sử cũ.
- Sửa/ẩn bài nguồn không tự ghi đè hoặc xóa thẻ cá nhân. Nếu media nguồn không còn khả dụng, vẫn xem được nội dung chữ của thẻ.

**Nghiệm thu:** Lưu cùng mục từ hai lần chỉ có một thẻ hoạt động; sửa thẻ chỉ ảnh hưởng người sở hữu; xóa rồi lưu lại không tạo hai thẻ hoạt động hoặc phục hồi lịch ôn cũ ngoài ý muốn.

### FR-05 Ôn flashcard theo lịch

Quy tắc đề xuất đơn giản, thống nhất trên web/mobile:

| Trạng thái trước đánh giá | Chọn Nhớ | Chọn Chưa nhớ |
|---|---|---|
| Thẻ mới hoặc đang ở bậc 0 | Chuyển bậc 1, ôn sau 1 ngày | Về bậc 0, ôn sau 1 ngày |
| Bậc 1 | Chuyển bậc 2, ôn sau 3 ngày | Về bậc 0, ôn sau 1 ngày |
| Bậc 2 | Chuyển bậc 3, ôn sau 7 ngày | Về bậc 0, ôn sau 1 ngày |
| Bậc 3 | Chuyển bậc 4, ôn sau 14 ngày | Về bậc 0, ôn sau 1 ngày |
| Bậc 4 | Giữ bậc 4, ôn sau 14 ngày | Về bậc 0, ôn sau 1 ngày |

- Thẻ mới đến hạn ngay. Một ngày trong thuật toán là 24 giờ từ thời điểm đánh giá được lưu; lưu thời điểm chuẩn và hiển thị theo múi giờ Asia/Ho_Chi_Minh. Đổi ngày lịch không tự làm thẻ đến hạn.
- “Thẻ mới” là chưa có đánh giá kể từ lần tạo/đặt lại gần nhất. “Thẻ đến hạn” trên màn hình là thẻ đã từng được đánh giá và đến giờ ôn; hai bộ đếm không trùng nhau.
- Một phiên lấy tối đa 20 thẻ: thẻ đã học quá hạn/đến hạn trước, sắp hạn cũ nhất trước; sau đó thẻ mới theo thời điểm tạo. Nếu còn thẻ, được bắt đầu phiên kế tiếp.
- Danh sách phiên được cố định khi bắt đầu. Mỗi thẻ được đánh giá tối đa một lần trong phiên; Chưa nhớ không đưa thẻ lặp lại ngay trong phiên MVP.
- Chỉ đánh giá được xác nhận lưu mới thay đổi lịch. Thẻ xem mà chưa đánh giá không đổi lịch. Thoát giữa phiên giữ các đánh giá đã lưu, quay lại tiếp tục các thẻ còn lại.
- Mỗi người chỉ có một phiên ôn đang mở, dùng chung web/mobile. Thẻ bị xóa hoặc đặt lại trong lúc phiên đang mở được bỏ khỏi lượt hiện tại; giải thích lý do, thẻ đặt lại sẽ xuất hiện ở phiên sau.
- Gửi lặp một đánh giá không tăng bậc nhiều lần. Hai thiết bị cùng đánh giá một lượt thẻ chỉ chấp nhận kết quả đầu tiên đã lưu; thiết bị còn lại tải lại trạng thái.
- Có thể xem/lật thẻ ngoài phiên để tra cứu, nhưng không đổi lịch. Tự đánh giá không được gọi là điểm năng lực.

**Nghiệm thu:** Thẻ mới được Nhớ tại 10:00 ngày 1 đến hạn 10:00 ngày 2; Nhớ tiếp khi ôn tại 11:00 ngày 2 đến hạn 11:00 ngày 5; Chưa nhớ đặt lại bậc và hẹn sau 24 giờ; gửi lặp không tăng bậc hai lần; sau bậc 4 vẫn ôn mỗi 14 ngày.

### FR-06 Ôn câu hỏi từng làm sai

- Khi kết thúc quiz hoặc nộp kiểm tra, mỗi câu sai/câu trống vào danh sách cần ôn, kèm bài/chủ đề, giải thích và phiên bản câu hỏi đã làm sai.
- Một người chỉ có một mục đang chờ cho cùng câu hỏi. Sai lại cập nhật lần sai gần nhất và phiên bản tương ứng, không thêm mục trùng.
- Một lượt ôn gồm tối đa 10 câu, ưu tiên câu có lần sai gần nhất xa nhất về trước; có thể lọc theo chủ đề. Danh sách được cố định khi bắt đầu; thoát giữ các câu đã gửi.
- Trả lời và nhận giải thích từng câu. Đúng trong lượt ôn mới thì bỏ khỏi danh sách chờ; sai vẫn giữ, không bắt trả lời lại ngay trong cùng lượt.
- Trả lời đúng trong một quiz/kiểm tra khác không tự xóa mục đang chờ; chỉ lượt ôn chuyên biệt xử lý danh sách này. Làm sai lại sau khi đã ôn xong sẽ đưa câu trở lại.
- Lượt ôn không sửa điểm hoặc trạng thái hoàn thành của quiz/kiểm tra nguồn. Không hẹn lịch lặp theo ngày cho câu sai trong MVP.
- Câu đã sửa vẫn ôn được bằng bản chụp của lần sai, có nhãn phiên bản cũ. Nếu câu/bài bị ẩn hoặc bị đánh dấu không còn hợp lệ, bỏ khỏi danh sách ôn đang hoạt động và không gán là đã trả lời đúng; lịch sử vẫn còn.
- Nếu phát sinh lần sai mới trong lúc đang ôn ở thiết bị khác, kết quả của lượt ôn cũ không xóa mục chờ của lần sai mới; thông báo danh sách đã thay đổi.

**Nghiệm thu:** Sai cùng câu nhiều lần chỉ có một mục; ôn đúng bỏ khỏi danh sách; làm sai lại đưa trở lại; câu bị ẩn không được cấp vào lượt ôn mới; điểm lượt làm gốc không đổi.

### FR-07 Kiểm tra cuối chủ đề

- Mỗi chủ đề có một đề đang xuất bản gồm 10–20 câu trắc nghiệm/điền từ, liên kết tới các bài trong chủ đề. Bộ dữ liệu nghiệm thu dùng 10 câu mỗi đề.
- Có thể bắt đầu khi đã mở ít nhất một bài trong chủ đề; không yêu cầu đã đạt tất cả quiz. Trước khi làm hiển thị số câu, ngưỡng đạt 70%, cách tính câu trống và quy tắc tiếp tục bài dở.
- Đề và thứ tự cố định theo phiên bản khi bắt đầu. Không giới hạn thời gian/lượt làm trong MVP; mỗi người chỉ có một lượt đang làm của cùng đề.
- Cho sửa đáp án và chuyển giữa các câu trước nộp. Đáp án được lưu khi chọn hoặc xác nhận nhập; giao diện phân biệt “Đang lưu”, “Đã lưu”, “Lưu thất bại”. Đóng ứng dụng chỉ bảo đảm giữ phần đã lưu.
- Khi nộp, hiển thị số câu chưa trả lời và yêu cầu xác nhận. Chấm toàn bài theo công thức FR-03; câu trống tính sai.
- Trước nộp không trả đáp án, giải thích hoặc transcript của tư liệu nghe trong đề qua giao diện hay dữ liệu dành cho người học. Tư liệu cần che transcript phải được biên soạn riêng, không trỏ tới transcript public của bài học.
- Sau nộp hiển thị điểm, Đạt/Chưa đạt, từng câu trả lời, đáp án, giải thích và các bài liên quan đến câu sai. Bài gợi ý không lặp nếu nhiều câu sai cùng liên quan một bài.
- Làm lại tạo lượt mới. Nếu có lượt dở, cho tiếp tục hoặc xác nhận hủy để tạo lượt mới. Lượt hủy không có điểm, không đưa câu vào danh sách sai và không tính thống kê hoàn thành.
- “Đạt kiểm tra chủ đề” là có ít nhất một lượt kiểm tra đạt 70%. “Hoàn thành chủ đề” cần tất cả bài hiện đang xuất bản trong chủ đề đã hoàn thành và kiểm tra chủ đề đã đạt.

**Nghiệm thu:** Không xem được đáp án trước nộp; 7/10 câu đúng được Đạt; có thể tiếp tục đáp án đã lưu trên thiết bị khác; nộp lặp chỉ có một kết quả; đạt kiểm tra nhưng chưa xong bài chưa được ghi hoàn thành chủ đề.

### FR-08 Tiến độ và lịch sử

- Hiển thị bài gần nhất, trạng thái từng bài, số bài hoàn thành/tổng bài, phần trăm tiến độ theo chủ đề/lộ trình, trạng thái kiểm tra chủ đề, số thẻ mới/đến hạn và số câu cần ôn.
- Tiến độ bài = số bài đã hoàn thành còn đang xuất bản / tổng bài đang xuất bản × 100; hiển thị làm tròn đến số nguyên. Không có bài thì hiển thị “Chưa có nội dung”, không hiển thị 100%.
- Chỉ ghi hoàn thành lộ trình khi mọi chủ đề đang xuất bản đã hoàn thành. Học hết bài nhưng chưa đạt kiểm tra được ghi rõ “Đã hoàn thành bài học, còn kiểm tra chủ đề”.
- Điểm cao nhất dùng xác định đã đạt; điểm gần nhất thể hiện kết quả lần gần đây. Lịch sử liệt kê từng lượt hoàn tất và có trang xem chi tiết; lượt đang làm/hủy hiển thị riêng với nhãn tương ứng, không có điểm tổng kết.
- Xem lại bài đã hoàn thành không tăng số bài hoàn thành. Nội dung mới xuất bản làm tăng mẫu số tiến độ; ẩn bài làm giảm mẫu số. Thông báo khi cấu trúc thay đổi; lịch sử và kết quả hoàn thành từng bài trước đó vẫn được giữ.
- Thay đổi câu hỏi không chấm lại lượt cũ. Kết quả lịch sử dùng nội dung tại thời điểm làm bài và có nhãn nội dung cũ nếu cần.
- Dữ liệu đã lưu trên web phải thấy trên mobile khi mở/tải lại màn hình và ngược lại. Không yêu cầu cập nhật trực tiếp khi màn hình đang mở hoặc làm bài khi mất mạng.
- Tiếp tục lượt đang làm từ thiết bị khác dùng trạng thái mới nhất. Nếu hai thiết bị cùng sửa/nộp, yêu cầu cũ không được âm thầm ghi đè dữ liệu mới; trả thông báo và cho tải lại.

**Nghiệm thu:** Hoàn thành 2/3 bài hiển thị 67%; làm lại không tăng lên 3/3; thêm bài thứ tư thành 50% và có thông báo; dữ liệu vừa lưu xem được sau khi tải lại trên thiết bị khác; người khác không đọc được lịch sử.

### FR-10 Gợi ý học hôm nay

MVP dùng một màn hình tổng hợp từ dữ liệu hiện có, không tạo thêm điểm, lịch ôn hoặc kết quả học độc lập:

1. Hiển thị thẻ đến hạn và thẻ mới với nút bắt đầu/tiếp tục ôn.
2. Hiển thị câu sai đang cần luyện, dẫn đến FR-06.
3. Hiển thị bài nên tiếp tục theo FR-01; nếu học hết bài thì gợi ý kiểm tra chủ đề chưa đạt, sau đó ôn tập.

Người học được chọn hoạt động bất kỳ, không bị ép thực hiện theo thứ tự. Người mới chưa chọn lộ trình được dẫn tới chọn lộ trình; chưa có thẻ/câu sai thì hiển thị trạng thái trống phù hợp. Thẻ/câu mới và trạng thái bài cập nhật khi tải lại màn hình. Không có chỉ tiêu “hoàn thành phiên hôm nay” trong MVP.

**Nghiệm thu:** Dữ liệu thẻ/câu sai khớp với màn hình ôn; người mới có hành động bắt đầu học; người đã hoàn thành toàn bộ nội dung vẫn có đường dẫn ôn tập. Phiên học hằng ngày đầy đủ trong bản 0.1 được thu gọn thành màn hình này theo đề xuất 0.2.

## 6. Chức năng mở rộng chưa tính vào nghiệm thu MVP

### FR-09 Mục tiêu hằng ngày và chuỗi ngày học

Nếu chọn triển khai: đặt mục tiêu theo số thẻ đã ôn hoặc số quiz hoàn tất, tính theo ngày Asia/Ho_Chi_Minh. Chỉ đánh giá thẻ đã lưu và lượt quiz hoàn tất mới được tính; mở ứng dụng không tính là học. Chuỗi ngày tăng khi có hoạt động hợp lệ trong ngày; không tính lặp một sự kiện. Cần bổ sung quy tắc đổi mục tiêu giữa ngày trước khi đưa vào phạm vi chính thức.

### FR-11 Nghe chép chính tả

Nếu chọn triển khai: câu ngắn có audio/transcript, người học nghe rồi nhập lại, nộp mới thấy transcript và từ thiếu/thừa/sai. Giữ lịch sử từng lần thử. Cần đặc tả riêng cách so khớp dấu câu, từ viết tắt, đáp án tương đương, tính điểm và liên kết danh sách câu sai; chưa mặc định dùng AI hay nhận diện giọng nói.

Hai chức năng này được giữ để theo dõi định hướng, không xem là đã hoàn thiện đặc tả hoặc bắt buộc cho bản MVP hiện tại.

## 7. Quản lý nội dung trên Web Admin

### CMS-01 Lộ trình và chủ đề

Người có quyền biên soạn tạo/sửa tên, mô tả, mục tiêu, trình độ, thứ tự lộ trình/chủ đề/bài. Một chủ đề thuộc một lộ trình; một bài thuộc một chủ đề trong MVP. Cho tìm kiếm theo tên, lọc trạng thái và sắp thứ tự; không cần tái sử dụng một bài trong nhiều lộ trình.

Lộ trình hoặc chủ đề chưa có nội dung học hợp lệ không được xuất bản cho người học. Ẩn lộ trình/chủ đề làm nội dung con không còn được mở mới dù trạng thái riêng của nội dung con chưa đổi. Lưu lại lịch sử; không xóa dây chuyền kết quả người học. Khôi phục chỉ hiển thị lại các nội dung con vốn đã xuất bản, không tự xuất bản bài nháp.

**Nghiệm thu:** Thay thứ tự phản ánh đúng ở giao diện người học; nội dung dưới chủ đề ẩn không truy cập trực tiếp được; khôi phục chủ đề không làm lộ bài nháp.

### CMS-02 Soạn bài và xuất bản

- Form soạn bài hỗ trợ các khối văn bản, từ vựng, đoạn đọc và audio/transcript; thêm/xóa/sắp thứ tự, xem trước như người học. Chưa yêu cầu trình kéo thả tự do, video hoặc nội dung nhúng từ bên ngoài.
- Có Nháp, Đã xuất bản và Đã ẩn. Người biên soạn lưu nháp; người có quyền xuất bản mới được xuất bản/ẩn. Editor không có quyền xuất bản gửi bài chờ người có quyền kiểm tra qua danh sách nội dung.
- Chặn xuất bản nếu thiếu tên/mục tiêu/nội dung, quiz hợp lệ, đáp án/giải thích hoặc audio/transcript bắt buộc. Thông báo cụ thể phần cần bổ sung.
- Sửa nội dung đã xuất bản tạo bản nháp mới; người học tiếp tục thấy bản đang xuất bản cho đến khi bản sửa được xuất bản. Bản nháp mới không có đường dẫn public.
- Lượt quiz/kiểm tra đang làm giữ nội dung đã được cố định khi bắt đầu; xuất bản bản sửa không thay câu hay điểm của lượt đó. Lượt mới dùng phiên bản mới.
- Nếu ẩn bài/đề/câu hoặc chủ đề/lộ trình chứa chúng, không cho mở lượt mới; lượt đang làm chịu ảnh hưởng phải dừng với thông báo, giữ phần đã lưu ở lịch sử dưới trạng thái hủy do nội dung không còn khả dụng, không chấm điểm.
- Chỉ xóa hẳn bản nháp chưa từng được xuất bản và không được nội dung khác tham chiếu. Nội dung từng xuất bản dùng thao tác ẩn; kết quả lịch sử không biến mất.
- Ghi nhận ai sửa, ai xuất bản/ẩn và thời điểm. MVP không cần quy trình duyệt nhiều cấp hoặc khôi phục tùy ý mọi bản nháp.

**Nghiệm thu:** Bản nháp không lộ cho người học; sửa chưa xuất bản không đổi bài hiện hành; lượt cũ giữ nội dung/đáp án cũ; ẩn nội dung không làm mất lịch sử và có xử lý rõ lượt dở.

### CMS-03 Câu hỏi quiz và kiểm tra

Form nhập câu hỏi có loại câu, đề bài, các lựa chọn hoặc danh sách đáp án hợp lệ, giải thích và bài liên quan. Trắc nghiệm có 2–4 lựa chọn, đúng một đáp án đúng; điền từ có ít nhất một đáp án hợp lệ. Các lựa chọn trắc nghiệm không được trùng nhau sau chuẩn hóa khoảng trắng/hoa thường.

Người biên soạn gán câu vào quiz hoặc kiểm tra, sắp thứ tự và xem trước. Kiểm tra cuối chủ đề chỉ dùng câu gắn với bài thuộc chủ đề đó; không dùng lại cùng câu hoặc nguyên nội dung câu quiz trong cùng chủ đề. Hệ thống chặn trùng mã câu; người duyệt kiểm tra thêm trùng nội dung, tính đúng đáp án và độ phù hợp.

Nội dung chứa đáp án/giải thích/transcript kiểm tra phải được tách khỏi phần dữ liệu được phép xem trước khi làm. Khi sửa đáp án đã có lịch sử, tạo phiên bản mới, không ghi đè kết quả cũ. Có thể đánh dấu câu không còn hợp lệ để loại khỏi hoạt động mới; đề thiếu số câu hợp lệ phải bị chặn mở lượt mới và hiện lý do trong Web Admin.

**Nghiệm thu:** Không xuất bản câu thiếu đáp án hoặc có nhiều đáp án đúng với loại một lựa chọn; câu sai chủ đề không đưa vào đề; sửa đáp án không làm đổi điểm lịch sử.

### CMS-04 Từ vựng và media

Quản lý từ, nghĩa, ví dụ, phiên âm, audio và nguồn nội dung. Media audio MVP nhận MP3/M4A tối đa 10 MB mỗi tệp; kiểm tra định dạng thực tế và thử phát trên web/mobile. Audio dùng cho hoạt động nghe phải có transcript được rà soát tương ứng.

Không cho xóa tệp đang được nội dung còn hiệu lực tham chiếu. Khi thay audio cho câu hỏi, giữ được tư liệu của lượt cũ hoặc đánh dấu rõ không còn phát được; không thay âm thanh lịch sử bằng tệp có nội dung khác. Xem trước tệp lỗi và tệp vượt giới hạn phải có thông báo cụ thể.

**Nghiệm thu:** Tệp sai loại/quá dung lượng bị từ chối; audio xuất bản phát được trên hai nền tảng; thẻ và lịch sử vẫn đọc được khi media không còn khả dụng.

## 8. Quản trị tài khoản quyền và thống kê

### ADM-01 Quản lý học viên

Administrator hoặc Editor có quyền quản lý học viên được tìm theo tên/email, lọc trạng thái, xem hồ sơ cơ bản, thêm học viên bằng lời mời qua email, khóa/mở khóa và vô hiệu hóa tài khoản. Người được mời tự đặt mật khẩu; giao diện quản trị không hiển thị mật khẩu hoặc liên kết bí mật cho người không có quyền.

Khóa/vô hiệu hóa không xóa lịch sử, không đổi điểm và không tự tạo tài khoản thay thế. MVP thay “xóa tài khoản” trong đề cương bằng vô hiệu hóa; việc thay đổi này nằm trong danh sách cần xác nhận. Quản trị không sửa câu trả lời, tự tăng điểm, đăng nhập thay người học hoặc xem mật khẩu. Không có trạng thái VIP trong MVP đề xuất.

Quản trị được xem số bài hoàn thành và điểm kiểm tra tổng hợp của học viên khi có quyền quản lý học viên. Không có màn hình đọc toàn bộ thẻ riêng hoặc từng đáp án cá nhân của người khác. Khóa và vô hiệu hóa có lý do nội bộ, người thao tác và thời điểm; mở lại không làm mất dữ liệu.

**Nghiệm thu:** Editor thiếu quyền bị từ chối cả khi truy cập trực tiếp; khóa học viên đang đăng nhập ngăn thao tác tiếp theo; mở lại giữ tiến độ; không thể dùng chức năng học viên để thay đổi Editor/Administrator.

### ADM-02 Quản lý Editor và cấp quyền

Chỉ Administrator được mời Editor, nâng người học thành Editor, đổi các quyền tại mục 3, khóa/mở Editor và thu hồi vai trò Editor. Thu hồi vai trò trả về người học nếu tài khoản vẫn hoạt động; khóa tài khoản chặn mọi quyền đăng nhập.

Không cho Editor tự cấp quyền hoặc sửa quyền Administrator. MVP không có giao diện tạo/nâng thêm Administrator; tài khoản quản trị khởi tạo được chuẩn bị khi triển khai. Không cho thao tác làm mất quyền hoặc khóa Administrator hoạt động cuối cùng. Ghi lại người cấp/thu hồi quyền và thời điểm; thay đổi quyền có hiệu lực từ yêu cầu được bảo vệ tiếp theo.

**Nghiệm thu:** Editor có quyền biên soạn nhưng thiếu quyền xuất bản không xuất bản được; cấp/thu hồi quyền được áp dụng với phiên đang mở; không tự nâng quyền bằng cách sửa hồ sơ/yêu cầu gửi lên.

### ADM-03 Thống kê và tìm kiếm

Trang tổng quan có các chỉ số được định nghĩa thống nhất:

| Chỉ số | Cách tính |
|---|---|
| Học viên | Số tài khoản vai trò người học, tách hoạt động/khóa/chưa xác minh |
| Nội dung | Số lộ trình, chủ đề, bài theo trạng thái; không tính phiên bản nháp sửa như bài mới |
| Người học có hoạt động | Số tài khoản vai trò người học duy nhất có quiz/kiểm tra hoàn tất hoặc đánh giá thẻ đã lưu trong khoảng ngày |
| Lượt làm | Số quiz và kiểm tra hoàn tất, tách hai loại; không tính lượt dở/hủy hoặc lượt ôn câu sai |
| Điểm trung bình | Trung bình điểm các lượt hoàn tất trong khoảng ngày, tách quiz và kiểm tra; mỗi lượt được tính một lần |
| Bài được học nhiều | Số người duy nhất đã mở bài có đăng nhập trong khoảng ngày; loại lượt khách và tải lại lặp |

Lọc thời gian theo ngày Asia/Ho_Chi_Minh, hiển thị khoảng lọc đang áp dụng. Dữ liệu trống hiển thị 0 hoặc “Chưa có dữ liệu”, không chia cho 0. Có bảng số liệu và một biểu đồ hoạt động theo ngày; chưa yêu cầu xuất Excel hay báo cáo tùy biến.

Tìm kiếm theo tên bài/chủ đề/lộ trình; tìm tài khoản theo tên/email trong phạm vi quyền. Danh sách có phân trang 20 mục và trạng thái không có kết quả. Editor không có quyền quản lý Editor thì không tìm được danh sách Editor.

**Nghiệm thu:** Bộ dữ liệu có hai lượt quiz của cùng người được tính hai lượt làm nhưng một người hoạt động; gửi lặp không làm tăng thống kê; lọc ngày và quyền cho cùng kết quả ở bảng và biểu đồ.

## 9. Quy tắc dùng chung và chất lượng sản phẩm

### 9.1. Quy tắc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| BR-01 | Tự đánh giá flashcard không phải điểm năng lực |
| BR-02 | Làm lại tạo lượt mới; lịch sử lượt cũ không bị ghi đè |
| BR-03 | Quiz phản hồi câu đã kiểm tra, mở toàn bộ giải thích khi kết thúc lượt; kiểm tra chủ đề trả kết quả sau nộp toàn bài |
| BR-04 | Điểm và trạng thái đạt được xác định phía hệ thống, không tin điểm do giao diện gửi lên |
| BR-05 | Không trả đáp án/giải thích/transcript bị hạn chế trước thời điểm được xem |
| BR-06 | Chỉ chủ sở hữu truy cập dữ liệu học cá nhân; quản trị chỉ xem đúng phạm vi mô tả tại mục 8 |
| BR-07 | Nội dung được chụp theo phiên bản khi bắt đầu làm; thay đổi nội dung không sửa lịch sử |
| BR-08 | Gửi lặp cùng thao tác chỉ có một hiệu lực; nếu cùng mã thao tác nhưng nội dung khác thì từ chối, không ghi đè; kết quả nộp, tiến độ và câu sai phải nhất quán |
| BR-09 | Nháp không public; ẩn nội dung không xóa lịch sử |
| BR-10 | Hoàn thành bài, đạt kiểm tra, hoàn thành chủ đề/lộ trình và ngày có hoạt động là các khái niệm riêng |
| BR-11 | Với hai thiết bị thao tác cùng lượt, thay đổi cũ không âm thầm ghi đè kết quả mới |
| BR-12 | Nộp bài chỉ được báo thành công khi đã lưu kết quả cùng các thay đổi tiến độ và câu sai cần thiết; nếu bị gián đoạn, thử lại cùng thao tác không tạo lượt mới |

### 9.2. Trạng thái và lỗi bắt buộc trên giao diện

Mọi màn hình tải dữ liệu phải có trạng thái đang tải, trống và lỗi có thể thử lại. Thao tác lưu/nộp hiển thị rõ đang xử lý, thành công hay thất bại. Khi mạng mất sau khi gửi nhưng chưa nhận phản hồi, hiển thị “Chưa xác nhận được kết quả”, kiểm tra trạng thái đã lưu hoặc cho thử lại cùng thao tác; không báo chắc chắn thất bại rồi tự tạo lượt mới.

Đối với đề đã nộp, không nhận thêm sửa đáp án. Nộp trùng trả lại kết quả đã lưu; sửa trên thiết bị có dữ liệu cũ yêu cầu tải lại. Nếu tài khoản mất quyền hoặc nội dung bị ẩn trong lúc sử dụng, dừng thao tác có liên quan với lý do rõ ràng và giữ dữ liệu đã lưu trước đó.

### 9.3. Yêu cầu chất lượng kèm nghiệm thu

| Mã | Yêu cầu |
|---|---|
| NFR-01 | Phạm vi 20–100 tài khoản; tải đồng thời và ngưỡng hiệu năng cần chốt riêng trước khi tuyên bố năng lực phục vụ, không suy ra từ số tài khoản |
| NFR-02 | Web Admin, Web người học và mobile kết nối hệ thống đã triển khai; dữ liệu lưu thật, không chỉ chạy bằng dữ liệu giả trên giao diện |
| NFR-03 | Chi phí vận hành phải nằm trong ngân sách nhóm xác nhận; không mặc định trial/credits luôn đủ |
| NFR-04 | Kiểm tra phân quyền bằng truy cập trực tiếp, không chỉ ẩn nút; dữ liệu người A không truy cập được bằng phiên người B |
| NFR-05 | Lưu/nộp lỗi có phản hồi; không hiển thị thành công trước khi hệ thống xác nhận |
| NFR-06 | Không nhân đôi lượt làm, thẻ, tiến độ hay lịch ôn do nhấn hai lần hoặc gửi lại sau timeout |
| NFR-07 | Kiểm thử trên web desktop, web màn hình nhỏ và Android mục tiêu; bảng phiên bản trình duyệt/thiết bị thực tế được ghi vào tài liệu kiểm thử |
| NFR-08 | Có dữ liệu mẫu và hướng dẫn tạo lại môi trường để kiểm chứng chức năng |
| NFR-09 | Ghi log đủ tìm thao tác lỗi, không ghi mật khẩu, khóa bí mật, liên kết đặt lại hoặc nội dung cá nhân không cần thiết |
| NFR-10 | Môi trường public dùng HTTPS; khóa đặc quyền không xuất hiện trong web/mobile |
| NFR-11 | Có bản sao dữ liệu và đã thử khôi phục bộ dữ liệu demo; việc ẩn nội dung không được xem là cơ chế sao lưu |

Các giới hạn vận hành chưa xác định không cản việc đặc tả chức năng, nhưng phải được bổ sung trước kiểm thử hiệu năng và nghiệm thu triển khai thực tế.

## 10. Kịch bản nghiệm thu sản phẩm

Các mã AT-01–15 được giữ để đối chiếu bản 0.1; AT-11 điều chỉnh theo FR-10 rút gọn. AT-12/13 chỉ dùng nếu chọn phần mở rộng. Mỗi ca phải ghi dữ liệu đầu vào, thao tác, kết quả thực tế và bằng chứng; không đánh dấu đạt chỉ vì đã có màn hình.

| Mã | Kịch bản | Kết quả phải đạt | Liên quan |
|---|---|---|---|
| AT-01 | Người mới chọn lộ trình, mở bài, làm quiz đạt ngưỡng | Chưa học → Đang học → Hoàn thành; gợi ý bài tiếp theo đúng | FR-01, FR-02, FR-08 |
| AT-02 | Quiz có trắc nghiệm, điền từ, câu sai và câu trống | Chấm đúng theo chuẩn hóa; trong lượt chỉ câu đã kiểm tra được xem giải thích; kết thúc mở toàn bộ giải thích và tính đúng điểm | FR-03 |
| AT-03 | Lưu từ hai lần, tạo/sửa/xóa thẻ riêng | Không trùng thẻ nguồn; chỉ sửa dữ liệu cá nhân; đặt lại lịch đúng khi đổi từ/nghĩa | FR-04 |
| AT-04 | Điều khiển thời gian qua các bậc ôn và gửi lặp đánh giá | Hạn ôn khớp bảng FR-05; không tăng bậc hai lần; giữ mốc 14 ngày ở bậc cuối | FR-05 |
| AT-05 | Làm sai, ôn đúng, làm sai lại cùng câu | Một mục đang chờ; ôn đúng bỏ mục; sai mới đưa trở lại; không sửa điểm cũ | FR-06 |
| AT-06 | Yêu cầu đáp án kiểm tra trước/sau nộp, nộp có câu trống | Trước nộp không lộ đáp án/transcript; sau nộp chấm đúng và gợi ý bài không trùng | FR-07, BR-05 |
| AT-07 | Lưu câu trả lời/tiến độ trên web, tiếp tục mobile | Tải lại nhận dữ liệu đã lưu; không tạo lượt mới ngoài ý muốn | FR-03, FR-07, FR-08 |
| AT-08 | Người A truy cập dữ liệu B; Editor thử thao tác vượt quyền | Từ chối đọc/sửa; không lộ dữ liệu; không chỉ dựa vào việc ẩn nút | AUTH-04, ADM-01–02, NFR-04 |
| AT-09 | Timeout sau gửi, nhấn nộp hai lần và thao tác từ hai thiết bị | Một kết quả; không nhân đôi lịch ôn/câu sai; dữ liệu cũ không ghi đè dữ liệu mới | BR-08, BR-11, BR-12 |
| AT-10 | Lưu nháp, xuất bản, sửa đáp án rồi ẩn nội dung đã có lượt làm | Nháp không public; lịch sử giữ nguyên; lượt dở xử lý theo CMS-02 | CMS-01–03, BR-07, BR-09 |
| AT-11 | Mở Học hôm nay với người mới, có dữ liệu ôn và học hết bài | Có hành động phù hợp; bộ đếm khớp; không tạo kết quả học độc lập | FR-10 |
| AT-12 | Dictation đúng/thiếu/thừa từ | Theo đặc tả bổ sung; chưa thuộc MVP | FR-11, P1 |
| AT-13 | Đổi ngày và hoàn thành mục tiêu học | Theo đặc tả bổ sung; chưa thuộc MVP | FR-09, P1 |
| AT-14 | Audio lỗi, mất mạng khi nộp, email gửi lỗi | Thông báo rõ; thử lại đúng thao tác; không báo thành công giả | FR-02, AUTH-01, AUTH-03, NFR-05 |
| AT-15 | Chạy toàn bộ luồng chính trên hệ thống đã triển khai | Web Admin, web và app hoạt động với cùng dữ liệu; tải thử theo ngưỡng được xác nhận riêng | NFR-01–02, NFR-07 |
| AT-16 | Đăng ký trùng, chưa xác minh, liên kết hết hạn, quên mật khẩu | Không trùng tài khoản; chưa xác minh không học có lưu; phục hồi được; liên kết dùng rồi không dùng lại | AUTH-01–03 |
| AT-17 | Đăng xuất, khóa tài khoản đang mở, thu hồi quyền Editor | Phiên/khả năng truy cập bị chặn đúng phạm vi từ yêu cầu tiếp theo | AUTH-02, ADM-01–02 |
| AT-18 | Khách mở bài học thử và truy cập trực tiếp bài khác | Chỉ xem đúng nội dung cho phép; không lưu tiến độ hoặc lấy đáp án | GUEST-01 |
| AT-19 | Làm lại điểm thấp, đạt kiểm tra nhưng chưa đủ bài, thêm/ẩn bài | Phân biệt điểm gần nhất/cao nhất; không mất kết quả cũ; tiến độ và trạng thái chủ đề tính đúng | FR-01, FR-07–08 |
| AT-20 | Lọc thống kê với lượt lặp, lượt hủy và ranh giới ngày | Bộ đếm/bảng/biểu đồ đúng công thức; không tính dữ liệu không đủ điều kiện | ADM-03 |
| AT-21 | Nhập câu thiếu đáp án, media lỗi và xuất bản sai quyền | Chặn với lý do cụ thể; người học không thấy dữ liệu chưa hợp lệ | CMS-02–04, ADM-02 |
| AT-22 | Khôi phục bộ dữ liệu demo rồi chạy lại luồng chính | Có lại nội dung, tài khoản thử và dữ liệu học cần thiết; hướng dẫn dùng được | NFR-08, NFR-11 |
| AT-23 | Người mới đăng nhập Google rồi đăng xuất/đăng nhập lại | Một hồ sơ Người học; không bắt tạo mật khẩu; tên tự sửa và dữ liệu học được giữ | AUTH-02, AUTH-04–05 |
| AT-24 | Google trùng email đã xác minh; Google trước rồi đặt mật khẩu ứng dụng | Dùng cùng định danh và tiến độ; không tạo hồ sơ thứ hai; không thay mật khẩu Google | AUTH-01, AUTH-03, AUTH-05 |
| AT-25 | Hủy Google, callback lỗi/lặp, liên kết tới trang ngoài | Không báo thành công giả, không tạo trùng; lỗi có thể phục hồi; không chuyển tới URL ngoài | AUTH-05, BR-08 |
| AT-26 | Người học/Editor bị khóa hoặc thu hồi quyền đăng nhập lại bằng Google | Giữ kiểm soát trạng thái và quyền; Google không mở khóa hay nâng quyền | AUTH-02, AUTH-05, ADM-01–02 |
| AT-27 | Tài khoản email chưa xác minh bị người khác đăng ký trước khi chủ email đăng nhập Google | Không chiếm quyền bằng mật khẩu/phiên cũ chưa được xác minh; không ghép hồ sơ thủ công theo email | AUTH-01, AUTH-05 |

### Luồng demo đầu cuối

1. Editor nhập bài, từ vựng và quiz; người có quyền kiểm tra rồi xuất bản.
2. Khách xem bài học thử; đăng ký/xác minh email hoặc chọn Tiếp tục với Google để vào tài khoản người học.
3. Người học chọn lộ trình, học bài, lưu từ và làm quiz có cả câu đúng/sai.
4. Mở Học hôm nay, ôn thẻ và luyện câu sai; thấy bộ đếm thay đổi đúng.
5. Làm kiểm tra chủ đề; xem điểm, giải thích và các bài cần ôn.
6. Đăng nhập cùng tài khoản trên mobile; thấy tiến độ và lịch sử đã lưu, tiếp tục hoạt động dở.
7. Administrator xem thống kê; kiểm tra Editor không có quyền thì không xuất bản được.

Luồng demo chứng minh giá trị sản phẩm; không thay thế các ca nghiệm thu lỗi, bảo mật, nội dung và thao tác đồng thời ở bảng trên.

## 11. Màn hình và điều kiện hoàn thành MVP

### 11.1. Danh sách màn hình

| Bề mặt | Màn hình cần có |
|---|---|
| Khách | Giới thiệu/danh mục, bài học thử, đăng ký, đăng nhập email/Google, xử lý callback Google, xác minh, quên/đặt lại mật khẩu |
| Người học web/mobile | Học hôm nay; danh sách/chi tiết lộ trình; bài học; làm/tiếp tục quiz; kết quả lượt làm; bộ thẻ; tạo/sửa thẻ; phiên ôn; danh sách/lượt ôn câu sai; làm/tiếp tục kiểm tra; tiến độ/lịch sử; bài yêu thích; hồ sơ |
| Web Admin | Tổng quan; danh sách/soạn lộ trình và chủ đề; danh sách/soạn/xem trước bài; câu hỏi/quiz/đề kiểm tra; từ vựng/media; học viên; Editor/phân quyền; lịch sử thao tác quản trị cần thiết |

Các màn hình có thể ghép hợp lý thành tab hoặc trang chi tiết; số dòng trong bảng không quy định số trang phải xây. Quyền và trạng thái dữ liệu vẫn phải giữ nguyên khi ghép giao diện.

### 11.2. Điều kiện coi MVP hoàn thành

- [ ] Phạm vi chức năng MVP và các thay đổi đề cương đã được nhóm thống nhất, giảng viên xác nhận những điểm liên quan.
- [ ] Toàn bộ AUTH, GUEST, FR-01–08, FR-10 rút gọn, CMS và ADM hoạt động theo tài liệu trên cả bề mặt được yêu cầu.
- [ ] Có bộ nội dung đủ mục 2.3 đã được rà soát, không dùng nội dung giữ chỗ trong demo.
- [ ] Các ca AT bắt buộc đạt; AT-12/13 không bắt buộc nếu chưa chọn P1. AT-15 có ghi rõ môi trường và giới hạn đã đo.
- [ ] Không còn lỗi làm mất/nhân đôi kết quả, lộ đáp án sớm, vượt quyền hoặc chặn chu trình học cốt lõi.
- [ ] Ba sản phẩm đã được triển khai, app cài và dùng được; có tài khoản thử theo vai trò và hướng dẫn demo.
- [ ] Có hướng dẫn dữ liệu mẫu, sao lưu/khôi phục, kiểm thử và vận hành theo yêu cầu học phần.

Các ô trên là điều kiện kiểm tra, chưa được thực hiện hoặc đánh dấu đạt trong lần cập nhật đặc tả này.

## 12. Những xác nhận còn cần thiết

Bản 0.2 đã đưa ra quy tắc mặc định để thay cho danh sách câu hỏi nghiệp vụ mở của bản 0.1. Những mặc định đó vẫn cần nhóm rà soát; chỉ ba nhóm xác nhận dưới đây còn ảnh hưởng đến phạm vi bàn giao bên ngoài:

| Mã | Nội dung cần xác nhận | Phương án đang được dùng trong bản đề xuất |
|---|---|---|
| CONF-01 | Giảng viên chấp nhận thay đổi đề cương đến mức nào | Hoãn thanh toán/VIP, bình luận, thông báo; dùng lộ trình nền tảng và kiểm tra chủ đề; xóa tài khoản bằng vô hiệu hóa; quyền Editor theo mục 3 |
| CONF-02 | Mobile cần bàn giao theo hình thức nào | Android cài được, dùng cùng hệ thống; đầy đủ chức năng người học MVP; chưa cam kết iOS hoặc phát hành lên cửa hàng |
| CONF-03 | Phạm vi và nguồn học liệu | Bộ 3 chủ đề/9 bài theo mục 2.3; nhóm chỉ định người biên soạn và người rà soát; kiểm tra quyền dùng học liệu/audio |

Ngoài ba nhóm trên, nhóm cần chốt ngân sách, môi trường hỗ trợ và tải thử trước khi nghiệm thu vận hành. Các việc này không được chuyển thành lịch triển khai trong tài liệu.

### Thay đổi so với đề cương gốc

| Nội dung gốc | Cách đáp ứng hoặc điều chỉnh trong MVP đề xuất |
|---|---|
| Đăng ký, đăng nhập, đăng xuất, sửa hồ sơ | AUTH-01–05; bổ sung xác minh, phục hồi tài khoản và đăng nhập Google trên web |
| Quản lý học viên và Editor | ADM-01–02; vô hiệu hóa/thu hồi quyền thay xóa hẳn; không có VIP |
| Quản lý/tìm kiếm danh mục và bài học | CMS-01–04; danh mục thể hiện bằng lộ trình/chủ đề |
| Tìm học viên/Editor và cấp quyền | ADM-01–03; tìm trong phạm vi quyền, Editor không quản lý Editor |
| Nhắc học email và thông báo trong hệ thống | Đề nghị hoãn; màn hình Học hôm nay không được xem là đã đáp ứng kênh thông báo/email |
| Thống kê | ADM-03 với chỉ số và công thức cụ thể |
| Thanh toán bài học online | Đề nghị hoãn; MVP chưa có thu tiền hay gói trả phí |
| Xem public không đăng ký | GUEST-01 với bài được đánh dấu học thử |
| Chọn level dễ/trung bình/khó | Đề nghị thay bằng chọn lộ trình; bản đầu có một lộ trình nền tảng, chưa đáp ứng đầy đủ ba level |
| Bình luận | Đề nghị hoãn |
| Lưu bài và quản lý danh sách đã lưu | FR-02: lưu/bỏ lưu và tìm bài yêu thích |
| Lịch sử bài học | FR-08, kèm trạng thái bài và lịch sử lượt làm |
| Kiểm tra sau mỗi level | Đề nghị đổi thành kiểm tra cuối chủ đề; chấm điểm và lịch sử tại FR-07 |

## 13. Nguồn và lịch sử tài liệu

- [Đề cương nhóm](NHOM_5.docx): danh sách chức năng gốc và ba vai trò Customer/Editor/Administrator.
- [Kế hoạch học phần](Kế%20hoạch%20PBL6_CNCNPM%202026_2027.docx): yêu cầu ba sản phẩm, triển khai thực tế và hồ sơ bàn giao.
- [SRS phiên bản 0.1](docs/archive/srs-v0.1.md): bản trước cập nhật, lưu để đối chiếu các quyết định và phạm vi ban đầu.
- [SRS phiên bản 0.2](docs/archive/srs-v0.2.md): bản trước khi bổ sung đăng nhập Google và kế hoạch web.
- [SRS phiên bản 0.3](docs/archive/srs-v0.3.md): bản trước khi ghi nhận quyết định database và migration.
- [Kế hoạch MVP web](web-mvp-plan.md): phạm vi, thứ tự triển khai và nghiệm thu riêng cho Web người học/Web Admin.
- [Thiết kế database](docs/database-design.md): mô hình dữ liệu theo service, phiên bản/snapshot, giao dịch, index, quyền, migration và các ca kiểm thử database dự kiến.

| Phiên bản | Thay đổi |
|---|---|
| 0.1 | Tổng hợp định hướng đã xác nhận, yêu cầu học tập dự kiến và các quyết định còn mở |
| 0.2 | Hoàn thiện yêu cầu chức năng MVP; bổ sung tài khoản/quyền/khách; làm rõ hoàn thành bài/chủ đề, chấm điểm, lịch ôn, tiếp tục lượt dở, hai thiết bị, nội dung thay đổi, CMS/Admin và nghiệm thu; thu gọn FR-10; giữ P1 riêng; không lập lịch phát triển |
| 0.3 | Bổ sung AUTH-05 đăng nhập Google cho MVP web, quy tắc dùng chung tài khoản/phiên/quyền và AT-23–27; làm rõ mật khẩu ứng dụng với tài khoản Google; liên kết kế hoạch web riêng, giữ phạm vi mobile của toàn sản phẩm |
| 0.4 | Ghi nhận DEC-13–18 về Supabase local/cloud, migration chung, ba schema, Auth/Storage và bảo toàn dữ liệu; liên kết tài liệu thiết kế database; giữ nguyên danh sách chức năng và các ca AT |
