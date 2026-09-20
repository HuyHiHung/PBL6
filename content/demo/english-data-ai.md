# Data & AI English — Explain Your Results

Tiếng Anh cho sinh viên dữ liệu và AI: đọc bảng, giải thích mô hình và trình bày kết quả có giới hạn.

**Mức mục tiêu:** A2–B1 · **Thời lượng:** 150 phút.

**Quy mô:** 3 chủ đề, 6 bài, 48 mục từ/cụm từ theo bài và 60 câu hỏi.

**Mục tiêu:** Mô tả dữ liệu, hỏi về chất lượng, trình bày quy trình mô hình và báo kết quả mà không khái quát quá mức.

> Bản dành cho người duyệt có đáp án. Chưa nhập CMS, không kèm audio. Hội thoại dùng để đọc phân vai; tình huống và số liệu là giả lập.

Biên soạn mới cho Sprout ở mức ngôn ngữ mục tiêu A2–B1; chưa qua thẩm định độc lập của giáo viên/chuyên gia. Hội thoại, số liệu và thiết bị là giả lập để học tiếng Anh, không phải hướng dẫn vận hành hoặc thông số sản phẩm thật. Nguồn tham khảo chỉ dùng đối chiếu khái niệm; không sao chép bài học từ nguồn.

## Lộ trình

