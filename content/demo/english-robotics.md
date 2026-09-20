# Automation & Robotics English — Describe the System

Tiếng Anh cho Tự động hóa/Robot qua thiết bị, chu trình mô phỏng và bàn giao sự cố.

**Mức mục tiêu:** A2–B1 · **Thời lượng:** 150 phút.

**Quy mô:** 3 chủ đề, 6 bài, 48 mục từ/cụm từ theo bài và 60 câu hỏi.

**Mục tiêu:** Mô tả vai trò sensor/controller/actuator, đọc thông tin công cụ, trình bày chu trình và báo sự cố có dữ kiện.

> Bản dành cho người duyệt có đáp án. Chưa nhập CMS, không kèm audio. Hội thoại dùng để đọc phân vai; tình huống và số liệu là giả lập.

Biên soạn mới cho Sprout ở mức ngôn ngữ mục tiêu A2–B1; chưa qua thẩm định độc lập của giáo viên/chuyên gia. Hội thoại, số liệu và thiết bị là giả lập để học tiếng Anh, không phải hướng dẫn vận hành hoặc thông số sản phẩm thật. Nguồn tham khảo chỉ dùng đối chiếu khái niệm; không sao chép bài học từ nguồn.

## Lộ trình

| Chủ đề | Các bài học | Thời lượng |
|---|---|---|
| [Sensors and Actuators](#robotics-sensing-actuation) | Sensors, Controllers, and Actuators; Clarifying Robot Tool Information | 50 phút |
| [Describing a Cycle](#robotics-cycle-workflow) | Describing an Automatic Cycle; Reviewing a Cycle with a Teammate | 50 phút |
| [Status and Incident Communication](#robotics-status-incidents) | Reading Status and Alarm Messages; Writing an Incident Handover | 50 phút |

## Cách học

1. Đọc từ, nghĩa và ví dụ; che nghĩa để nhớ từ rồi đổi chiều.
2. Đọc bài, trả lời yêu cầu và đọc hội thoại theo vai nếu có.
3. Thực hành nói/viết theo mẫu; tự kiểm bằng tiêu chí cuối hoạt động.
4. Làm quiz trước khi xem đáp án; thêm từ còn nhầm vào flashcard và ôn ở buổi tiếp theo.

Mỗi bài khoảng 20 phút, mỗi kiểm tra chủ đề khoảng 10 phút. Bài nói/viết và hội thoại không được chấm tự động. Bản này không chứa file audio, hình kỹ thuật hoặc video; các đoạn đọc mô tả tình huống giả lập và cung cấp dữ kiện cần để trả lời câu hỏi.

<a id="robotics-sensing-actuation"></a>

## Chủ đề 1: Sensors and Actuators

Phân biệt vai trò thiết bị và làm rõ thông tin công cụ robot.

### Bài 1.1: Sensors, Controllers, and Actuators

**Mục tiêu:** Gọi tên các phần tử của hệ tự động và mô tả vai trò cảm nhận, xử lý, tác động.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| sensor | noun | cảm biến | a position sensor |
| actuator | noun | cơ cấu chấp hành tạo tác động vật lý | control an actuator |
| controller | noun | bộ điều khiển | a machine controller |
| motor | noun | động cơ | an electric motor |
| switch | noun | công tắc | a limit switch |
| detect | verb | phát hiện | detect an object |
| command | noun | lệnh điều khiển | send a command |
| feedback | noun | thông tin phản hồi về trạng thái hệ thống | position feedback |

#### Ví dụ Anh–Việt

- **sensor:** The sensor detects a part. — Cảm biến phát hiện một chi tiết.
- **actuator:** The actuator moves the arm in the animation. — Cơ cấu chấp hành di chuyển tay máy trong hoạt hình.
- **controller:** The controller receives the sensor signal. — Bộ điều khiển nhận tín hiệu cảm biến.
- **motor:** The motor turns the conveyor roller. — Động cơ quay con lăn băng tải.
- **switch:** The diagram includes a limit switch. — Sơ đồ có một công tắc hành trình.
- **detect:** This sensor detects an object at the station. — Cảm biến này phát hiện vật tại trạm.
- **command:** The controller sends a command to the drive. — Bộ điều khiển gửi lệnh tới bộ truyền động.
- **feedback:** Position feedback tells the controller where the axis is. — Phản hồi vị trí cho bộ điều khiển biết trục đang ở đâu.

#### Cách dùng và mẫu câu

The sensor detects ...; the controller receives ...; the actuator moves ... Phân biệt bộ cảm nhận với cơ cấu tác động. Feedback ở đây là tín hiệu trạng thái, không phải nhận xét của khách hàng.

#### Đọc trong ngữ cảnh

In a classroom animation, a sensor detects a box at a station. A controller receives the signal and sends a command to a motor drive. The motor moves a conveyor. A position signal returns to the controller as feedback. The animation is used to practise describing the system in English.

**Yêu cầu:** Ghép vai trò với thiết bị. Đáp án: sensor phát hiện; controller nhận và gửi lệnh; motor tạo chuyển động; tín hiệu vị trí là phản hồi.

#### Hội thoại đọc phân vai

Mai: Does the sensor move the box?

Nam: No. It detects the box.

Mai: What creates the movement?

Nam: The motor drives the conveyor in this animation.

#### Thực hành

Nói 3 câu về vai trò thiết bị. Mẫu: The sensor detects the box. The controller sends a command. The motor moves the conveyor. Tự kiểm: không gán việc tạo chuyển động cho cảm biến.

#### Quiz — 5 câu

1. What detects the box? (Dựa vào bài đọc.)

   - A. The sensor
   - B. The motor
   - C. The English report

   **Đáp án: A.** Sensor phát hiện hộp.

2. Choose actuator or feedback: Information returned about position is ___.

   **Đáp án: feedback.** Feedback là thông tin phản hồi.

3. What sends the command? (Dựa vào bài đọc.)

   - A. The controller
   - B. The box
   - C. The conveyor roller

   **Đáp án: A.** Controller gửi lệnh.

4. Choose motor or sensor: The device producing rotation in this example is a ___. (Dựa vào bài đọc.)

   **Đáp án: motor.** Motor tạo chuyển động quay.

5. What kind of activity is described? (Dựa vào bài đọc.)

   - A. Live machine commissioning
   - B. A real emergency
   - C. A classroom animation

   **Đáp án: C.** Bài sử dụng hoạt hình lớp học.

### Bài 1.2: Clarifying Robot Tool Information

**Mục tiêu:** Hỏi rõ tên công cụ, khối lượng và đơn vị khi trao đổi tài liệu robot.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| robot arm | noun | tay máy robot | a robot arm |
| end effector | noun | công cụ hoặc thiết bị ở đầu làm việc của robot | attach an end effector |
| gripper | noun | tay kẹp | a two-finger gripper |
| payload | noun | tải gắn trên robot, tính cả công cụ và vật mang theo cách định nghĩa đang dùng | state the payload |
| reach | noun | tầm với | robot reach |
| mass | noun | khối lượng | tool mass |
| specification | noun | thông số hoặc yêu cầu kỹ thuật | check a specification |
| confirm | verb | xác nhận | confirm the units |

#### Ví dụ Anh–Việt

- **robot arm:** The drawing shows a robot arm. — Bản vẽ thể hiện một tay máy robot.
- **end effector:** The gripper is the end effector in this example. — Tay kẹp là công cụ đầu cuối trong ví dụ này.
- **gripper:** The gripper holds a sample part. — Tay kẹp giữ một chi tiết mẫu.
- **payload:** Please state what the payload figure includes. — Hãy nêu con số tải bao gồm những gì.
- **reach:** The brochure lists the robot reach. — Tài liệu giới thiệu ghi tầm với robot.
- **mass:** The fictional tool mass is one kilogram. — Khối lượng công cụ giả lập là một kilôgam.
- **specification:** We check the specification before comparing products. — Chúng tôi kiểm tra thông số trước khi so sánh sản phẩm.
- **confirm:** Could you confirm the units in this table? — Bạn có thể xác nhận đơn vị trong bảng này không?

#### Cách dùng và mẫu câu

Does this include ...? hỏi con số bao gồm thành phần nào. The mass is ... kg. Khối lượng ghi kg, không đổi sang đơn vị lực. Không dùng tổng khối lượng đơn giản để kết luận robot thực tế phù hợp: còn cần định nghĩa và điều kiện của nhà sản xuất.

#### Đọc trong ngữ cảnh

A fictional tool note lists a gripper mass of 1 kg and a sample part mass of 0.5 kg. In this exercise, the attached mass includes both items, so it totals 1.5 kg. Lan asks whether the cable mass is included; the note does not say. She records that question instead of claiming the setup is suitable for a real robot.

**Yêu cầu:** Ghi tổng đã biết và điều chưa rõ. Đáp án: 1.5 kg gồm kẹp và vật; chưa rõ cáp có được tính không.

#### Hội thoại đọc phân vai

Lan: Does 1.5 kg include the cable?

Supplier: The sample note does not specify that.

Lan: Please confirm the included items.

Supplier: I will check the full specification.

#### Thực hành

Viết email 3 câu. Mẫu: The listed mass is 1.5 kg. Does this include the cable? Please confirm the included items and units. Tự kiểm: hỏi phần thiếu, không kết luận chọn robot từ số liệu giả lập.

#### Quiz — 5 câu

1. What is the total of the two listed masses? (Dựa vào bài đọc.)

   - A. 1 kg
   - B. 0.5 kg
   - C. 1.5 kg

   **Đáp án: C.** 1 + 0.5 = 1.5 kg.

2. Choose gripper or reach: A tool used to hold a part is a ___.

   **Đáp án: gripper.** Gripper là tay kẹp.

3. What remains unclear? (Dựa vào bài đọc.)

   - A. Whether a gripper is listed
   - B. The unit of the two values
   - C. Whether the cable mass is included

   **Đáp án: C.** Đề chưa nói về khối lượng cáp.

4. Choose mass or command: A value in kilograms describes ___.

   **Đáp án: mass.** Kilôgam là đơn vị khối lượng.

5. Which request is useful?

   - A. Ignore the missing detail
   - B. Please confirm what the listed mass includes
   - C. Guarantee every robot works

   **Đáp án: B.** Cần làm rõ thành phần của con số.

### Kiểm tra chủ đề 1 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

A classroom animation shows a sensor detecting a part. A controller sends a command to a motor. A tool note lists a gripper of 2 kg and a part of 1 kg. The sum of those two masses is 3 kg. The note does not say whether cables are included and does not approve any real robot setup.

1. Which device detects the part? (Dựa vào bài đọc.)

   - A. Sensor
   - B. Motor
   - C. Gripper

   **Đáp án: A.** Sensor phát hiện vật.

2. Choose command or mass: The controller sends a ___ to the drive.

   **Đáp án: command.** Command là lệnh điều khiển.

3. Which word describes returned position information?

   - A. Payload
   - B. Deadline
   - C. Feedback

   **Đáp án: C.** Feedback là thông tin trạng thái trả về.

4. Choose actuator or log: A device that creates physical motion is an ___.

   **Đáp án: actuator.** Actuator là cơ cấu chấp hành.

5. What is the context? (Dựa vào bài đọc.)

   - A. A manufacturer approval
   - B. A classroom animation
   - C. A real repair

   **Đáp án: B.** Đề mô tả hoạt hình lớp học.

6. What is the sum of the two listed masses in kg? Write digits only. (Dựa vào bài đọc.)

   **Đáp án: 3.** 2 + 1 = 3 kg.

7. What has not been specified? (Dựa vào bài đọc.)

   - A. Whether cable mass is included
   - B. The gripper mass
   - C. The part mass

   **Đáp án: A.** Khối lượng cáp chưa rõ.

8. Choose reach or gripper: A robot tool that holds a part is a ___.

   **Đáp án: gripper.** Gripper là công cụ giữ vật.

9. Which question should be asked? (Dựa vào bài đọc.)

   - A. Is every robot approved?
   - B. Does the total include cables?
   - C. Can we ignore every condition?

   **Đáp án: B.** Cần làm rõ thành phần khối lượng.

10. Which conclusion is supported? (Dựa vào bài đọc.)

   - A. The two listed masses total 3 kg
   - B. Every robot can carry this setup
   - C. The real setup is approved

   **Đáp án: A.** Chỉ tổng hai khối lượng được xác nhận.

<a id="robotics-cycle-workflow"></a>

## Chủ đề 2: Describing a Cycle

Trình bày trình tự và trao đổi về thời lượng chu trình mô phỏng.

### Bài 2.1: Describing an Automatic Cycle

**Mục tiêu:** Dùng từ chỉ trình tự để mô tả chu trình trong mô phỏng.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| sequence | noun | trình tự các bước | describe a sequence |
| cycle | noun | chu kỳ hoặc một lượt hoạt động | complete a cycle |
| conveyor | noun | băng tải | a conveyor belt |
| position | noun | vị trí | a target position |
| pick | verb | gắp hoặc nhấc lấy | pick a part |
| place | verb | đặt | place a part |
| station | noun | trạm làm việc | an inspection station |
| tray | noun | khay | an empty tray |

#### Ví dụ Anh–Việt

- **sequence:** The sequence has four steps. — Trình tự có bốn bước.
- **cycle:** One cycle ends when the part reaches the tray. — Một chu kỳ kết thúc khi chi tiết tới khay.
- **conveyor:** The conveyor carries the part to the station. — Băng tải đưa chi tiết tới trạm.
- **position:** The arm moves to the target position in the simulation. — Tay máy tới vị trí đích trong mô phỏng.
- **pick:** The animated robot picks a part. — Robot trong hoạt hình gắp một chi tiết.
- **place:** It places the part in a tray. — Nó đặt chi tiết vào khay.
- **station:** The part arrives at the inspection station. — Chi tiết đến trạm kiểm tra.
- **tray:** The tray holds the finished parts. — Khay chứa các chi tiết đã hoàn thành.

#### Cách dùng và mẫu câu

First / Next / Then / Finally đánh dấu trình tự. After + mệnh đề: After the part arrives, the robot picks it. Mô tả chu trình trong bài không phải lệnh vận hành robot thật.

#### Đọc trong ngữ cảnh

In a fictional animation, a conveyor brings one part to a station. Next, the robot picks the part. Then it places the part in a tray. Finally, the display records one completed cycle. The scene repeats with the next part. Students describe the sequence without operating a real machine.

**Yêu cầu:** Nêu 4 bước. Đáp án: băng tải đưa chi tiết → robot gắp → đặt khay → ghi nhận một chu kỳ.

#### Hội thoại đọc phân vai

Tutor: What happens after the part reaches the station?

Mai: The robot picks it.

Tutor: Where does it place the part?

Mai: In the tray.

#### Thực hành

Kể lại chu trình trong 4 câu có từ nối. Mẫu: First, the conveyor brings the part. Next, the robot picks it. Then, it places it in a tray. Finally, the display counts the cycle. Tự kiểm: đúng thứ tự, phân biệt pick và place.

#### Quiz — 5 câu

1. What brings the part to the station? (Dựa vào bài đọc.)

   - A. A conveyor
   - B. A tray label
   - C. A report

   **Đáp án: A.** Conveyor đưa chi tiết đến.

2. Choose pick or place: To take hold of a part for transfer is to ___ it.

   **Đáp án: pick.** Pick là gắp hoặc lấy lên.

3. Where is the part placed? (Dựa vào bài đọc.)

   - A. In a tray
   - B. On the keyboard
   - C. In a database

   **Đáp án: A.** Đặt vào khay.

4. Choose cycle or mass: One complete repetition of the sequence is a ___.

   **Đáp án: cycle.** Cycle là một chu kỳ.

5. What happens last in the described cycle? (Dựa vào bài đọc.)

   - A. The conveyor is manufactured
   - B. The display records completion
   - C. The student operates real hardware

   **Đáp án: B.** Màn hình ghi một chu kỳ hoàn tất.

### Bài 2.2: Reviewing a Cycle with a Teammate

**Mục tiêu:** Trao đổi thời gian, thứ tự và điểm cần xác nhận của chu trình giả lập.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| duration | noun | thời lượng | cycle duration |
| delay | noun | độ trễ; sự chậm | a short delay |
| repeat | verb | lặp lại | repeat the animation |
| order | noun | thứ tự | the correct order |
| before | preposition | trước | before the final step |
| after | preposition | sau | after the first step |
| handover | noun | việc bàn giao thông tin hoặc công việc | a handover note |
| clarify | verb | làm rõ | clarify the timing |

#### Ví dụ Anh–Việt

- **duration:** The cycle duration is twelve seconds. — Thời lượng chu kỳ là mười hai giây.
- **delay:** There is a delay before the final step. — Có một độ trễ trước bước cuối.
- **repeat:** Please repeat the animation for the presentation. — Hãy phát lại hoạt hình để thuyết trình.
- **order:** The steps must be described in the correct order. — Các bước cần được mô tả đúng thứ tự.
- **before:** The robot picks the part before placement. — Robot gắp chi tiết trước khi đặt.
- **after:** The display changes after the first step. — Màn hình thay đổi sau bước đầu.
- **handover:** The handover note lists the remaining questions. — Ghi chú bàn giao liệt kê câu hỏi còn lại.
- **clarify:** Could you clarify the timing of this step? — Bạn có thể làm rõ thời điểm của bước này không?

#### Cách dùng và mẫu câu

Before/after + danh từ hoặc mệnh đề xác định thứ tự. The cycle takes twelve seconds nói thời lượng, không phải giờ trong ngày. I observed ... phân biệt quan sát với mục tiêu thiết kế.

#### Đọc trong ngữ cảnh

A team reviews an animation of a pick-and-place cycle. The recorded cycle takes twelve seconds. The target in the classroom brief is ten seconds. There is a visible delay before placement, but its cause is unknown. The handover note reports the difference and asks the next reviewer to clarify the timing.

**Yêu cầu:** Ghi thời lượng thực tế, mục tiêu và điều chưa rõ. Đáp án: 12 giây, 10 giây; chưa rõ nguyên nhân trễ trước bước đặt.

#### Hội thoại đọc phân vai

Mai: Is the cycle two seconds longer than the target?

Nam: Yes, in this recording.

Mai: Do we know the cause?

Nam: No. We should record the observation and ask for a review.

#### Thực hành

Viết bàn giao 3 câu. Mẫu: The recorded cycle takes 12 seconds. The target is 10 seconds. Please review the delay before placement. Tự kiểm: giữ số và đơn vị, không tự chẩn đoán hỏng động cơ.

#### Quiz — 5 câu

1. How long is the recorded cycle? (Dựa vào bài đọc.)

   - A. Twelve seconds
   - B. Two seconds
   - C. Ten seconds

   **Đáp án: A.** Thời lượng ghi nhận là 12 giây.

2. Choose before or after: The visible delay occurs ___ placement. (Dựa vào bài đọc.)

   **Đáp án: before.** Trễ xảy ra trước bước đặt.

3. What is unknown? (Dựa vào bài đọc.)

   - A. The target duration
   - B. The recorded duration
   - C. The cause of the delay

   **Đáp án: C.** Nguyên nhân chưa rõ.

4. Choose handover or payload: A note transferring work information is a ___ note.

   **Đáp án: handover.** Handover note là ghi chú bàn giao.

5. Which report is accurate? (Dựa vào bài đọc.)

   - A. The motor is definitely broken
   - B. The recorded cycle is two seconds over the target
   - C. Every cycle always takes ten seconds

   **Đáp án: B.** 12 trừ 10 bằng 2, chỉ áp dụng lần ghi nhận.

### Kiểm tra chủ đề 2 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

In a fictional animation, a conveyor brings a part to a station. The robot picks it and places it in a tray. The display counts the completed cycle. One recorded cycle lasts 9 seconds, while the target is 8 seconds. A delay appears before placement; its cause has not been identified.

1. Where is the part placed? (Dựa vào bài đọc.)

   - A. In a report
   - B. In a tray
   - C. On an axis label

   **Đáp án: B.** Chi tiết được đặt vào khay.

2. Choose conveyor or controller: The ___ carries the part to the station. (Dựa vào bài đọc.)

   **Đáp án: conveyor.** Conveyor là băng tải.

3. Which action comes before placement? (Dựa vào bài đọc.)

   - A. Replacing a sensor
   - B. Picking the part
   - C. Writing a handover

   **Đáp án: B.** Pick diễn ra trước place.

4. Choose cycle or cable: One full sequence is a ___.

   **Đáp án: cycle.** Cycle là một chu kỳ.

5. What happens at the end? (Dựa vào bài đọc.)

   - A. The motor is repaired
   - B. The target changes
   - C. The display counts a completed cycle

   **Đáp án: C.** Màn hình ghi nhận chu kỳ hoàn tất.

6. How many seconds longer than the target is the recorded cycle? Write digits. (Dựa vào bài đọc.)

   **Đáp án: 1.** 9 trừ 8 bằng 1 giây.

7. What is not known? (Dựa vào bài đọc.)

   - A. The recorded duration
   - B. The target duration
   - C. The cause of the delay

   **Đáp án: C.** Nguyên nhân trễ chưa được xác định.

8. Choose before or after: The delay occurs ___ placement. (Dựa vào bài đọc.)

   **Đáp án: before.** Trước bước đặt.

9. Which handover is precise? (Dựa vào bài đọc.)

   - A. The motor is broken
   - B. All cycles are perfect
   - C. The recorded cycle is 9 seconds; target 8 seconds

   **Đáp án: C.** Câu nêu số quan sát và mục tiêu, không suy đoán.

10. Which question asks about timing?

   - A. Who made the keyboard?
   - B. Could you clarify the duration of this step?
   - C. What color is the tray?

   **Đáp án: B.** Duration là thời lượng.

<a id="robotics-status-incidents"></a>

## Chủ đề 3: Status and Incident Communication

Đọc trạng thái và viết bàn giao sự cố có người phụ trách.

### Bài 3.1: Reading Status and Alarm Messages

**Mục tiêu:** Đọc trạng thái và mã báo động, mô tả hiện tượng mà không suy đoán nguyên nhân.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| status | noun | trạng thái hiện tại | read the status |
| idle | adjective | đang chờ; chưa chạy tác vụ | an idle system |
| running | adjective | đang chạy | a running cycle |
| stopped | adjective | đã dừng | a stopped cycle |
| alarm | noun | cảnh báo hoặc báo động của hệ thống | an alarm message |
| fault | noun | lỗi hoặc tình trạng bất thường được ghi nhận | a fault code |
| timestamp | noun | mốc thời gian của sự kiện | an event timestamp |
| log | noun | bản ghi sự kiện | read the log |

#### Ví dụ Anh–Việt

- **status:** The screen shows the current status. — Màn hình hiển thị trạng thái hiện tại.
- **idle:** The simulated system is idle. — Hệ mô phỏng đang chờ.
- **running:** The status changes to running. — Trạng thái chuyển sang đang chạy.
- **stopped:** The display reports a stopped cycle. — Màn hình báo chu kỳ đã dừng.
- **alarm:** An alarm message appears on the display. — Một thông báo báo động xuất hiện trên màn hình.
- **fault:** The note records a fault code. — Ghi chú ghi lại một mã lỗi.
- **timestamp:** The timestamp is 09:15. — Mốc thời gian là 09:15.
- **log:** The log lists three status changes. — Bản ghi liệt kê ba lần đổi trạng thái.

#### Cách dùng và mẫu câu

The display shows ... báo điều nhìn thấy. At 09:15, ... gắn thời điểm với sự kiện. A code appears không đủ để kết luận hỏng một bộ phận nếu chưa tra tài liệu đúng hệ thống.

#### Đọc trong ngữ cảnh

A fictional simulator log shows idle at 09:00, running at 09:02, and stopped at 09:15. At 09:15, the screen also shows code X17. The exercise does not define that code. Lan records the exact code and timestamp, and asks for the simulator documentation instead of guessing the cause.

**Yêu cầu:** Ghi trạng thái lúc 09:15, mã và điều chưa biết. Đáp án: stopped, X17; chưa có định nghĩa mã.

#### Hội thoại đọc phân vai

Lan: The simulator shows X17 at 09:15.

Nam: Does that mean the motor is broken?

Lan: We cannot tell from this exercise.

Nam: Let us ask for the code definition.

#### Thực hành

Viết thông báo 3 câu. Mẫu: The simulator stopped at 09:15. It displayed X17. Could you provide the definition of this code? Tự kiểm: mã và giờ chính xác, không tự diễn giải lỗi.

#### Quiz — 5 câu

1. What is the status at 09:15? (Dựa vào bài đọc.)

   - A. Stopped
   - B. Running
   - C. Idle

   **Đáp án: A.** Lúc 09:15 là stopped.

2. Copy the exact alarm code from the passage. (Dựa vào bài đọc.)

   **Đáp án: X17.** Mã được ghi là X17.

3. What should Lan request? (Dựa vào bài đọc.)

   - A. A new motor without checking
   - B. The simulator documentation
   - C. An unrelated chart

   **Đáp án: B.** Cần định nghĩa mã trong tài liệu đúng hệ.

4. Choose timestamp or mass: The recorded time of an event is its ___.

   **Đáp án: timestamp.** Timestamp là mốc thời gian.

5. Which claim is unsupported? (Dựa vào bài đọc.)

   - A. A code appears
   - B. The simulator stopped
   - C. The motor is definitely broken

   **Đáp án: C.** Không có định nghĩa mã để chẩn đoán hỏng động cơ.

### Bài 3.2: Writing an Incident Handover

**Mục tiêu:** Bàn giao sự cố bằng quan sát, phần chưa rõ, người phụ trách và hành động tiếp theo.

#### Từ vựng

| Từ | Loại từ | Nghĩa | Cụm thường dùng |
|---|---|---|---|
| incident | noun | sự cố hoặc sự kiện cần ghi nhận | report an incident |
| observation | noun | điều quan sát được | record an observation |
| unknown | adjective | chưa biết | an unknown cause |
| pending | adjective | đang chờ xử lý hoặc xác nhận | a pending review |
| responsible | adjective | chịu trách nhiệm | be responsible for the review |
| escalate | verb | chuyển vấn đề lên người có trách nhiệm phù hợp | escalate an issue |
| acknowledge | verb | xác nhận đã nhận thông tin | acknowledge a message |
| follow-up | noun | việc theo dõi hoặc trao đổi tiếp | a follow-up meeting |

#### Ví dụ Anh–Việt

- **incident:** We report the simulator incident. — Chúng tôi báo sự cố mô phỏng.
- **observation:** The observation is a blank status field. — Điều quan sát được là ô trạng thái trống.
- **unknown:** The cause is still unknown. — Nguyên nhân vẫn chưa biết.
- **pending:** The review is pending. — Việc xem xét đang chờ xử lý.
- **responsible:** Lan is responsible for the review. — Lan chịu trách nhiệm xem xét.
- **escalate:** We escalate the issue to the supervisor. — Chúng tôi chuyển vấn đề cho người giám sát.
- **acknowledge:** Please acknowledge this handover message. — Hãy xác nhận đã nhận thông tin bàn giao này.
- **follow-up:** The follow-up meeting is tomorrow. — Buổi trao đổi tiếp theo diễn ra ngày mai.

#### Cách dùng và mẫu câu

Observed: ...; Unknown: ...; Next action: ... tách dữ kiện khỏi giả thuyết. Please acknowledge receipt xin xác nhận đã nhận, không có nghĩa vấn đề đã xử lý. Không coi việc bàn giao là cho phép khởi động lại thiết bị.

#### Đọc trong ngữ cảnh

In a classroom simulator, the status field becomes blank after a cycle. Minh writes a handover note: the cycle ended at 14:10, the field is blank, and the cause is unknown. Lan is responsible for reviewing the simulator log tomorrow. Minh requests acknowledgement. The issue remains pending; the note does not claim a fix.

**Yêu cầu:** Nêu quan sát, người phụ trách và trạng thái. Đáp án: ô trạng thái trống; Lan; chờ xem xét.

#### Hội thoại đọc phân vai

Minh: Have you received the handover?

Lan: Yes. I will review the log tomorrow.

Minh: Can I mark the issue as fixed?

Lan: No. The review is still pending.

#### Thực hành

Viết bàn giao 4 dòng. Mẫu: Observed: Blank status after the cycle. Time: 14:10. Owner: Lan. Next action: Review the log tomorrow; cause unknown. Tự kiểm: xác nhận nhận việc không bị diễn đạt thành đã sửa xong.

#### Quiz — 5 câu

1. Who will review the log? (Dựa vào bài đọc.)

   - A. Minh
   - B. Every student
   - C. Lan

   **Đáp án: C.** Lan chịu trách nhiệm.

2. Choose pending or resolved: An issue waiting for review is ___.

   **Đáp án: pending.** Pending là đang chờ.

3. What is the observed problem? (Dựa vào bài đọc.)

   - A. A confirmed broken motor
   - B. A blank status field
   - C. A missing gripper

   **Đáp án: B.** Quan sát là ô trạng thái trống.

4. Choose acknowledge or repair: To confirm receipt of a message is to ___ it.

   **Đáp án: acknowledge.** Acknowledge là xác nhận đã nhận.

5. Does the handover say the issue is fixed? (Dựa vào bài đọc.)

   - A. Yes, the cause is known
   - B. No, review is still pending
   - C. Yes, acknowledgement proves a fix

   **Đáp án: B.** Chưa có kết quả sửa; vẫn chờ xem xét.

### Kiểm tra chủ đề 3 — 10 câu

**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**

A fictional simulator is idle at 10:00, running at 10:03, and stopped at 10:08. Code Q4 appears at 10:08. Its meaning is not supplied. An records the code and asks Binh to review the documentation tomorrow. Binh acknowledges receipt. The review is pending and no fix has been confirmed.

1. What is the status at 10:08? (Dựa vào bài đọc.)

   - A. Running
   - B. Stopped
   - C. Idle

   **Đáp án: B.** 10:08 trạng thái stopped.

2. Copy the displayed code. (Dựa vào bài đọc.)

   **Đáp án: Q4.** Mã Q4 được nêu trong bài.

3. Can the cause be inferred from the undefined code alone? (Dựa vào bài đọc.)

   - A. Yes, always
   - B. No
   - C. Yes, it must be the motor

   **Đáp án: B.** Mã chưa có định nghĩa.

4. Choose timestamp or payload: 10:08 is the event ___. (Dựa vào bài đọc.)

   **Đáp án: timestamp.** Đây là mốc thời gian.

5. What should be consulted for the code meaning? (Dựa vào bài đọc.)

   - A. An unrelated drawing
   - B. A random price list
   - C. The simulator documentation

   **Đáp án: C.** Cần tài liệu của mô phỏng.

6. Who will review the documentation? Copy the name. (Dựa vào bài đọc.)

   **Đáp án: Binh.** Binh nhận việc xem tài liệu.

7. What does acknowledgement establish?

   - A. A confirmed repair
   - B. A known cause
   - C. Receipt of the message

   **Đáp án: C.** Chỉ xác nhận đã nhận thông tin.

8. Choose pending or fixed: The review is still ___. (Dựa vào bài đọc.)

   **Đáp án: pending.** Review còn chờ.

9. Which claim would be premature? (Dựa vào bài đọc.)

   - A. Q4 appeared
   - B. Binh received the message
   - C. The issue has been fixed

   **Đáp án: C.** Chưa xác nhận bản sửa.

10. Which note separates facts from unknowns? (Dựa vào bài đọc.)

   - A. Everything is solved
   - B. Q4 at 10:08; cause unknown; review pending
   - C. Q4 proves a broken motor

   **Đáp án: B.** Câu tách quan sát, điều chưa biết và trạng thái.

## Nguồn đối chiếu khái niệm

- [Universal Robots — Payload](https://www.universal-robots.com/manuals/EN/HTML/SW10_12_1/Content/prod-usr-man/software/PolyScopeX/polyx-basic/polyx-payload.htm): Đối chiếu việc khai báo payload gồm các thành phần gắn vào mặt bích công cụ. Khối lượng giả lập trong bài không dùng để đánh giá tải cho robot thật.

Nguồn giúp rà soát khái niệm; không chứng nhận chất lượng bộ học liệu hoặc thay thế giáo viên/chuyên gia duyệt nội dung.

