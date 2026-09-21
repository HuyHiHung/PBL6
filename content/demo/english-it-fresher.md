# IT English — A Fresher's Workday

Tiếng Anh cho fresher phần mềm: nhận quyền truy cập và ticket, cập nhật tiến độ, hỏi trợ giúp, viết PR, phản hồi review, báo lỗi API và bàn giao QA.

**Mức mục tiêu:** A2–B1 · **Thời lượng:** 200 phút.

**Quy mô:** 4 chủ đề, 8 bài, 64 mục từ/cụm từ theo bài và 80 câu hỏi.

**Mục tiêu:** Dùng 64 mục từ/cụm từ theo bài trong 8 tình huống làm việc; tạo tin nhắn, PR description và QA handoff có bối cảnh, bằng chứng, yêu cầu rõ; phân biệt quan sát với suy đoán.

> Bản dành cho người duyệt có đáp án. Chưa nhập CMS, không kèm audio. Hội thoại dùng để đọc phân vai; tình huống và số liệu là giả lập.

Biên soạn mới cho Sprout ngày 20/09/2026, dành cho fresher phát triển phần mềm trong nhóm dùng tiếng Anh. Gói bổ trợ nối tiếp IT English — Vocabulary at Work. Mức A2–B1 là mục tiêu ngôn ngữ, chưa được thẩm định độc lập. Nhân vật, ticket, API, giờ hẹn, chính sách review và dữ kiện kiểm thử đều giả lập để luyện ngôn ngữ; quy trình thực tế tùy nhóm. Chưa import DB; không thay đổi bản IT đã import. Thuật ngữ được đối chiếu tài liệu chính thức ở cuối gói, hội thoại và bài tập là nội dung tự biên soạn.

## Lộ trình

