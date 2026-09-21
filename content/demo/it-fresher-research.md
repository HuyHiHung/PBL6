# Tiếng Anh làm việc hằng ngày cho fresher IT

Ngày đối chiếu nguồn: **20/09/2026**. Đối tượng của đợt bổ sung này là fresher phát triển phần mềm trong nhóm dùng tiếng Anh, đặc biệt web/app; không đại diện cho mọi vị trí IT support, mạng hoặc an ninh. Các ưu tiên dưới đây là lựa chọn biên soạn dựa trên workflow và tài liệu sản phẩm, không phải thống kê tần suất từ thị trường tuyển dụng.

Bản học trực tiếp: [IT English — A Fresher's Workday](english-it-fresher.md). Nguồn có cấu trúc: [JSON](english-it-fresher.json). Bộ này tiếp nối [IT Vocabulary at Work](english-it.md), tăng độ cụ thể của giao tiếp thay vì chỉ học định nghĩa.

## Tình huống và sản phẩm người học cần tạo

| Bài | Tình huống làm việc | Thuật ngữ trọng tâm | Sản phẩm luyện tập |
|---|---|---|---|
| 1 | Ngày đầu chưa đủ quyền, setup chưa chạy | onboarding, repository, permission, credentials, dependencies, environment variable | Tin nhắn xin quyền có bối cảnh và bước tiếp theo |
| 2 | Nhận ticket còn thiếu yêu cầu | assignee, user story, acceptance criteria, scope, edge case, estimate | Câu hỏi làm rõ và ước lượng có điều kiện |
| 3 | Cập nhật tiến độ khi bị chặn | Sprint Goal, stand-up, blocker, ETA, remaining work | Cập nhật 45–60 giây và tin nhắn khi ETA có rủi ro |
| 4 | Nhờ mentor ở múi giờ khác | context, attempt, logs, stack trace, workaround, pair programming | Tin nhắn có việc đã thử, bằng chứng, câu hỏi, giờ hẹn |
| 5 | Chia sẻ thay đổi để review | branch, commit, push, PR, diff, base branch, merge conflict | PR description nêu lý do, phạm vi, kiểm thử và pending |
| 6 | Nhận góp ý và CI fail | reviewer, nit, suggestion, resolve, CI, status check, regression | Phản hồi review có thay đổi và trạng thái kiểm tra |
| 7 | API trả mã lỗi | endpoint, request, response, payload, authentication, authorization | Báo cáo có method/path, môi trường, role và kết quả |
| 8 | Bàn giao bản sửa để QA kiểm tra | staging, production, deployment, smoke test, rollback, known issue | Handoff có build, test result, giới hạn, owner và yêu cầu |

Lộ trình gợi ý: mỗi ngày một bài 20 phút; sau mỗi hai bài dành 10 phút kiểm tra chủ đề. Tổng **200 phút**, có thể chia thành tám buổi. Các bài tiếp nối ticket giả lập DEV-21; kiểm tra topic dùng DEV-30 và dữ kiện mới để người học vận dụng. Đây không phải quy trình bắt buộc của mọi công ty.

## Mẫu câu dùng ngay

| Mục đích | Mẫu tiếng Anh | Ý nghĩa/cách thay |
|---|---|---|
| Xin quyền | Could you check my access to the repository? | Nhờ kiểm tra quyền, nêu tên repo khi áp dụng |
| Làm rõ yêu cầu | What should happen when the search field is empty? | Hỏi hành vi ở trường hợp cụ thể |
| Xác nhận phạm vi | Just to confirm, sorting is outside this ticket, right? | Xác nhận lại điều đã hiểu |
| Báo bị chặn | I am blocked by missing staging access. | Chỉ rõ thứ đang ngăn tiến độ |
| Đưa ETA có điều kiện | I expect to finish by 3 p.m. if access is restored before noon. | Nêu dự kiến và giả định |
| Hẹn cập nhật | I will post another update at noon, even if the issue remains. | Tách mốc cập nhật khỏi mốc hoàn thành |
| Nhờ giúp sau khi đã thử | I checked the configuration, but the same error remains. What should I check next? | Việc đã thử → kết quả → câu hỏi |
| Hẹn trao đổi | Would 2 p.m. UTC+7 work for a ten-minute pairing session? | Có giờ, múi giờ và thời lượng |
| Xin review sớm | This is a draft PR. Could you review the approach first? | Nêu rõ đang làm và phạm vi muốn góp ý |
| Phản hồi review | I added the missing case. Tests pass, but the build check is still pending. | Nêu thay đổi và trạng thái thật |
| Báo quan sát | PATCH /courses/42 returns 403 for the viewer role on staging. | Không tự suy ra nguyên nhân ngoài dữ kiện |
| Bàn giao | Ready for QA on staging build 0.9. Please check the narrow-screen layout. | Chỉ rõ bản cần kiểm tra và việc muốn QA làm |

Các mẫu trên là nội dung tự biên soạn; thay ticket, thời gian và dữ kiện bằng tình huống được giao. Tránh dùng “It does not work” một mình: bổ sung môi trường, hành động, điều đã quan sát và việc đã thử. Khi không hiểu, câu “Could you give me an example?” hữu ích hơn việc xác nhận đã hiểu khi chưa rõ.

## Những cặp dễ nhầm

- **Dependency của phần mềm / dependency của công việc:** một bên là thành phần cần cho chương trình; một bên là điều kiện hoặc công việc khác cần trước khi tiếp tục.
- **Estimate / deadline:** estimate là dự tính; deadline là hạn yêu cầu. Hỏi lại khi hai mốc khác nhau. **ETA / next update:** dự kiến xong khác với thời điểm gửi cập nhật.
- **Acceptance criteria / Definition of Done:** tiêu chí riêng của một công việc khác với chuẩn chất lượng chung của Increment trong Scrum. Đối chiếu [Atlassian](https://www.atlassian.com/work-management/project-management/acceptance-criteria) và [Scrum Guide](https://scrumguides.org/scrum-guide.html).
- **Commit / push / merge / deploy:** ghi lịch sử Git → gửi thay đổi lên remote → tích hợp nhánh → đưa phiên bản lên môi trường. Những bước này không tự chứng minh các bước sau đã xảy ra. Xem [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow).
- **Authentication / authorization:** xác thực danh tính khác với xét quyền. Với mã HTTP, 401 liên quan thông tin xác thực hợp lệ, 403 là từ chối thực hiện; kiểm tra thêm hợp đồng API và ngữ cảnh thay vì đoán toàn bộ nguyên nhân từ mã. Xem [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status).
- **Observed result / root cause:** log và status code là bằng chứng quan sát; nguyên nhân cần kiểm chứng. **Workaround / fix:** cách đi tiếp tạm thời không đồng nghĩa nguyên nhân đã được sửa.
- **Staging / production:** môi trường kiểm tra trước phát hành khác môi trường phục vụ người dùng thật. **Passed local checks / ready for release:** phải báo đúng phạm vi đã kiểm tra và điều kiện còn chờ của nhóm.

## Đọc chữ viết tắt trong chat

Các cách dùng sau là hướng dẫn ngôn ngữ, không thay trạng thái chính thức của công cụ:

| Viết tắt | Cách hiểu thường gặp | Lưu ý khi phản hồi |
|---|---|---|
| PR | pull request | Nêu số/link PR trong công việc thực tế |
| WIP | work in progress | Đang làm; cần hỏi phần nào sẵn sàng review |
| LGTM | looks good to me | Lời nhận xét tích cực; kiểm tra approval/checks theo policy |
| FYI | for your information | Thường để biết; nếu cần hành động phải nói rõ |
| TBD | to be determined | Chưa chốt, không coi là đã có quyết định |
| EOD | end of day | Hỏi ngày, giờ và múi giờ cụ thể nếu cần phối hợp |
| OOO | out of office | Người đó vắng mặt; tìm người thay thế đã được chỉ định nếu cần |

## Nguồn nghiên cứu và phạm vi sử dụng

| Nguồn chính thức | Nội dung đối chiếu | Bài áp dụng |
|---|---|---|
| [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow) | Nhánh, commit/push, PR nháp, review, merge conflict | 5 |
| [GitHub — Forks](https://docs.github.com/en/pull-requests/reference/forks) | Repository riêng của fork khác với branch | 5 |
| [GitHub — Status checks](https://docs.github.com/en/pull-requests/reference/status-checks) | Check và yêu cầu merge có thể cấu hình | 6 |
| [GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions) | Workflow tự động và CI | 6 |
| [Scrum Guide, bản tháng 11/2020](https://scrumguides.org/scrum-guide.html) | Sprint Goal, mục đích và thời lượng Daily Scrum, Definition of Done | 2–3 |
| [MDN — HTTP status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) | Ý nghĩa HTTP 200, 401, 403, 404, 500 | 7 |
| [Atlassian — User stories](https://www.atlassian.com/agile/project-management/user-stories) | Nhu cầu người dùng và giá trị | 2 |
| [Atlassian — Acceptance criteria](https://www.atlassian.com/work-management/project-management/acceptance-criteria) | Tiêu chí cụ thể và kiểm chứng được | 2 |

Nguồn phục vụ kiểm tra khái niệm, không chứng nhận mức CEFR, độ phổ biến của tình huống hay chất lượng sư phạm. Hội thoại, ví dụ, ticket và câu hỏi được viết mới. Không sao chép nội dung trang thành bài đọc.

## Quy mô, kiểm tra và trạng thái

- 8 bài × 8 mục từ = 64 mục từ theo bài, 63 từ/cụm từ khác nhau.
- 8 quiz × 5 câu + 4 kiểm tra chủ đề × 10 câu = 80 câu: 48 trắc nghiệm, 32 điền từ.
- 8 hội thoại đọc phân vai; 8 hoạt động thực hành có mẫu và rubric 4 tiêu chí, mỗi tiêu chí 0–2 điểm. Rubric dùng tự chấm, không phải ngưỡng qua bài của DB.
- Bản Markdown có đáp án dành cho duyệt; chưa có audio. Không đưa nguyên JSON chứa đáp án vào frontend người học.
- Dùng validator chung để kiểm tra cấu trúc, key toàn cục, câu hỏi, tham chiếu bài đọc và số lượng. Lệnh kiểm tra: `node scripts/render-it-fresher-materials.mjs --check`.
- Bộ bổ trợ chưa import. Năm khóa đã import giữ nguyên nội dung nguồn và hash audit; không coi báo cáo audit cũ là phê duyệt cho bộ mới.

Hướng mở rộng sau bộ này: trao đổi trong refinement/retrospective; viết tài liệu README; hỏi–đáp với designer/BA; support ticket và bàn giao ca; báo sự cố với impact/timeline; giao tiếp về API contract và schema migration. Đây là đề xuất cho đợt sau, chưa tính vào 8 bài đã biên soạn.
