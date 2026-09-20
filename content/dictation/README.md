# Dictation: Introductions

Audio `introductions.mp3` là giọng đọc tổng hợp có nội dung nói, không phải fixture im lặng. Tạo local bằng Windows System.Speech, giọng Microsoft Zira Desktop, rate -2; chuyển WAV sang MP3 96 kbps bằng FFmpeg 4.1.0. Không dùng bản thu hoặc giọng sao chép của một cá nhân.

Kịch bản mới do dự án biên soạn để sử dụng trong demo, không trích từ giáo trình/bản thu có bản quyền. Nhóm dự án cho phép sử dụng và phân phối tệp mẫu này cùng mã nguồn PBL6. Chưa qua thẩm định giáo viên.

Transcript: **Good morning. My name is Anna. I am a student. I study English every day. My classroom is next to the library.**

`npm run db:dictation-demo` upload vào bucket private và tạo một Dictation gắn với bài bootstrap Hello and introductions; chỉ chạy local sau `db:bootstrap`. Chạy lại không thay đổi phiên bản đã xuất bản. Transcript này là nguồn soạn mẫu trong repo, không được frontend import hoặc đưa vào bundle.