| Chủ đề | Các bài học | Thời lượng |
|---|---|---|
| [Joining a Team and Picking Up Work](#fresher-onboarding-tickets) | Day One: Access and Local Setup; Understanding a Ticket and Its Acceptance Criteria | 50 phút |
| [Daily Updates and Getting Unblocked](#fresher-daily-collaboration) | Daily Stand-up: Progress, Blockers, and ETA; Asking for Help in Chat and Across Time Zones | 50 phút |
| [Sharing Changes and Handling Feedback](#fresher-change-review) | From a Branch to a Clear Pull Request; Responding to Code Review and CI Results | 50 phút |
| [From API Evidence to QA Handoff](#fresher-api-qa-delivery) | Reporting an API Problem with Evidence; QA Handoff, Release Notes, and Known Issues | 50 phút |

## Cách học

1. Đọc từ, nghĩa và ví dụ; che nghĩa để nhớ từ rồi đổi chiều.
2. Đọc bài, trả lời yêu cầu và đọc hội thoại theo vai nếu có.
3. Thực hành nói/viết theo mẫu; tự kiểm bằng tiêu chí cuối hoạt động.
4. Làm quiz trước khi xem đáp án; thêm từ còn nhầm vào flashcard và ôn ở buổi tiếp theo.

Mỗi bài khoảng 20 phút, mỗi kiểm tra chủ đề khoảng 10 phút. Bài nói/viết và hội thoại không được chấm tự động. Bản này không chứa file audio, hình kỹ thuật hoặc video; các đoạn đọc mô tả tình huống giả lập và cung cấp dữ kiện cần để trả lời câu hỏi.

<a id="fresher-onboarding-tickets"></a>

## Chủ đề 1: Joining a Team and Picking Up Work

Hoàn thành giao tiếp ngày đầu và làm rõ ticket trước khi bắt tay vào code.

### Bài 1.1: Day One: Access and Local Setup

**Mục tiêu:** Xin đúng quyền truy cập; mô tả bước thiết lập đã thử; phân biệt cấu hình với thông tin xác thực.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| onboarding | noun | quá trình làm quen công việc và nhóm | complete onboarding |
| repository | noun | kho lưu mã nguồn và lịch sử thay đổi; thường gọi là repo | access a repository |
| permission | noun | quyền được thực hiện một thao tác | request permission |
| credential | noun | thông tin dùng để xác thực; thường dùng số nhiều credentials | share credentials |
| dependency | noun | thư viện hoặc thành phần phần mềm mà project cần để hoạt động | install dependencies |
| environment variable | noun phrase | biến môi trường dùng để truyền giá trị cấu hình cho chương trình | set an environment variable |
| configuration | noun | cấu hình điều khiển cách chương trình hoạt động | check the configuration |
| local environment | noun phrase | môi trường chạy trên máy của người phát triển | set up a local environment |

#### Ví dụ Anh–Việt

- **onboarding:** My onboarding includes a short project introduction. — Phần làm quen công việc của tôi gồm một buổi giới thiệu project ngắn.
- **repository:** I cannot access the team repository yet. — Tôi chưa truy cập được kho mã nguồn của nhóm.
- **permission:** Could you check my permission to view this repository? — Bạn có thể kiểm tra quyền xem kho mã nguồn của tôi không?
- **credential:** Do not share your credentials in the team chat. — Đừng chia sẻ thông tin xác thực của bạn trong kênh chat nhóm.
- **dependency:** The setup guide lists the required dependencies. — Hướng dẫn thiết lập liệt kê các thành phần phụ thuộc cần thiết.
- **environment variable:** Set the environment variable shown in the setup guide. — Đặt biến môi trường được nêu trong hướng dẫn thiết lập.
- **configuration:** I checked the configuration before starting the app. — Tôi đã kiểm tra cấu hình trước khi khởi động ứng dụng.
- **local environment:** My local environment is ready for testing. — Môi trường trên máy của tôi đã sẵn sàng để kiểm thử.

#### Cách dùng và mẫu câu

Xin phép: Could you grant me access to [resource]? — Bạn có thể cấp cho tôi quyền truy cập [tài nguyên] không? Nêu hiện trạng: I can open the guide, but I cannot access the repository yet. Dùng yet với điều chưa làm được. Credential là danh từ đếm được, thường dùng credentials; access thường không đếm được. Không gửi token/password khi hỏi trợ giúp; nói tên biến cấu hình là đủ.

#### Đọc trong ngữ cảnh

Linh joins a team building a course-search feature. She can read the onboarding guide, but the repository invitation has not arrived. Her mentor, Mai, asks the repository owner to check the invitation. Once access is available, Linh will install the dependencies listed in the guide. The sample configuration names an environment variable, API_BASE_URL. It does not contain a password. Linh will use the approved test URL and run the app in her local environment. She will report the setup step and error message if startup fails.

**Yêu cầu:** Nêu vướng mắc đầu tiên và hai việc sau khi có quyền. Gợi ý: chưa nhận lời mời repo; cài dependencies theo guide rồi cấu hình URL kiểm thử và chạy local. API_BASE_URL trong bài là tên biến, không phải mật khẩu.

#### Hội thoại đọc phân vai

Linh: I can read the guide, but I have not received the repository invitation yet.

Mai: Thanks. I will ask the owner to check it.

Linh: Could you also confirm the approved test URL?

Mai: Yes. Use the URL in the setup guide. Do not post credentials here.

Linh: Understood. I will report the exact step if startup fails.

#### Thực hành

Viết tin nhắn 40–60 từ xin quyền vào repo giả lập course-web. Nêu đã đọc guide, chưa có invitation, nhờ kiểm tra và bước sẽ làm sau đó. Mẫu: Hi Mai, I have read the setup guide, but I have not received an invitation to course-web yet. Could you ask the owner to check my access? Once I can open the repository, I will install the listed dependencies and try the local setup. Tự chấm 0–2 điểm/tiêu chí: đủ bối cảnh; yêu cầu rõ; bước tiếp theo; lịch sự và không kèm credentials. Tổng 8.

#### Quiz — 5 câu

1. What currently prevents Linh from opening the repository? (Dựa vào bài đọc.)

   - A. The invitation has not arrived
   - B. The local app has failed to start
   - C. The test URL has expired

   **Đáp án: A.** Bài đọc nêu chưa có lời mời; chưa có bằng chứng lỗi khởi động hoặc URL hết hạn.

2. Choose permission or configuration: Could you check my ___ to view this repository?

   **Đáp án: permission.** Permission là quyền truy cập; configuration là cấu hình.

3. What does API_BASE_URL represent in this reading? (Dựa vào bài đọc.)

   - A. A password for the repository
   - B. The name of an environment variable
   - C. The name of a dependency

   **Đáp án: B.** Bài đọc nêu rõ đây là tên biến môi trường.

4. Choose dependencies or credentials: Install the ___ listed in the setup guide.

   **Đáp án: dependencies.** Dependencies là các thành phần phần mềm phụ thuộc cần cài.

5. Which access request gives the teammate enough context?

   - A. I have read the guide, but the repo invitation is missing. Could you check it?
   - B. Please fix my laptop; the repository is definitely broken.
   - C. Send me your password so I can finish setup.

   **Đáp án: A.** Câu đúng nêu việc đã thử, vướng mắc và yêu cầu cụ thể.

### Bài 1.2: Understanding a Ticket and Its Acceptance Criteria

**Mục tiêu:** Đọc ticket; hỏi rõ phạm vi, edge case và tiêu chí chấp nhận; đưa ước lượng có điều kiện.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| ticket | noun | mục công việc được ghi lại trong hệ thống theo dõi | pick up a ticket |
| assignee | noun | người được giao phụ trách ticket | change the assignee |
| user story | noun phrase | mô tả nhu cầu từ góc nhìn người dùng và giá trị mong muốn | write a user story |
| acceptance criteria | plural noun phrase | các điều kiện cụ thể để chấp nhận tính năng hoặc công việc | clarify the acceptance criteria |
| scope | noun | phạm vi công việc đã thống nhất | confirm the scope |
| edge case | noun phrase | trường hợp ở biên hoặc ít gặp cần xem xét | test an edge case |
| priority | noun | mức ưu tiên xử lý so với các công việc khác | set the priority |
| estimate | noun | ước lượng công sức hoặc thời gian theo thông tin hiện có | revise an estimate |

#### Ví dụ Anh–Việt

- **ticket:** I will pick up the search ticket today. — Hôm nay tôi sẽ nhận ticket tìm kiếm.
- **assignee:** Linh is the assignee for DEV-21. — Linh là người được giao phụ trách DEV-21.
- **user story:** This user story explains why learners need search. — User story này giải thích vì sao người học cần tìm kiếm.
- **acceptance criteria:** Could we clarify the acceptance criteria before I start? — Chúng ta có thể làm rõ tiêu chí chấp nhận trước khi tôi bắt đầu không?
- **scope:** Please confirm whether sorting is in scope. — Hãy xác nhận việc sắp xếp có nằm trong phạm vi không.
- **edge case:** An empty search term is one edge case to discuss. — Cụm tìm kiếm rỗng là một trường hợp biên cần trao đổi.
- **priority:** The team sets the priority of this ticket. — Nhóm xác định mức ưu tiên của ticket này.
- **estimate:** I will revise the estimate after we confirm the scope. — Tôi sẽ điều chỉnh ước lượng sau khi chúng ta xác nhận phạm vi.

#### Cách dùng và mẫu câu

Làm rõ: Should [behavior] happen when [condition]? Xác nhận: Just to confirm, [summary]. Hỏi phạm vi: Is [feature] in scope? — [Tính năng] có nằm trong phạm vi không? Estimate là ước lượng có thể thay đổi khi có thông tin mới. Acceptance criteria nói về điều kiện cụ thể của ticket; Definition of Done trong Scrum mô tả chuẩn chất lượng chung của Increment, không đồng nhất hai khái niệm.

#### Đọc trong ngữ cảnh

DEV-21 asks for course search by title. Linh is the assignee. The user story says that a learner wants to find a course without reading the whole list. The acceptance criteria say: ignore letter case, show matching course titles, and show 'No courses found' when there are no matches. Sorting by price is outside the scope. The ticket does not say what an empty search should do. Linh asks the product owner to clarify that edge case before giving a final estimate. Her first estimate is one working day, assuming the existing search API can be used.

**Yêu cầu:** Liệt kê một việc ngoài scope và một câu hỏi còn mở. Gợi ý: sắp xếp theo giá ngoài scope; cần hỏi hành vi khi ô tìm kiếm rỗng. Ước lượng một ngày phụ thuộc việc dùng được API hiện có.

#### Hội thoại đọc phân vai

Linh: Should an empty search show all courses or a message?

Product owner: Good question. Please show all courses.

Linh: Just to confirm, price sorting is outside this ticket?

Product owner: Correct. I will update the acceptance criteria.

Linh: Thanks. My estimate is one working day if we can use the existing API.

#### Thực hành

Đóng vai fresher nhận ticket lọc khóa theo level nhưng chưa rõ khi không chọn level. Viết 3 câu hỏi về hành vi rỗng, phạm vi và API; kết thúc bằng ước lượng có điều kiện. Mẫu: Should an empty filter show all levels? Is sorting included? Can I use the existing API? I estimate one day if the API already supports this filter. Tự chấm 0–2 điểm/tiêu chí: edge case; scope; dependency; estimate có điều kiện. Tổng 8.

#### Quiz — 5 câu

1. Which feature is outside DEV-21? (Dựa vào bài đọc.)

   - A. Sorting by price
   - B. Showing a no-results message
   - C. Ignoring letter case

   **Đáp án: A.** Ticket loại sắp xếp theo giá khỏi phạm vi.

2. Choose assignee or reviewer: The person assigned to a ticket is its ___.

   **Đáp án: assignee.** Assignee là người được giao ticket; reviewer xem xét thay đổi.

3. Which behavior still needs clarification in the reading? (Dựa vào bài đọc.)

   - A. Matching titles without regard to letter case
   - B. A search with no matches
   - C. An empty search

   **Đáp án: C.** Chỉ hành vi tìm kiếm rỗng chưa được mô tả trong bài đọc; hội thoại minh họa bước làm rõ sau đó.

4. Complete the phrase: acceptance ___ (choose criteria or credentials).

   **Đáp án: criteria.** Acceptance criteria là các điều kiện chấp nhận công việc.

5. Which estimate communicates its assumption?

   - A. It is certainly finished even though work has not started
   - B. One day, regardless of any API changes
   - C. One working day if the existing API supports this search

   **Đáp án: C.** Câu đúng cho biết thời lượng dự kiến và điều kiện có thể ảnh hưởng.

### Kiểm tra chủ đề 1 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

Nam joins the course team. He can open the repository, but his local app cannot start because a required configuration value is missing. He will check the setup guide and ask his mentor for the approved value without sharing credentials. His first ticket, DEV-30, adds a level filter. Nam is the assignee. The criteria require filtering by one selected level and showing all courses when no level is selected. Combining several levels is outside the scope. Nam estimates half a day if the existing API supports one-level filtering; he still needs to confirm that API behavior.

1. What currently prevents Nam's local app from starting? (Dựa vào bài đọc.)

   - A. The level filter has already been released
   - B. The repository invitation is missing
   - C. A required configuration value is missing

   **Đáp án: C.** Nam có quyền repo nhưng thiếu giá trị cấu hình để chạy local.

2. Choose repository or estimate: A place holding source code and its history is a ___.

   **Đáp án: repository.** Repository chứa mã nguồn và lịch sử thay đổi.

3. Which next action fits Nam's setup problem? (Dựa vào bài đọc.)

   - A. Ask a teammate to post their password
   - B. Assume the production database is broken
   - C. Check the guide and ask for the approved configuration value

   **Đáp án: C.** Đây là bước Nam dự định làm theo bài đọc.

4. Choose credentials or dependencies: Passwords and tokens used to prove identity are ___.

   **Đáp án: credentials.** Credentials dùng cho xác thực; không phải thư viện phụ thuộc.

5. Which setup update is supported by the passage? (Dựa vào bài đọc.)

   - A. I can open the repo, but the app needs a configuration value
   - B. The app is running successfully on production
   - C. I have no repository access at all

   **Đáp án: A.** Câu đúng phân biệt repo access với local setup.

6. What should DEV-30 do when no level is selected? (Dựa vào bài đọc.)

   - A. Ask the user to choose several levels
   - B. Show only advanced courses
   - C. Show all courses

   **Đáp án: C.** Tiêu chí đã xác định trường hợp không chọn level.

7. Choose assignee or credential: Nam is responsible for DEV-30, so he is its ___.

   **Đáp án: assignee.** Assignee là người được giao ticket.

8. Which behavior is outside DEV-30's scope? (Dựa vào bài đọc.)

   - A. Filtering by one level
   - B. Showing all courses with no level selected
   - C. Combining several levels

   **Đáp án: C.** Bài đọc loại việc kết hợp nhiều level khỏi scope.

9. Choose estimate or approval: A prediction of the effort or time needed is an ___.

   **Đáp án: estimate.** Estimate là dự tính công sức hoặc thời gian, không phải approval.

10. What must Nam still confirm before relying on his estimate? (Dựa vào bài đọc.)

   - A. Whether his name is on the ticket
   - B. Whether the API supports one-level filtering
   - C. Whether no selection should show all courses

   **Đáp án: B.** Bài đọc đã xác nhận assignee và empty selection; API behavior còn mở.

<a id="fresher-daily-collaboration"></a>

## Chủ đề 2: Daily Updates and Getting Unblocked

Đưa cập nhật có điều kiện và hỏi trợ giúp để người nhận có thể hành động.

### Bài 2.1: Daily Stand-up: Progress, Blockers, and ETA

**Mục tiêu:** Cập nhật ngắn gắn với mục tiêu nhóm; nói rõ blocker, công việc còn lại và mốc cập nhật tiếp.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| Sprint Goal | noun phrase | mục tiêu chung của Sprint trong Scrum | work toward the Sprint Goal |
| daily stand-up | noun phrase | buổi trao đổi ngắn hằng ngày của nhóm; tên gọi và cách tổ chức tùy nhóm | give an update at the daily stand-up |
| blocker | noun | vướng mắc đang ngăn công việc tiếp tục | raise a blocker |
| in progress | adjective phrase | đang được thực hiện | still in progress |
| ETA | abbreviation, noun | estimated time of arrival; trong cập nhật công việc thường là thời điểm dự kiến xong | give an ETA |
| dependency | noun | công việc hoặc điều kiện khác mà phần việc đang phụ thuộc vào | identify a dependency |
| follow up | phrasal verb | trao đổi hoặc kiểm tra tiếp sau lần trước | follow up with a teammate |
| remaining work | noun phrase | phần việc còn lại | describe the remaining work |

#### Ví dụ Anh–Việt

- **Sprint Goal:** Our Sprint Goal is to make course search usable. — Mục tiêu Sprint của chúng tôi là làm cho chức năng tìm khóa học dùng được.
- **daily stand-up:** I will mention the delay at the daily stand-up. — Tôi sẽ nêu việc chậm tiến độ trong buổi trao đổi ngắn hằng ngày.
- **blocker:** Missing test access is a blocker for me. — Thiếu quyền truy cập kiểm thử đang ngăn tôi tiếp tục công việc.
- **in progress:** The search tests are still in progress. — Các bài kiểm thử tìm kiếm vẫn đang được thực hiện.
- **ETA:** My current ETA is 3 p.m. if access is restored. — Hiện tôi dự kiến xong lúc 3 giờ chiều nếu quyền truy cập được khôi phục.
- **dependency:** The API response format is a dependency for this task. — Định dạng phản hồi API là một yếu tố mà công việc này đang phụ thuộc vào.
- **follow up:** I will follow up with Minh after the meeting. — Tôi sẽ trao đổi tiếp với Minh sau cuộc họp.
- **remaining work:** The remaining work is to test the empty state. — Phần việc còn lại là kiểm thử trạng thái không có kết quả.

#### Cách dùng và mẫu câu

Việc đã xong: I have finished [work]. Việc còn lại: I still need to [action]. Bị chặn: I am blocked by [issue]. Hẹn cập nhật: I will update you by [time]. ETA là dự kiến, không phải cam kết chắc chắn. Trong Scrum, Daily Scrum là 15 phút để kiểm tra tiến độ hướng tới Sprint Goal và điều chỉnh kế hoạch; không bắt buộc lần lượt trả lời ba câu hỏi Yesterday/Today/Blockers. Dùng khung ba câu đó ở đây chỉ để luyện nói.

#### Đọc trong ngữ cảnh

The team's Sprint Goal is to make course search usable. At the morning stand-up, Linh says that the search field is complete and the empty-state test is in progress. She cannot test real results because her staging account has no search access. That missing access is her blocker. Minh will check the account after the meeting. Linh can still test the layout with sample data. Her current ETA is 3 p.m. if access is restored before noon. She will post another update at noon even if the blocker remains.

**Yêu cầu:** Viết 4 ý: đã xong, còn làm, blocker, mốc cập nhật. Gợi ý: xong search field; còn kiểm thử empty state và kết quả thực; thiếu quyền search trên staging; cập nhật lúc trưa. 3 p.m. là ETA có điều kiện.

#### Hội thoại đọc phân vai

Linh: The search field is complete. I am testing the empty state.

Minh: Is anything blocking the real-data test?

Linh: Yes. My staging account has no search access. Could you check it after stand-up?

Minh: I will follow up with you then.

Linh: Thanks. I will test the layout with sample data and update the team at noon.

#### Thực hành

Nói 45–60 giây: làm gì để góp phần vào Sprint Goal, việc đã xong, blocker và next step. Sau đó giả sử tới trưa vẫn thiếu quyền, viết cập nhật mới. Mẫu: Access is still blocked, so the 3 p.m. ETA is at risk. The layout checks passed with sample data. I need help confirming the account permissions. I will update the estimate after access is restored. Tự chấm 0–2 điểm/tiêu chí: tiến độ có bằng chứng; blocker cụ thể; next step; ETA minh bạch. Tổng 8.

#### Quiz — 5 câu

1. What is Linh's blocker? (Dựa vào bài đọc.)

   - A. The team has no sample data
   - B. The search field has not been created
   - C. Her staging account lacks search access

   **Đáp án: C.** Bài đọc nói thiếu quyền search; search field đã xong và có sample data.

2. Choose in progress or complete: Work that is still being done is ___.

   **Đáp án: in progress.** In progress là đang làm, không phải đã hoàn tất.

3. When will Linh update the team even if access is still missing? (Dựa vào bài đọc.)

   - A. At noon
   - B. Only after the feature is released
   - C. At 3 p.m. only if every test passes

   **Đáp án: A.** Mốc cập nhật là trưa; 3 p.m. là ETA có điều kiện.

4. Choose blocker or approval: A problem that prevents progress is a ___.

   **Đáp án: blocker.** Blocker ngăn công việc tiếp tục.

5. Which statement about a Daily Scrum is accurate?

   - A. Its structure can vary while focusing on the Sprint Goal and next plan
   - B. It is a compulsory detailed status report to a manager
   - C. It requires the same three questions in every team

   **Đáp án: A.** Scrum Guide cho phép Developers chọn cấu trúc phù hợp; khung luyện nói không phải quy định bắt buộc.

### Bài 2.2: Asking for Help in Chat and Across Time Zones

**Mục tiêu:** Viết yêu cầu trợ giúp có context, việc đã thử, bằng chứng và câu hỏi rõ; xác nhận giờ hẹn.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| context | noun | bối cảnh giúp người khác hiểu vấn đề | provide context |
| attempt | noun | một lần hoặc cách đã thử | describe an attempt |
| log | noun | bản ghi sự kiện hoặc thông báo của hệ thống | check the logs |
| stack trace | noun phrase | thông tin về chuỗi lời gọi hàm tại thời điểm lỗi trong nhiều môi trường lập trình | read a stack trace |
| workaround | noun | cách xử lý tạm để tiếp tục công việc; chưa phải sửa nguyên nhân | use a workaround |
| clarification | noun | sự làm rõ thông tin chưa hiểu | ask for clarification |
| pair programming | noun phrase | hai người cùng cộng tác trực tiếp vào một công việc lập trình | try pair programming |
| time zone | noun phrase | múi giờ | confirm the time zone |

#### Ví dụ Anh–Việt

- **context:** Please provide context before asking for help. — Hãy cung cấp bối cảnh trước khi nhờ trợ giúp.
- **attempt:** My first attempt used the sample configuration. — Lần thử đầu tiên của tôi dùng cấu hình mẫu.
- **log:** The logs show that the service stopped at noon. — Các bản ghi cho thấy dịch vụ đã dừng vào buổi trưa.
- **stack trace:** The stack trace mentions the search handler. — Thông tin chuỗi lời gọi hàm có nhắc đến hàm xử lý tìm kiếm.
- **workaround:** The sample response is a temporary workaround. — Phản hồi mẫu là một cách xử lý tạm thời.
- **clarification:** I need clarification on the error message. — Tôi cần được làm rõ thông báo lỗi.
- **pair programming:** Could we try pair programming for this failing test? — Chúng ta có thể cùng lập trình để xử lý bài kiểm thử đang lỗi này không?
- **time zone:** Please include your time zone in the meeting request. — Hãy ghi múi giờ của bạn trong lời mời họp.

#### Cách dùng và mẫu câu

Nhờ hỗ trợ: Could you help me understand [problem]? Nêu đã thử: I have tried [action], but [result]. Phân biệt quan sát với suy đoán: The log shows [fact]. It may be related to [hypothesis]. Hẹn giờ: Would 2 p.m. UTC+7 work for you? Follow up là động từ; follow-up note dùng dạng có gạch nối làm tính từ. Không kết luận root cause chỉ từ một dòng stack trace.

#### Đọc trong ngữ cảnh

Linh is testing DEV-21 locally. A test fails with the message 'Search service unavailable'. She checked the configuration and restarted the local service, but the same error remains. The stack trace mentions the search handler; it does not prove which change caused the failure. Linh shares a short log excerpt with credentials removed. She asks whether she should check the local service health first. A sample response lets her continue the layout work as a workaround, but it does not verify the real integration. She proposes a ten-minute pairing session at 2 p.m. UTC+7.

**Yêu cầu:** Chọn hai việc đã thử, một bằng chứng và giới hạn của workaround. Gợi ý: kiểm tra cấu hình, restart service; thông báo lỗi hoặc stack trace; sample response chỉ giúp làm layout, chưa chứng minh tích hợp thật hoạt động.

#### Hội thoại đọc phân vai

Linh: DEV-21 fails locally with 'Search service unavailable'. I checked the configuration and restarted the service.

Mai: Does the log show which request failed?

Linh: I have added a short excerpt without credentials. Could you help me choose the next check?

Mai: Let's check the service health together.

Linh: Would 2 p.m. UTC+7 work for a ten-minute pairing session?

Mai: Yes, that time works for me.

#### Thực hành

Viết tin nhắn trợ giúp 60–90 từ cho một bài test không chạy. Dùng thứ tự Context → Tried → Observed → Ask → Availability. Mẫu: I am testing the course list locally. I checked the test configuration and restarted the service, but the same error remains. The log says 'Search service unavailable'. I have attached a short excerpt without credentials. Should I check service health next? Could we pair for ten minutes at 2 p.m. UTC+7? Tự chấm 0–2 điểm/tiêu chí: context/đã thử; bằng chứng; câu hỏi cụ thể; múi giờ và thời lượng. Tổng 8.

#### Quiz — 5 câu

1. Which action has Linh already tried? (Dựa vào bài đọc.)

   - A. Deploying to production
   - B. Changing the API contract
   - C. Restarting the local service

   **Đáp án: C.** Restart local service được nêu rõ trong bài; hai hành động kia không có.

2. Choose workaround or approval: A temporary way to keep working is a ___.

   **Đáp án: workaround.** Workaround giúp tạm tiếp tục; không đồng nghĩa đã sửa nguyên nhân.

3. What does the sample response allow Linh to verify? (Dựa vào bài đọc.)

   - A. All production accounts have permission
   - B. The layout using sample data
   - C. The real API integration works correctly

   **Đáp án: B.** Sample data chỉ hỗ trợ kiểm tra layout trong tình huống.

4. Complete: Please include your time ___ (choose zone or trace).

   **Đáp án: zone.** Time zone giúp người ở nơi khác hiểu đúng giờ hẹn.

5. What can Linh conclude from the stack trace alone? (Dựa vào bài đọc.)

   - A. The latest developer definitely caused the error
   - B. Production must be rolled back immediately
   - C. It mentions the search handler, but the cause is not yet confirmed

   **Đáp án: C.** Vị trí xuất hiện lỗi không tự chứng minh nguyên nhân; cần kiểm tra thêm.

### Kiểm tra chủ đề 2 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

At stand-up, Nam reports that the level-filter layout is complete. The API test is blocked because the test service is unavailable. He has checked the endpoint URL and restarted his local client, but the failure remains. He can review the wording with sample data as a workaround. He posts a short log excerpt without tokens and asks Mai to help check service health. His current ETA is 4 p.m. if the service recovers by 1 p.m. He will update the team at 1 p.m. regardless. He proposes a ten-minute pairing session at 11 a.m. UTC+7.

1. Which part of Nam's work is complete? (Dựa vào bài đọc.)

   - A. The production release
   - B. All real-API tests
   - C. The level-filter layout

   **Đáp án: C.** Chỉ layout được báo hoàn tất.

2. Choose blocker or diff: The unavailable test service is a ___.

   **Đáp án: blocker.** Dịch vụ không hoạt động đang chặn kiểm thử.

3. What is the condition attached to the 4 p.m. ETA? (Dựa vào bài đọc.)

   - A. The service recovers by 1 p.m.
   - B. Mai approves a production release at 11 a.m.
   - C. The team cancels all tests

   **Đáp án: A.** ETA phụ thuộc dịch vụ phục hồi trước hoặc lúc 1 p.m.

4. Complete the phrase: remaining ___ (choose work or credentials) means the tasks still to do.

   **Đáp án: work.** Remaining work là phần việc còn lại.

5. If the service remains down at 1 p.m., what update fits the agreement? (Dựa vào bài đọc.)

   - A. No update is needed until the service recovers
   - B. Everything is complete because the layout works
   - C. The blocker remains; the 4 p.m. ETA is at risk and I need a revised plan

   **Đáp án: C.** Nam đã hẹn cập nhật dù blocker còn; cần báo rủi ro của ETA.

6. What has Nam already tried? (Dựa vào bài đọc.)

   - A. Changing the user's permissions
   - B. Rolling back production
   - C. Checking the endpoint URL and restarting his local client

   **Đáp án: C.** Đây là hai việc đã thử được nêu trong bài.

7. Choose context or approval: Background that helps someone understand a request is ___.

   **Đáp án: context.** Context giúp hiểu vấn đề trước khi trả lời.

8. Which request matches Nam's proposed session? (Dựa vào bài đọc.)

   - A. Let's meet sometime tomorrow.
   - B. Please stay online until I finish every task.
   - C. Could we pair for ten minutes at 11 a.m. UTC+7?

   **Đáp án: C.** Giờ, múi giờ và thời lượng khớp đề xuất trong bài.

9. Choose workaround or root cause: Using sample data to continue wording review is a ___.

   **Đáp án: workaround.** Đây là cách tiếp tục tạm thời, không phải nguyên nhân gốc.

10. What does reviewing sample data fail to prove? (Dựa vào bài đọc.)

   - A. That the real test service is healthy
   - B. That the wording can be reviewed
   - C. That Nam can describe his next step

   **Đáp án: A.** Sample data không chứng minh dịch vụ thật hoạt động.

<a id="fresher-change-review"></a>

## Chủ đề 3: Sharing Changes and Handling Feedback

Viết PR rõ phạm vi và báo đúng trạng thái review/CI trước khi tích hợp.

### Bài 3.1: From a Branch to a Clear Pull Request

**Mục tiêu:** Mô tả branch, commit, push và PR; viết mô tả thay đổi, kiểm thử và phần chưa xong.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| branch | noun | nhánh phát triển trong một repository | create a branch |
| commit | noun | mốc ghi lại thay đổi trong lịch sử Git | create a commit |
| push | verb | gửi dữ liệu Git và cập nhật tham chiếu lên repository từ xa | push a branch |
| pull request | noun phrase | đề nghị xem xét và tích hợp thay đổi trên GitHub; viết tắt PR | open a pull request |
| diff | noun | phần hiển thị khác biệt giữa các phiên bản | review the diff |
| base branch | noun phrase | nhánh đích mà pull request đề nghị tích hợp thay đổi vào | check the base branch |
| merge conflict | noun phrase | xung đột khi Git không thể tự kết hợp một số thay đổi | resolve a merge conflict |
| draft pull request | noun phrase | pull request đánh dấu đang làm, chưa sẵn sàng để merge | open a draft pull request |

#### Ví dụ Anh–Việt

- **branch:** I created a branch for the search change. — Tôi đã tạo một nhánh cho thay đổi tìm kiếm.
- **commit:** This commit adds the empty-state message. — Commit này thêm thông báo khi không có kết quả.
- **push:** I will push my branch after the local tests pass. — Tôi sẽ đẩy nhánh của mình lên sau khi kiểm thử trên máy đạt.
- **pull request:** I opened a pull request for DEV-21. — Tôi đã mở một pull request cho DEV-21.
- **diff:** The diff includes one source file and one test file. — Phần khác biệt gồm một tệp mã nguồn và một tệp kiểm thử.
- **base branch:** The base branch for this pull request is main. — Nhánh đích của pull request này là main.
- **merge conflict:** I need help resolving a merge conflict in the search file. — Tôi cần giúp giải quyết xung đột gộp trong tệp tìm kiếm.
- **draft pull request:** I opened a draft pull request to ask for early feedback. — Tôi đã mở pull request dạng nháp để xin góp ý sớm.

#### Cách dùng và mẫu câu

Mô tả mục đích: This PR adds [behavior] so that [benefit]. Báo kiểm thử: I tested [case] in [environment]. Xin góp ý sớm: This is a draft PR; I would like feedback on [part]. Commit ghi thay đổi vào lịch sử Git local; push gửi lên remote; mở PR để đề nghị review/tích hợp. Push không tự đồng nghĩa đã merge hoặc deploy. Fork là repository riêng có quan hệ với repo gốc; branch thuộc một repository.

#### Đọc trong ngữ cảnh

Linh creates the branch search-empty-state for DEV-21. She adds an empty-state message and a test, then makes a commit. After the local test passes, she pushes the branch to the team repository. She opens a draft pull request with main as the base branch because the real-data check is still pending. Her description explains the change, links DEV-21, and lists what she tested. The diff includes a source file and a test file. Later, Git reports a merge conflict in the source file. Linh asks the reviewer about the intended behavior before resolving it.

**Yêu cầu:** Sắp xếp commit, push, mở PR; nêu vì sao còn draft. Gợi ý: commit → push → PR; kiểm thử dữ liệu thật chưa xong. Merge conflict cần hiểu hành vi mong muốn, không chọn toàn bộ một phía một cách máy móc.

#### Hội thoại đọc phân vai

Linh: I opened a draft PR for DEV-21. The local empty-state test passes.

Mai: What is still pending?

Linh: The real-data check. Could you review the message wording first?

Mai: Yes. There is also a conflict in the source file.

Linh: Could we confirm the intended behavior before I resolve it?

Mai: Let's compare both changes and then rerun the relevant tests.

#### Thực hành

Viết PR description 4 mục: Why, Changes, Tested, Pending. Mẫu: Why: Learners need a clear no-results message. Changes: Added the empty state and its test. Tested: No matches in the local environment. Pending: Real-data check on staging; this PR remains a draft. Đổi ngữ cảnh sang form đăng ký và tự viết bản thứ hai. Tự chấm 0–2 điểm/tiêu chí: lý do; phạm vi; bằng chứng test; giới hạn/pending. Tổng 8.

#### Quiz — 5 câu

1. Why is Linh's pull request a draft? (Dựa vào bài đọc.)

   - A. The real-data check is still pending
   - B. No local test has passed
   - C. The change is already in production

   **Đáp án: A.** Bài đọc nêu local test đạt nhưng real-data check chưa xong.

2. Choose base or local: The target of a pull request is its ___ branch.

   **Đáp án: base.** Base branch là nhánh đích để tích hợp.

3. What is the correct order in Linh's workflow? (Dựa vào bài đọc.)

   - A. Commit, push, open a pull request
   - B. Open a pull request, deploy, create the first local change
   - C. Push automatically means merge to main

   **Đáp án: A.** Đây là trình tự cụ thể trong bài; push không tự merge.

4. Choose diff or credential: The display of changed lines is the ___.

   **Đáp án: diff.** Diff hiển thị các khác biệt giữa phiên bản.

5. What should Linh do before resolving the conflict? (Dựa vào bài đọc.)

   - A. Delete the test because conflicts make tests unnecessary
   - B. Keep every line from her branch without reviewing
   - C. Confirm the intended behavior and compare both changes

   **Đáp án: C.** Hiểu hai thay đổi và hành vi cần giữ giúp xử lý xung đột đúng.

### Bài 3.2: Responding to Code Review and CI Results

**Mục tiêu:** Phản hồi review có dẫn chứng; phân biệt góp ý nhỏ, yêu cầu sửa và status check; báo đúng phạm vi test.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| reviewer | noun | người xem xét thay đổi | request a reviewer |
| nit | noun, informal | góp ý nhỏ, thường về cách trình bày; mức bắt buộc tùy quy ước nhóm | leave a nit |
| suggestion | noun | đề xuất thay đổi | discuss a suggestion |
| resolve | verb | đánh dấu trao đổi đã được xử lý hoặc giải quyết vấn đề, tùy ngữ cảnh | resolve a conversation |
| CI | abbreviation, noun | continuous integration; tích hợp liên tục, thường có các bước kiểm tra tự động | run CI checks |
| status check | noun phrase | kết quả hoặc trạng thái kiểm tra gắn với một commit hay pull request | pass a status check |
| regression | noun | lỗi xuất hiện lại hoặc làm hỏng hành vi trước đó vốn hoạt động | prevent a regression |
| approval | noun | sự chấp thuận của người review | request approval |

#### Ví dụ Anh–Việt

- **reviewer:** I asked Mai to be the reviewer. — Tôi đã nhờ Mai xem xét thay đổi.
- **nit:** The reviewer left a nit about the variable name. — Người review góp ý nhỏ về tên biến.
- **suggestion:** Could you explain this suggestion with an example? — Bạn có thể giải thích đề xuất này bằng ví dụ không?
- **resolve:** I will resolve the conversation after we agree on the fix. — Tôi sẽ đánh dấu trao đổi đã xử lý sau khi chúng ta thống nhất cách sửa.
- **CI:** The CI checks run when I push this change. — Các bước kiểm tra CI chạy khi tôi đẩy thay đổi này lên.
- **status check:** One required status check is still pending. — Một kiểm tra bắt buộc vẫn đang chờ kết quả.
- **regression:** The new test helps prevent a regression. — Bài kiểm thử mới giúp ngăn lỗi cũ tái xuất hiện.
- **approval:** I will request approval after addressing the comments. — Tôi sẽ xin chấp thuận sau khi xử lý các góp ý.

#### Cách dùng và mẫu câu

Tiếp nhận: Thanks for pointing that out. I have added [change]. Hỏi lại: Could you explain which case this should cover? Không đồng ý có lý do: I see the concern. Would [alternative] address it? Nit thường là góp ý nhỏ nhưng hỏi lại nếu không rõ có bắt buộc không. Resolve conversation chỉ đánh dấu trạng thái trao đổi, không chứng minh lỗi đã được sửa. CI có thể chạy test, lint hoặc build tùy project; checks xanh không đảm bảo không còn bug. Approval không tự đồng nghĩa đủ mọi điều kiện merge.

#### Đọc trong ngữ cảnh

Mai reviews Linh's pull request. She asks for a test covering a blank search and leaves a nit about a variable name. Linh adds the missing regression test and renames the variable. The first CI run fails because the expected message in the test differs from the agreed text. Linh checks the acceptance criteria, corrects the expectation, and pushes a new commit. The test check now passes, but the required build check is still pending. She replies with the changes and asks Mai to review again. This team's policy requires approval and all required checks before merging.

**Yêu cầu:** Nêu nguyên nhân CI fail được xác nhận trong bài, việc đã sửa và điều kiện còn thiếu. Gợi ý: expected message sai so với text đã thống nhất; sửa expectation; còn build check và review/approval theo policy nhóm giả lập.

#### Hội thoại đọc phân vai

Mai: Please add a blank-search test. Nit: could this variable have a clearer name?

Linh: Thanks. I added the test and renamed the variable.

Mai: What happened with CI?

Linh: The expected message was wrong. I checked the criteria and corrected it. Tests pass now; the build check is still pending.

Mai: Please request another review when the checks finish.

Linh: Will do. I will keep the PR open until the merge requirements are met.

#### Thực hành

Viết phản hồi cho góp ý 'Please cover an expired session'. Mẫu: Thanks for pointing that out. I added an expired-session test and checked that the app shows the agreed sign-in message. The test check passes, but the build check is still pending. Could you review the new test when you have time? Tự chấm 0–2 điểm/tiêu chí: phản hồi tôn trọng; thay đổi cụ thể; kết quả đúng mức; yêu cầu tiếp theo. Tổng 8.

#### Quiz — 5 câu

1. Why did the first CI run fail in the reading? (Dựa vào bài đọc.)

   - A. The required build check had passed
   - B. The reviewer had approved every change
   - C. The test expected a different message from the agreed text

   **Đáp án: C.** Lỗi cụ thể là expected message không khớp text đã thống nhất.

2. Choose regression or permission: A bug that breaks previously working behavior is a ___.

   **Đáp án: regression.** Regression là lỗi làm hỏng hành vi trước đó hoạt động.

3. What is still pending after the test check passes? (Dựa vào bài đọc.)

   - A. The required build check
   - B. Creating the first branch
   - C. Reading the ticket for the first time

   **Đáp án: A.** Build check vẫn pending trong bài.

4. Complete the abbreviation: continuous integration = ___ (write two letters).

   **Đáp án: CI.** CI là viết tắt của continuous integration.

5. Which reply best handles an unclear review comment?

   - A. All review suggestions are optional, so I will ignore this.
   - B. Could you show the case this change should cover?
   - C. I resolved the conversation, so the code must be correct.

   **Đáp án: B.** Câu hỏi cụ thể giúp hiểu review; trạng thái resolve không chứng minh tính đúng.

### Kiểm tra chủ đề 3 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

Nam commits the level-filter change locally and then pushes his branch. He opens a draft PR targeting main because the empty-selection test is not finished. The diff also includes an unrelated formatting change. Mai asks him to remove that unrelated change and add the missing test. Nam does both and pushes again. The test and build checks pass. Mai still asks whether the user-facing message matches the acceptance criteria; she has not approved yet. The team's policy requires reviewer approval and all required checks. Nam will answer with the exact message and request another review.

1. Where is Nam's first commit recorded before he pushes? (Dựa vào bài đọc.)

   - A. In his local Git history
   - B. Automatically in the production environment
   - C. Only in a chat message

   **Đáp án: A.** Commit local và push lên remote là hai thao tác khác nhau.

2. Choose branch or payload: A separate line of development within a repository is a ___.

   **Đáp án: branch.** Branch là nhánh phát triển trong repo.

3. Why is the PR initially marked as draft? (Dựa vào bài đọc.)

   - A. Every required review has already approved it
   - B. No source code exists in the repository
   - C. The empty-selection test is unfinished

   **Đáp án: C.** Draft thể hiện còn việc kiểm thử trong tình huống.

4. Choose pull or status: A ___ request proposes changes for review and integration.

   **Đáp án: pull.** Pull request là đề nghị review/tích hợp thay đổi.

5. What is the target branch of the PR? (Dựa vào bài đọc.)

   - A. The staging server
   - B. main
   - C. The local test account

   **Đáp án: B.** Bài đọc nêu PR targeting main.

6. Which change did Mai ask Nam to remove? (Dựa vào bài đọc.)

   - A. The level-filter behavior
   - B. Unrelated formatting
   - C. The missing-test requirement

   **Đáp án: B.** Mai yêu cầu bỏ formatting không liên quan khỏi diff.

7. Choose reviewer or assignee: A person examining a pull request is a ___.

   **Đáp án: reviewer.** Reviewer là người xem xét PR.

8. Why is the PR not yet ready under this team's policy? (Dựa vào bài đọc.)

   - A. Both test and build checks are failing
   - B. The branch has never been pushed
   - C. Reviewer approval is still missing

   **Đáp án: C.** Checks đã đạt nhưng Mai chưa approve.

9. Choose CI or ETA: Automated integration checks commonly run in ___.

   **Đáp án: CI.** CI là tích hợp liên tục; ETA là dự kiến thời điểm.

10. What is the most useful reply to Mai's remaining question?

   - A. Mark the conversation resolved without answering
   - B. Say that green checks prove every requirement is met
   - C. Quote the actual message, compare it with the criteria, and request review

   **Đáp án: C.** Cần trả lời nội dung được hỏi; checks xanh không thay review tiêu chí.

<a id="fresher-api-qa-delivery"></a>

## Chủ đề 4: From API Evidence to QA Handoff

Truyền bằng chứng lỗi API và bàn giao đúng phiên bản, phạm vi kiểm thử, người phụ trách.

### Bài 4.1: Reporting an API Problem with Evidence

**Mục tiêu:** Nêu endpoint, trạng thái HTTP, môi trường và quan sát; phân biệt lỗi xác thực, phân quyền và suy đoán nguyên nhân.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| endpoint | noun | điểm truy cập API; thường được xác định bởi phương thức và đường dẫn | call an endpoint |
| request | noun | yêu cầu được gửi đến máy chủ | send a request |
| response | noun | phản hồi mà máy chủ trả về | inspect a response |
| payload | noun | dữ liệu mang trong yêu cầu hoặc phản hồi, thường chỉ phần body | inspect the payload |
| status code | noun phrase | mã biểu thị kết quả xử lý yêu cầu HTTP | check the status code |
| authentication | noun | xác thực danh tính | check authentication |
| authorization | noun | kiểm tra hoặc quyết định quyền truy cập tài nguyên, thao tác | check authorization |
| timeout | noun | tình trạng vượt quá thời gian chờ được đặt | report a timeout |

#### Ví dụ Anh–Việt

- **endpoint:** The client calls the GET /courses endpoint. — Ứng dụng khách gọi endpoint GET /courses.
- **request:** This request asks for the course list. — Yêu cầu này xin danh sách khóa học.
- **response:** The response contains an empty list. — Phản hồi chứa một danh sách rỗng.
- **payload:** The response payload contains a message field. — Dữ liệu trong body phản hồi chứa trường message.
- **status code:** The status code is 401 in this test. — Mã trạng thái là 401 trong lần kiểm thử này.
- **authentication:** Authentication failed because the test token expired. — Việc xác thực thất bại vì token kiểm thử đã hết hạn.
- **authorization:** Authorization rules prevent this role from editing courses. — Các quy tắc phân quyền ngăn vai trò này sửa khóa học.
- **timeout:** The client reports a timeout after ten seconds. — Ứng dụng khách báo quá thời gian chờ sau mười giây.

#### Cách dùng và mẫu câu

Báo quan sát: GET /courses returns 401 in staging. Hỏi làm rõ: Does this role have permission to [action]? Authentication xác thực danh tính; authorization xét quyền. Theo ý nghĩa chuẩn, 401 cho biết thiếu thông tin xác thực hợp lệ; 403 là máy chủ hiểu nhưng từ chối thực hiện, thường liên quan quyền. 404 có thể là không tìm thấy tài nguyên; 500 là lỗi phía máy chủ chưa chỉ rõ nguyên nhân. Timeout của client không nhất thiết đi kèm một HTTP status code. Báo mã quan sát được và xem hợp đồng API/log để kiểm chứng nguyên nhân.

#### Đọc trong ngữ cảnh

On staging build 0.8, Linh sends GET /courses with an expired test token. The response status is 401, and the response payload contains the message 'Session expired'. She signs in again with the approved test account and receives 200 for the same endpoint. Later, that account sends PATCH /courses/42 and receives 403 with 'Edit permission required'. The account can view courses but cannot edit them. Linh reports the method, path, build, role, and observed results. She does not include the token value. These observations concern the test account on staging, not every user in production.

**Yêu cầu:** Lập bảng 3 lượt gọi: phương thức/path → mã → quan sát. Gợi ý: GET /courses token cũ → 401/session expired; GET sau đăng nhập lại → 200; PATCH /courses/42 → 403/edit permission required. Không suy rộng sang production.

#### Hội thoại đọc phân vai

Linh: GET /courses returned 401 with 'Session expired' on staging build 0.8.

Mai: What happened after signing in again?

Linh: The same endpoint returned 200. PATCH /courses/42 still returned 403.

Mai: Does this test role have edit permission?

Linh: No, it can only view courses. I will include the role and results in the ticket, without the token.

#### Thực hành

Viết báo cáo 50–80 từ cho tình huống khác: build 0.9 staging, viewer gọi GET /profile nhận 200 nhưng PATCH /profile nhận 403, chưa xác nhận role có quyền sửa. Mẫu: On staging build 0.9, GET /profile returns 200 for the viewer account. PATCH /profile returns 403. I have not confirmed whether this role should have edit permission. Could you clarify the intended access rules? I have included the request method and path, without credentials. Tự chấm 0–2 điểm/tiêu chí: môi trường/build; endpoint/mã; quan sát tách suy đoán; câu hỏi/quyền. Tổng 8.

#### Quiz — 5 câu

1. What changes after Linh signs in again? (Dựa vào bài đọc.)

   - A. GET /courses returns 200
   - B. PATCH /courses/42 automatically returns 200
   - C. The account gains edit permission

   **Đáp án: A.** Đăng nhập lại khôi phục xác thực trong tình huống, không cấp thêm quyền sửa.

2. Choose authentication or authorization: Checking whether a known role may edit a course is ___.

   **Đáp án: authorization.** Authorization quyết định quyền với hành động hoặc tài nguyên.

3. Which result is linked to the expired token in the reading? (Dựa vào bài đọc.)

   - A. 200 from the first request
   - B. 401 from GET /courses
   - C. 403 from PATCH /courses/42

   **Đáp án: B.** Token hết hạn gắn với lượt GET nhận 401.

4. Choose request or response: Data returned by a server is part of its ___.

   **Đáp án: response.** Response là phản hồi từ máy chủ.

5. Which report avoids an unsupported conclusion?

   - A. All production users are blocked because one staging role got 403
   - B. A client timeout always proves the server returned 500
   - C. PATCH returns 403 for this staging role; please confirm its edit permission

   **Đáp án: C.** Nêu phạm vi quan sát và câu hỏi cụ thể, không suy rộng hoặc tự gán HTTP code.

### Bài 4.2: QA Handoff, Release Notes, and Known Issues

**Mục tiêu:** Viết bàn giao có build, môi trường, test result, known issue, owner và bước tiếp; phân biệt staging với production.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| QA | abbreviation, noun | quality assurance; đảm bảo chất lượng; trong hội thoại nhóm có thể chỉ người/nhóm QA | hand over to QA |
| staging | noun | môi trường trước production để kiểm thử tích hợp hoặc kiểm tra bản phát hành | test on staging |
| production | noun | môi trường phục vụ người dùng thực tế | deploy to production |
| deployment | noun | việc đưa phiên bản phần mềm lên một môi trường | check a deployment |
| smoke test | noun phrase | kiểm tra nhanh một số chức năng quan trọng để phát hiện lỗi lớn | run a smoke test |
| rollback | noun | việc quay về phiên bản hoặc trạng thái trước theo kế hoạch | prepare a rollback |
| known issue | noun phrase | vấn đề đã biết và được ghi nhận | document a known issue |
| handoff | noun | việc bàn giao công việc và thông tin cần để tiếp tục | write a handoff note |

#### Ví dụ Anh–Việt

- **QA:** I will hand this change over to QA with test notes. — Tôi sẽ bàn giao thay đổi này cho QA cùng ghi chú kiểm thử.
- **staging:** The fix is available on staging. — Bản sửa đã có trên môi trường staging.
- **production:** The release owner will deploy to production after approval. — Người phụ trách phát hành sẽ triển khai lên production sau khi được chấp thuận.
- **deployment:** The staging deployment finished at 2 p.m. — Việc triển khai lên staging hoàn tất lúc 2 giờ chiều.
- **smoke test:** QA will run a smoke test before deeper testing. — QA sẽ kiểm tra nhanh các chức năng chính trước khi kiểm thử sâu hơn.
- **rollback:** The release owner prepared a rollback plan. — Người phụ trách phát hành đã chuẩn bị kế hoạch quay về phiên bản trước.
- **known issue:** The handoff note documents one known issue. — Ghi chú bàn giao ghi nhận một vấn đề đã biết.
- **handoff:** The handoff note includes the build and test results. — Ghi chú bàn giao gồm bản build và kết quả kiểm thử.

#### Cách dùng và mẫu câu

Bàn giao: Ready for QA on [environment/build]. Báo giới hạn: I have checked [cases], but [case] is still pending. Nhờ hành động: Could you verify [case] before [milestone]? Deployment là đưa phiên bản lên môi trường; không tự đồng nghĩa phát hành tới mọi người dùng. Smoke test kiểm tra nhanh chức năng chính, không thay toàn bộ regression testing. Rollback có thể phức tạp nếu có thay đổi dữ liệu; fresher báo người phụ trách theo quy trình thay vì tự cam kết có thể quay lại an toàn.

#### Đọc trong ngữ cảnh

Build 0.9 is deployed to staging, not production. Linh's handoff note lists DEV-21, the build, and the test account role. Search by title, mixed letter case, and the no-results message passed her checks. She documents a known issue: the search button label wraps onto two lines on a narrow screen. QA will run a smoke test and check the layout at the agreed screen sizes. Mai is the release owner. Mai will decide whether to proceed after reviewing the QA results and the known issue. The team has a rollback plan, but Linh is not asked to deploy or roll back production.

**Yêu cầu:** Tìm 3 kết quả đã kiểm tra, một known issue và người quyết định release. Gợi ý: title search/case/no-results đạt; nhãn nút xuống hai dòng; Mai. Chưa có production deployment trong bài.

#### Hội thoại đọc phân vai

Linh: DEV-21 is ready for QA on staging build 0.9. The three search checks passed.

QA: Are there any known issues?

Linh: The button label wraps on a narrow screen. I included it in the handoff note.

QA: We will check the agreed screen sizes and post the results.

Linh: Thanks. Mai will review those results before deciding on the production release.

#### Thực hành

Viết handoff 6 mục: Ticket, Environment/build, Checked, Known issues, Pending/ask, Owner. Mẫu: Ticket: DEV-21. Environment: staging 0.9. Checked: title search, mixed case, no results. Known issue: button label wraps on narrow screens. Pending: QA layout check at agreed sizes. Owner: Mai decides on release after QA. Tự chấm 0–2 điểm/tiêu chí: xác định bản cần test; bằng chứng/giới hạn; việc cần QA; owner và trạng thái release rõ. Tổng 8.

#### Quiz — 5 câu

1. Where is build 0.9 deployed in the reading? (Dựa vào bài đọc.)

   - A. Staging
   - B. Production
   - C. Only the learner's phone

   **Đáp án: A.** Bài đọc nói staging và chưa lên production.

2. Choose smoke or stack: A quick check of key functions is a ___ test.

   **Đáp án: smoke.** Smoke test kiểm tra nhanh một số chức năng quan trọng.

3. What known issue does Linh report? (Dựa vào bài đọc.)

   - A. The test account cannot sign in
   - B. The search button label wraps on a narrow screen
   - C. Every search request returns 500

   **Đáp án: B.** Known issue được mô tả cụ thể là nhãn nút xuống dòng.

4. Choose handoff or payload: Notes that help the next person continue the work form a ___ note.

   **Đáp án: handoff.** Handoff note truyền thông tin bàn giao.

5. Who decides whether to proceed with the release? (Dựa vào bài đọc.)

   - A. Linh automatically, because the code was merged
   - B. Mai, after reviewing QA results and the known issue
   - C. Any learner who can open staging

   **Đáp án: B.** Mai là release owner trong tình huống này; không suy ra mọi công ty đều phân quyền giống nhau.

### Kiểm tra chủ đề 4 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

On staging build 1.0, a viewer account calls GET /courses?level=beginner and receives 200 with a list. PATCH /courses/42 returns 403 with 'Edit permission required'. The team confirms that viewers may read but not edit courses. Nam records the method, path, role, and status without recording token values. His handoff note says the single-level filter and empty selection passed, but a slow-network check is still pending. A known issue is a clipped label on a small screen. QA will test that screen size. Mai owns the release decision after QA; there is no production deployment yet.

1. Which request succeeds for the viewer account? (Dựa vào bài đọc.)

   - A. PATCH /courses/42
   - B. Every request that edits a course
   - C. GET /courses?level=beginner

   **Đáp án: C.** Lượt GET nhận 200 và danh sách.

2. Choose authorization or authentication: Deciding whether a viewer may edit is ___.

   **Đáp án: authorization.** Authorization xét quyền; authentication xác thực danh tính.

3. How should Nam describe the PATCH result? (Dựa vào bài đọc.)

   - A. It proves the viewer's password expired
   - B. It proves all course reads are broken
   - C. 403 is consistent with the confirmed read-only role in this scenario

   **Đáp án: C.** Nhóm xác nhận viewer không có quyền sửa; không suy ra lỗi mật khẩu hoặc đọc.

4. Choose payload or priority: Data in the body of a response is commonly called its ___.

   **Đáp án: payload.** Payload thường chỉ dữ liệu trong body yêu cầu/phản hồi.

5. Which evidence is appropriate for the report?

   - A. A copied access token and no description
   - B. Only the statement 'the API is bad'
   - C. Method, path, role, build, and observed status

   **Đáp án: C.** Bằng chứng xác định ngữ cảnh và kết quả mà không lộ token.

6. Which check is still pending? (Dựa vào bài đọc.)

   - A. The slow-network check
   - B. The empty-selection check
   - C. The single-level filter check

   **Đáp án: A.** Hai kiểm tra chức năng đã đạt; slow network còn chờ.

7. Choose staging or production: The environment used for build 1.0 in this passage is ___. (Dựa vào bài đọc.)

   **Đáp án: staging.** Build đang ở staging, chưa deploy production.

8. What should QA inspect on the small screen? (Dựa vào bài đọc.)

   - A. A missing repository invitation
   - B. An expired password
   - C. The clipped label

   **Đáp án: C.** Known issue là nhãn bị cắt trên màn hình nhỏ.

9. Choose rollback or review: Returning to a previous version according to a plan is a ___.

   **Đáp án: rollback.** Rollback là quay về phiên bản/trạng thái trước theo kế hoạch.

10. Which handoff statement correctly describes the release state? (Dựa vào bài đọc.)

   - A. Nam has already performed a production rollback
   - B. Production is live because one API call returned 200
   - C. QA checks remain, and Mai will decide on release afterward

   **Đáp án: C.** Bài đọc nói chưa triển khai production; Mai quyết định sau QA.

## Nguồn đối chiếu khái niệm

- [GitHub Docs — GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow): Đối chiếu branch, commit/push, PR, review và merge; dùng trong bài From a Branch to a Clear Pull Request. Đọc ngày 20/09/2026.
- [GitHub Docs — Forks](https://docs.github.com/en/pull-requests/reference/forks): Phân biệt fork là repository riêng với branch trong một repository.
- [GitHub Docs — Status checks](https://docs.github.com/en/pull-requests/reference/status-checks): Đối chiếu checks và điều kiện merge; policy approval/checks trong tình huống là quy ước của nhóm giả lập.
- [GitHub Docs — Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions): Đối chiếu CI và workflow tự động. Không yêu cầu học cú pháp cấu hình Actions trong bộ tiếng Anh này.
- [Scrum Guide — November 2020](https://scrumguides.org/scrum-guide.html): Đối chiếu Sprint Goal, Daily Scrum 15 phút, quyền chọn cấu trúc trao đổi và Definition of Done. Không mặc định mọi nhóm IT dùng Scrum.
- [MDN — HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status): Đối chiếu ý nghĩa mã 200/401/403/404/500. Nguyên nhân cụ thể của các lượt gọi trong bài là dữ kiện giả lập, không suy ra chỉ từ mã trạng thái.
- [Atlassian — User stories](https://www.atlassian.com/agile/project-management/user-stories): Đối chiếu nhu cầu người dùng và giá trị của user story; ticket DEV-21/DEV-30 là nội dung tự biên soạn.
- [Atlassian — Acceptance criteria](https://www.atlassian.com/work-management/project-management/acceptance-criteria): Đối chiếu điều kiện chấp nhận cụ thể của công việc; phân biệt với Definition of Done dựa thêm trên Scrum Guide.

Nguồn giúp rà soát khái niệm; không chứng nhận chất lượng bộ học liệu hoặc thay thế giáo viên/chuyên gia duyệt nội dung.