| Chủ đề | Các bài học | Thời lượng |
|---|---|---|
| [Describing Data](#data-description-quality) | Describing a Dataset; Asking About Data Quality | 50 phút |
| [Explaining a Model](#ai-workflow-evaluation) | Explaining a Model Workflow; Discussing a Model Test | 50 phút |
| [Presenting Results and Limits](#data-results-limits) | Describing Results and Trends; Explaining Limits and Next Steps | 50 phút |

## Cách học

1. Đọc từ, nghĩa và ví dụ; che nghĩa để nhớ từ rồi đổi chiều.
2. Đọc bài, trả lời yêu cầu và đọc hội thoại theo vai nếu có.
3. Thực hành nói/viết theo mẫu; tự kiểm bằng tiêu chí cuối hoạt động.
4. Làm quiz trước khi xem đáp án; thêm từ còn nhầm vào flashcard và ôn ở buổi tiếp theo.

Mỗi bài khoảng 20 phút, mỗi kiểm tra chủ đề khoảng 10 phút. Bài nói/viết và hội thoại không được chấm tự động. Bản này không chứa file audio, hình kỹ thuật hoặc video; các đoạn đọc mô tả tình huống giả lập và cung cấp dữ kiện cần để trả lời câu hỏi.

<a id="data-description-quality"></a>

## Chủ đề 1: Describing Data

Đọc bảng và trao đổi về chất lượng dữ liệu.

### Bài 1.1: Describing a Dataset

**Mục tiêu:** Gọi tên thành phần bảng dữ liệu và mô tả số lượng, đơn vị, trường dữ liệu.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| dataset | noun | tập dữ liệu | describe a dataset |
| record | noun | bản ghi về một đối tượng hoặc sự kiện | a customer record |
| row | noun | hàng trong bảng | read a row |
| column | noun | cột trong bảng | add a column |
| value | noun | giá trị | check a value |
| label | noun | nhãn hoặc giá trị đích trong bài học có giám sát | a class label |
| unit | noun | đơn vị đo | state the unit |
| source | noun | nguồn dữ liệu | check the source |

#### Ví dụ Anh–Việt

- **dataset:** This dataset contains 100 records. — Tập dữ liệu này có 100 bản ghi.
- **record:** Each record describes one order. — Mỗi bản ghi mô tả một đơn hàng.
- **row:** Each row shows one measurement. — Mỗi hàng hiển thị một phép đo.
- **column:** The last column contains the date. — Cột cuối chứa ngày.
- **value:** This value is missing. — Giá trị này bị thiếu.
- **label:** The label is pass or fail. — Nhãn là đạt hoặc không đạt.
- **unit:** The unit is seconds. — Đơn vị là giây.
- **source:** The source is a classroom survey. — Nguồn là khảo sát trong lớp.

#### Cách dùng và mẫu câu

There are + số nhiều: There are 100 rows. Each row + động từ số ít: Each row describes a session. Dùng in seconds / in minutes để nêu đơn vị. Label trong phân loại là nhãn mục tiêu, không chỉ là tiêu đề cột.

#### Đọc trong ngữ cảnh

This fictional dataset describes 100 study sessions. Each row represents one session. The columns are session_id, minutes, and completed. The unit for study time is minutes. The completed column contains yes or no labels. The source is a classroom survey; no names are included.

**Yêu cầu:** Ghi số hàng, đơn vị và nguồn. Đáp án: 100 hàng; phút; khảo sát lớp. Một hàng là một buổi học, không phải một sinh viên.

#### Hội thoại đọc phân vai

Mai: What does each row represent?

Nam: One study session.

Mai: What is the unit for time?

Nam: Minutes, not seconds.

#### Thực hành

Giới thiệu bảng giả lập trong 3 câu. Mẫu: There are 100 rows. Each row represents a study session. Time is measured in minutes. Tự kiểm: nêu số lượng, ý nghĩa hàng và đơn vị; không suy ra số người từ số buổi học.

#### Quiz — 5 câu

1. What does one row represent? (Dựa vào bài đọc.)

   - A. One student
   - B. One session
   - C. One school

   **Đáp án: B.** Mỗi hàng là một buổi học.

2. Choose row or column: A vertical group of cells is a ___.

   **Đáp án: column.** Column là cột.

3. What is the time unit? (Dựa vào bài đọc.)

   - A. Hours
   - B. Minutes
   - C. Seconds

   **Đáp án: B.** Bài đọc ghi phút.

4. Choose source or label: Where the data comes from is its ___.

   **Đáp án: source.** Source chỉ nguồn dữ liệu.

5. Which statement is supported? (Dựa vào bài đọc.)

   - A. The table describes 100 sessions
   - B. There are exactly 100 students
   - C. The table includes student names

   **Đáp án: A.** Số buổi không cho biết số sinh viên; tên không được đưa vào.

### Bài 1.2: Asking About Data Quality

**Mục tiêu:** Trao đổi về dữ liệu thiếu, trùng và quy tắc kiểm tra trước khi phân tích.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| missing | adjective | bị thiếu | a missing value |
| duplicate | noun | bản ghi trùng | remove a duplicate |
| format | noun | cách biểu diễn dữ liệu | a date format |
| valid | adjective | hợp lệ theo quy tắc đã xác định | a valid value |
| range | noun | khoảng giá trị | an allowed range |
| clean | verb | làm sạch dữ liệu | clean a dataset |
| check | verb | kiểm tra | check the records |
| confirm | verb | xác nhận | confirm a rule |

#### Ví dụ Anh–Việt

- **missing:** We found a missing value in this row. — Chúng tôi tìm thấy một giá trị bị thiếu ở hàng này.
- **duplicate:** This row may be a duplicate. — Hàng này có thể là bản ghi trùng.
- **format:** Please confirm the date format. — Hãy xác nhận định dạng ngày.
- **valid:** This value is valid under our rule. — Giá trị này hợp lệ theo quy tắc của chúng tôi.
- **range:** The allowed range is zero to sixty. — Khoảng cho phép là từ không đến sáu mươi.
- **clean:** We clean the dataset before analysis. — Chúng tôi làm sạch tập dữ liệu trước khi phân tích.
- **check:** Please check these records first. — Hãy kiểm tra các bản ghi này trước.
- **confirm:** Can you confirm this rule with the owner? — Bạn có thể xác nhận quy tắc này với người phụ trách không?

#### Cách dùng và mẫu câu

Could you confirm ...? xin xác nhận. We found ... báo điều quan sát được. Do not assume ... nhắc không suy đoán: Do not assume a blank means zero. Missing và zero có nghĩa khác nhau.

#### Đọc trong ngữ cảnh

Lan reviews a fictional table of study minutes. Two rows have blank time values. Two other rows share the same session_id. Lan does not replace the blanks with zero or delete rows immediately. She asks the data owner to confirm the meaning of a blank and the rule for unique IDs.

**Yêu cầu:** Tìm hai vấn đề và việc Lan làm trước khi sửa. Đáp án: thiếu thời gian, trùng ID; hỏi chủ dữ liệu về ý nghĩa và quy tắc.

#### Hội thoại đọc phân vai

Lan: Do blank values mean zero minutes?

Owner: No. They mean the time was not recorded.

Lan: Should each session_id be unique?

Owner: Yes. Please check the repeated IDs.

#### Thực hành

Viết tin nhắn 3 câu báo vấn đề và xin xác nhận. Mẫu: Two time values are missing. Two rows share an ID. Could you confirm the rules before we change them? Tự kiểm: phân biệt phát hiện với quyết định xử lý; không mặc định ô trống bằng 0.

#### Quiz — 5 câu

1. What does Lan do before changing the rows? (Dựa vào bài đọc.)

   - A. Asks the data owner
   - B. Deletes all rows
   - C. Sets blanks to zero

   **Đáp án: A.** Lan xin xác nhận trước khi sửa.

2. Choose missing or valid: A blank time value is ___ in this example. (Dựa vào bài đọc.)

   **Đáp án: missing.** Ô thời gian trống là giá trị bị thiếu.

3. Which problem involves repeated IDs? (Dựa vào bài đọc.)

   - A. A new unit
   - B. Possible duplicates
   - C. A chart title

   **Đáp án: B.** ID lặp là dấu hiệu cần kiểm tra bản ghi trùng.

4. Choose format or source: YYYY-MM-DD describes a date ___.

   **Đáp án: format.** Đây là cách biểu diễn ngày.

5. Which request is clearest?

   - A. Fix everything
   - B. Could you confirm what a blank time means?
   - C. Data is interesting

   **Đáp án: B.** Câu hỏi nêu đúng điểm chưa rõ.

### Kiểm tra chủ đề 1 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

A fictional table has 60 rows. Each row is one practice session. Duration is measured in seconds. Three duration values are blank. Two rows have the same session_id. Minh asks the owner what blanks mean before changing them. The source is a class survey.

1. What does each row describe? (Dựa vào bài đọc.)

   - A. A student
   - B. A session
   - C. A school

   **Đáp án: B.** Mỗi hàng là một buổi luyện tập.

2. What is the time unit? Copy one word from the passage. (Dựa vào bài đọc.)

   **Đáp án: seconds.** Bài đọc dùng seconds.

3. How many rows are in the table? (Dựa vào bài đọc.)

   - A. 60
   - B. 3
   - C. 2

   **Đáp án: A.** Bảng có 60 hàng.

4. Choose column or source: The class survey is the data ___. (Dựa vào bài đọc.)

   **Đáp án: source.** Khảo sát là nguồn dữ liệu.

5. Which question clarifies a table structure?

   - A. Who built the robot?
   - B. What does each row represent?
   - C. Where is the motor?

   **Đáp án: B.** Câu hỏi làm rõ ý nghĩa hàng.

6. Choose missing or valid: The three blank durations are ___ values. (Dựa vào bài đọc.)

   **Đáp án: missing.** Ô thời gian trống là giá trị thiếu.

7. What does Minh do before changing blanks? (Dựa vào bài đọc.)

   - A. Asks the owner
   - B. Deletes the table
   - C. Sets all to zero

   **Đáp án: A.** Minh hỏi chủ dữ liệu trước.

8. Choose duplicate or unit: A repeated record may be a ___.

   **Đáp án: duplicate.** Duplicate là bản ghi trùng.

9. What needs clarification? (Dựa vào bài đọc.)

   - A. The color of the table
   - B. The meaning of blanks
   - C. The price of a robot

   **Đáp án: B.** Ý nghĩa ô trống cần xác nhận.

10. Which conclusion is supported? (Dựa vào bài đọc.)

   - A. Some session IDs are repeated
   - B. Every blank means zero
   - C. There are 60 unique students

   **Đáp án: A.** Hai hàng có cùng ID; không suy ra số người.

<a id="ai-workflow-evaluation"></a>

## Chủ đề 2: Explaining a Model

Giải thích huấn luyện và kiểm tra mô hình bằng số liệu đơn giản.

### Bài 2.1: Explaining a Model Workflow

**Mục tiêu:** Mô tả bằng tiếng Anh bước huấn luyện, dự đoán và đánh giá trên dữ liệu tách riêng.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| model | noun | mô hình dùng để tạo dự đoán hoặc mô tả quan hệ | train a model |
| feature | noun | đặc trưng đầu vào của mô hình | an input feature |
| training set | noun | tập dữ liệu dùng để huấn luyện | use a training set |
| test set | noun | tập dữ liệu tách riêng để đánh giá | evaluate on a test set |
| train | verb | huấn luyện mô hình | train on examples |
| predict | verb | dự đoán | predict a label |
| evaluate | verb | đánh giá | evaluate the model |
| split | verb | chia dữ liệu thành các phần | split the dataset |

#### Ví dụ Anh–Việt

- **model:** We train a model on examples. — Chúng tôi huấn luyện một mô hình trên các ví dụ.
- **feature:** Study time is an input feature. — Thời gian học là một đặc trưng đầu vào.
- **training set:** The training set contains 80 examples. — Tập huấn luyện có 80 ví dụ.
- **test set:** We keep the test set separate. — Chúng tôi giữ tập kiểm tra tách riêng.
- **train:** We train on the training set. — Chúng tôi huấn luyện trên tập huấn luyện.
- **predict:** The model predicts a label. — Mô hình dự đoán một nhãn.
- **evaluate:** We evaluate the model on unseen examples. — Chúng tôi đánh giá mô hình trên ví dụ chưa dùng để huấn luyện.
- **split:** We split the dataset before training. — Chúng tôi chia tập dữ liệu trước khi huấn luyện.

#### Cách dùng và mẫu câu

First / Next / Finally mô tả quy trình. We train on ...; we evaluate on ... Phân biệt feature ở đây là đầu vào mô hình, còn feature trong sản phẩm có thể là tính năng. Kết quả trên tập huấn luyện không tự chứng minh khả năng dự đoán dữ liệu mới.

#### Đọc trong ngữ cảnh

In a simplified classroom example, the team has 100 labelled records. They split them into 80 training records and 20 test records. They train a model using the training set. Then they predict labels for the separate test set and compare the predictions with its labels. The test set is not used to train this model.

**Yêu cầu:** Nêu vai trò hai tập. Đáp án: 80 bản ghi dùng huấn luyện; 20 bản ghi tách riêng dùng đánh giá. Tỷ lệ này chỉ là ví dụ.

#### Hội thoại đọc phân vai

Tutor: Which records do you use for training?

Mai: The 80 training records.

Tutor: What about the other 20?

Mai: We use them to evaluate the model.

#### Thực hành

Mô tả quy trình trong 4 câu dùng First/Next/Then/Finally. Mẫu: First, split the data. Next, train the model. Then, predict test labels. Finally, compare predictions with labels. Tự kiểm: không trộn vai trò hai tập.

#### Quiz — 5 câu

1. How many records are used for training? (Dựa vào bài đọc.)

   - A. 100
   - B. 20
   - C. 80

   **Đáp án: C.** Bài đọc sử dụng 80 bản ghi huấn luyện.

2. Choose train or predict: To produce a label for a new example, the model will ___.

   **Đáp án: predict.** Predict là dự đoán.

3. Which set is kept out of training here? (Dựa vào bài đọc.)

   - A. The training set
   - B. The test set
   - C. Both sets

   **Đáp án: B.** Tập kiểm tra không dùng huấn luyện.

4. Choose feature or folder: An input such as study time is a ___.

   **Đáp án: feature.** Feature ở ngữ cảnh này là đặc trưng.

5. Which statement is correct?

   - A. Good training results guarantee future success
   - B. Every model needs exactly 100 records
   - C. Training and testing have different roles

   **Đáp án: C.** Bài phân biệt vai trò; số lượng chỉ là giả lập.

### Bài 2.2: Discussing a Model Test

**Mục tiêu:** Trao đổi kết quả kiểm tra, lỗi dự đoán và so sánh với mốc cơ sở.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| prediction | noun | kết quả dự đoán | check a prediction |
| correct | adjective | đúng | a correct prediction |
| incorrect | adjective | không đúng | an incorrect label |
| accuracy | noun | tỷ lệ dự đoán đúng trong tình huống phân loại | report accuracy |
| baseline | noun | mốc hoặc phương pháp cơ sở để so sánh | compare with a baseline |
| metric | noun | chỉ số dùng để đánh giá | choose a metric |
| compare | verb | so sánh | compare two models |
| review | verb | xem xét lại | review the errors |

#### Ví dụ Anh–Việt

- **prediction:** This prediction is incorrect. — Dự đoán này không đúng.
- **correct:** Eighteen predictions are correct. — Mười tám dự đoán là đúng.
- **incorrect:** The model gives an incorrect label here. — Mô hình đưa ra nhãn không đúng ở đây.
- **accuracy:** Accuracy is 90 percent on this test set. — Tỷ lệ dự đoán đúng là 90 phần trăm trên tập kiểm tra này.
- **baseline:** We compare the model with a baseline. — Chúng tôi so sánh mô hình với mốc cơ sở.
- **metric:** Accuracy is one metric, not the only one. — Tỷ lệ đúng là một chỉ số, không phải chỉ số duy nhất.
- **compare:** We compare both models on the same test set. — Chúng tôi so sánh hai mô hình trên cùng tập kiểm tra.
- **review:** Let us review the errors together. — Chúng ta hãy cùng xem lại các lỗi.

#### Cách dùng và mẫu câu

On this test set giới hạn phạm vi kết luận. Model A has higher accuracy than the baseline on this set. Không viết always better khi chỉ có một lần đánh giá. Cần xem bối cảnh và loại lỗi, không chỉ một con số.

#### Đọc trong ngữ cảnh

On a fictional test set of 20 records, Model A makes 18 correct predictions. A baseline makes 16 correct predictions on the same records. Model A has 90 percent accuracy on this set. The team reviews the two incorrect predictions. They do not claim that Model A will always perform better on all future data.

**Yêu cầu:** Ghi số đúng và số sai của Model A, rồi nêu giới hạn kết luận. Đáp án: 18 đúng, 2 sai; chỉ kết quả trên tập này.

#### Hội thoại đọc phân vai

Nam: Is Model A perfect?

Lan: No. Two predictions are incorrect.

Nam: What should we do next?

Lan: Review those errors and test more examples.

#### Thực hành

Viết báo cáo 3 câu. Mẫu: Model A got 18 of 20 predictions correct. It outperformed the baseline on this set. We still need to review errors. Tự kiểm: có số liệu, đối tượng so sánh và giới hạn.

#### Quiz — 5 câu

1. How many predictions from Model A are incorrect? (Dựa vào bài đọc.)

   - A. 2
   - B. 18
   - C. 16

   **Đáp án: A.** 20 trừ 18 bằng 2.

2. Choose baseline or feature: A reference method for comparison is a ___.

   **Đáp án: baseline.** Baseline là mốc cơ sở.

3. Which claim is supported? (Dựa vào bài đọc.)

   - A. Model A always beats every model
   - B. Model A is perfect
   - C. Model A beats the baseline on this set

   **Đáp án: C.** Kết luận chỉ áp dụng cho tập được mô tả.

4. Choose review or install: The team will ___ the incorrect predictions.

   **Đáp án: review.** Review là xem xét lại lỗi.

5. Which number is the accuracy of Model A here? (Dựa vào bài đọc.)

   - A. 100 percent
   - B. 80 percent
   - C. 90 percent

   **Đáp án: C.** 18/20 là 90 phần trăm.

### Kiểm tra chủ đề 2 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

In a fictional exercise, a team uses 40 records to train a classifier and a separate set of 10 records to test it. Model B predicts 8 test labels correctly. A baseline predicts 7 correctly on the same test set. The team reviews the two errors and plans more testing.

1. How many records are used to train the classifier? Write digits. (Dựa vào bài đọc.)

   **Đáp án: 40.** Tập huấn luyện có 40 bản ghi.

2. Which data is separate from training? (Dựa vào bài đọc.)

   - A. The 10 test records
   - B. All 40 training records
   - C. No data

   **Đáp án: A.** 10 bản ghi kiểm tra được tách riêng.

3. Choose train or predict: A classifier will ___ a label for an input.

   **Đáp án: predict.** Predict là dự đoán nhãn.

4. What is a model input called in this course?

   - A. A feature
   - B. A folder
   - C. A deadline

   **Đáp án: A.** Feature là đặc trưng đầu vào.

5. Why keep a separate test set?

   - A. To evaluate on records not used for training
   - B. To guarantee perfect results
   - C. To avoid making predictions

   **Đáp án: A.** Tập riêng giúp đánh giá ngoài dữ liệu huấn luyện.

6. How many test predictions from Model B are wrong? Write digits. (Dựa vào bài đọc.)

   **Đáp án: 2.** 10 trừ 8 bằng 2.

7. Which comparison is supported? (Dựa vào bài đọc.)

   - A. Model B always wins
   - B. The baseline is perfect
   - C. Model B gets one more correct than the baseline

   **Đáp án: C.** 8 so với 7 trên cùng tập.

8. Choose accuracy or source: The proportion of correct predictions is called ___.

   **Đáp án: accuracy.** Trong phân loại, accuracy là tỷ lệ dự đoán đúng.

9. What will the team review? (Dựa vào bài đọc.)

   - A. Two training folders
   - B. All universities
   - C. The two prediction errors

   **Đáp án: C.** Nhóm xem lại hai dự đoán sai.

10. Which report is most precise? (Dựa vào bài đọc.)

   - A. The model is always correct
   - B. Training proves future success
   - C. Eight of ten test predictions are correct

   **Đáp án: C.** Câu giữ đúng số liệu và phạm vi.

<a id="data-results-limits"></a>

## Chủ đề 3: Presenting Results and Limits

Mô tả xu hướng và kết luận có giới hạn.

### Bài 3.1: Describing Results and Trends

**Mục tiêu:** Đọc số liệu dạng bảng và nói về tăng, giảm, đơn vị và thời kỳ so sánh.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| chart | noun | biểu đồ | describe a chart |
| axis | noun | trục của biểu đồ | label an axis |
| trend | noun | xu hướng | describe a trend |
| increase | verb | tăng | increase from twenty to thirty |
| decrease | verb | giảm | decrease by five |
| average | noun | giá trị trung bình | calculate an average |
| percentage | noun | tỷ lệ phần trăm | report a percentage |
| sample | noun | mẫu dữ liệu được khảo sát | describe the sample |

#### Ví dụ Anh–Việt

- **chart:** This chart shows weekly usage. — Biểu đồ này thể hiện lượng sử dụng hằng tuần.
- **axis:** The horizontal axis shows the week. — Trục ngang thể hiện tuần.
- **trend:** The trend is upward in this example. — Xu hướng đi lên trong ví dụ này.
- **increase:** Usage increased from twenty to thirty sessions. — Lượng sử dụng tăng từ hai mươi lên ba mươi buổi.
- **decrease:** The count decreased by five. — Số lượng giảm năm đơn vị.
- **average:** The average is ten minutes. — Giá trị trung bình là mười phút.
- **percentage:** Please report the percentage clearly. — Hãy báo tỷ lệ phần trăm rõ ràng.
- **sample:** The sample includes one class. — Mẫu khảo sát gồm một lớp.

#### Cách dùng và mẫu câu

Increase from A to B khác increase by C. From 20 to 30 là tăng 10, không phải tăng 30. Khi nói xu hướng, nêu đại lượng, đơn vị và thời gian; không suy ra nguyên nhân chỉ từ xu hướng.

#### Đọc trong ngữ cảnh

A fictional table shows completed study sessions: Week 1, 20; Week 2, 30; Week 3, 25. The count increases by ten in Week 2, then decreases by five in Week 3. These are session counts, not percentages. The data comes from one class and does not explain why the counts changed.

**Yêu cầu:** Nói hai thay đổi bằng from/to và by. Đáp án: 20 lên 30, tăng 10; 30 xuống 25, giảm 5.

#### Hội thoại đọc phân vai

Mai: Did usage keep increasing?

Nam: No. It fell from 30 to 25 in Week 3.

Mai: Do we know why?

Nam: Not from this table alone.

#### Thực hành

Viết 3 câu mô tả bảng. Mẫu: The count rose from 20 to 30. Then it fell by five. The table does not explain the cause. Tự kiểm: số, chiều thay đổi và giới hạn đều đúng.

#### Quiz — 5 câu

1. How many sessions are shown for Week 3? (Dựa vào bài đọc.)

   - A. 25
   - B. 30
   - C. 20

   **Đáp án: A.** Tuần 3 có 25 buổi.

2. Complete with from or by: The count increased ___ ten, from 20 to 30.

   **Đáp án: by.** By chỉ lượng thay đổi.

3. Which unit is used? (Dựa vào bài đọc.)

   - A. Sessions
   - B. Percentages
   - C. Students

   **Đáp án: A.** Dữ liệu đếm buổi học.

4. Choose axis or sample: A labelled reference line on a chart is an ___.

   **Đáp án: axis.** Axis là trục biểu đồ.

5. What can the table alone explain? (Dựa vào bài đọc.)

   - A. The counts over three weeks
   - B. The results for all universities
   - C. Why every student studied less

   **Đáp án: A.** Bảng chỉ cho số lượng trong một lớp qua ba tuần.

### Bài 3.2: Explaining Limits and Next Steps

**Mục tiêu:** Nêu giới hạn mẫu, sự chưa chắc chắn và đề xuất kiểm tra thêm một cách thận trọng.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| limitation | noun | giới hạn của dữ liệu hoặc kết luận | state a limitation |
| uncertainty | noun | sự chưa chắc chắn | express uncertainty |
| representative | adjective | có tính đại diện cho nhóm được xét | a representative sample |
| bias | noun | sự thiên lệch | sampling bias |
| evidence | noun | bằng chứng hỗ trợ nhận định | collect evidence |
| claim | noun | nhận định được đưa ra | support a claim |
| recommend | verb | đề xuất | recommend further testing |
| next step | noun | bước tiếp theo | agree on the next step |

#### Ví dụ Anh–Việt

- **limitation:** A small sample is a limitation of this study. — Mẫu nhỏ là một giới hạn của nghiên cứu này.
- **uncertainty:** We explain the uncertainty in the report. — Chúng tôi giải thích sự chưa chắc chắn trong báo cáo.
- **representative:** This sample may not be representative. — Mẫu này có thể không có tính đại diện.
- **bias:** Sampling bias may affect the result. — Thiên lệch lấy mẫu có thể ảnh hưởng kết quả.
- **evidence:** We need more evidence for this claim. — Chúng tôi cần thêm bằng chứng cho nhận định này.
- **claim:** The current data does not support that claim. — Dữ liệu hiện có không hỗ trợ nhận định đó.
- **recommend:** We recommend further testing. — Chúng tôi đề xuất kiểm tra thêm.
- **next step:** The next step is to collect more examples. — Bước tiếp theo là thu thập thêm ví dụ.

#### Cách dùng và mẫu câu

May / might nêu điều có thể xảy ra. Our results apply to ... xác định phạm vi. We recommend + danh từ/V-ing: We recommend testing another class. Giới hạn mẫu không tự chứng minh kết quả sai; nó giới hạn mức khái quát.

#### Đọc trong ngữ cảnh

A team tests a study app with twelve volunteers from one class. Most volunteers like it. The team says the feedback is useful, but it may not represent all students. They do not claim that everyone will like the app. They recommend collecting feedback from other classes before making a wider claim.

**Yêu cầu:** Tìm mẫu khảo sát, giới hạn và bước tiếp. Đáp án: 12 tình nguyện viên một lớp; chưa đại diện mọi sinh viên; lấy phản hồi lớp khác.

#### Hội thoại đọc phân vai

Tutor: Can we say all students like the app?

Lan: No. We only asked twelve volunteers in one class.

Tutor: What do you recommend?

Lan: Collect feedback from other classes.

#### Thực hành

Viết kết luận 3 câu. Mẫu: Most of our twelve volunteers liked the app. This sample may not represent all students. We recommend testing with other classes. Tự kiểm: không đổi most thành all; nêu rõ mẫu và bước tiếp.

#### Quiz — 5 câu

1. How many volunteers gave feedback? (Dựa vào bài đọc.)

   - A. All students
   - B. Twelve
   - C. One hundred

   **Đáp án: B.** Bài đọc có 12 tình nguyện viên.

2. Choose limitation or prediction: A factor that restricts a conclusion is a ___.

   **Đáp án: limitation.** Limitation là giới hạn kết luận.

3. Which next step is recommended? (Dựa vào bài đọc.)

   - A. Delete all feedback
   - B. Claim everyone likes the app
   - C. Collect feedback from other classes

   **Đáp án: C.** Nhóm muốn mở rộng thu thập phản hồi.

4. Choose evidence or axis: Information that supports a claim is ___.

   **Đáp án: evidence.** Evidence là bằng chứng.

5. Which conclusion matches the passage? (Dựa vào bài đọc.)

   - A. Every student likes the app
   - B. Most volunteers in this sample like it
   - C. No volunteer likes the app

   **Đáp án: B.** Giữ đúng từ most và phạm vi mẫu.

### Kiểm tra chủ đề 3 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

A fictional study records 10, 15, and 12 completed sessions in Weeks 1, 2, and 3. The study covers one class. Six volunteers also give feedback; five like the app. The team reports the session counts and says the feedback may not represent all students. It recommends asking other classes.

1. How many sessions are completed in Week 2? (Dựa vào bài đọc.)

   - A. 10
   - B. 12
   - C. 15

   **Đáp án: C.** Tuần 2 có 15 buổi.

2. From Week 2 to Week 3, the count decreases by how many? Write digits. (Dựa vào bài đọc.)

   **Đáp án: 3.** 15 xuống 12 là giảm 3.

3. What do 10, 15, and 12 measure? (Dựa vào bài đọc.)

   - A. Percentages
   - B. Session counts
   - C. Model accuracy

   **Đáp án: B.** Đây là số buổi, không phải phần trăm.

4. Complete with by or to: The count rises from 10 ___ 15.

   **Đáp án: to.** From A to B chỉ hai mốc.

5. Which trend is shown? (Dựa vào bài đọc.)

   - A. Always decreasing
   - B. Always constant
   - C. Increasing, then decreasing

   **Đáp án: C.** 10 → 15 → 12.

6. How many volunteers like the app? Write digits. (Dựa vào bài đọc.)

   **Đáp án: 5.** 5 trong 6 tình nguyện viên thích ứng dụng.

7. Which limitation is stated? (Dựa vào bài đọc.)

   - A. The app is broken
   - B. The sample may not represent all students
   - C. There is no data

   **Đáp án: B.** Bài nêu giới hạn tính đại diện.

8. Choose recommend or guarantee: The team can ___ asking other classes.

   **Đáp án: recommend.** Recommend là đề xuất, không bảo đảm.

9. Which claim is too broad? (Dựa vào bài đọc.)

   - A. Five volunteers like the app
   - B. All students like the app
   - C. The study covers one class

   **Đáp án: B.** Không thể khái quát 5 người thành mọi sinh viên.

10. What is the next step? (Dựa vào bài đọc.)

   - A. Ask other classes
   - B. Claim certainty
   - C. Ignore all feedback

   **Đáp án: A.** Thu thập phản hồi lớp khác.

## Nguồn đối chiếu khái niệm

- [scikit-learn — Getting Started](https://scikit-learn.org/stable/getting_started.html): Đối chiếu khái niệm feature, huấn luyện, dự đoán và đánh giá trên tập tách riêng; các tình huống và số liệu do bộ học liệu tự soạn.

Nguồn giúp rà soát khái niệm; không chứng nhận chất lượng bộ học liệu hoặc thay thế giáo viên/chuyên gia duyệt nội dung.

