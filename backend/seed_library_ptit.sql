USE library_ptit;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE audit_logs;
TRUNCATE TABLE fines;
TRUNCATE TABLE reservations;
TRUNCATE TABLE loans;
TRUNCATE TABLE books;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;

-- 1. NẠP 9 THỂ LOẠI CHUYÊN NGÀNH TỪ seed_books_3
INSERT INTO categories (id, name) VALUES
(1, 'An toàn thông tin'),
(2, 'Công nghệ phần mềm'),
(3, 'Hệ thống và CSDL'),
(4, 'Kinh tế và Quản trị'),
(5, 'Lập trình'),
(6, 'Mạng và Viễn thông'),
(7, 'Phát triển web'),
(8, 'Thuật toán và Toán'),
(9, 'Trí tuệ nhân tạo');

-- 2. NẠP 14 TÀI KHOẢN (MẬT KHẨU CHUNG: secret)
INSERT INTO users (id, username, email, password_hash, full_name, role, is_locked) VALUES
(1, 'admin', 'admin@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Quản trị viên Hệ thống', 'ADMIN', FALSE),
(2, 'thuthu01', 'librarian@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Nguyễn Thị Minh Thư', 'LIBRARIAN', FALSE),
(3, 'thuthu02', 'librarian2@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Lê Hoàng Nam', 'LIBRARIAN', FALSE),
(4, 'B22DCCN001', 'reader1@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Trần Minh Khôi', 'READER', FALSE),
(5, 'B22DCCN002', 'reader2@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Nguyễn Hoàng Thành', 'READER', FALSE),
(6, 'B22DCCN003', 'reader3@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Phạm Thảo Vy', 'READER', FALSE),
(7, 'B22DCCN004', 'reader4@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Vũ Đức Anh', 'READER', FALSE),
(8, 'B22DCCN005', 'reader5@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Đặng Thu Hà', 'READER', FALSE),
(9, 'B22DCCN006', 'reader6@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Hoàng Gia Bảo', 'READER', FALSE),
(10, 'B22DCCN007', 'reader7@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Bùi Khánh Linh', 'READER', FALSE),
(11, 'B22DCCN008', 'reader8@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Ngô Quang Huy', 'READER', FALSE),
(12, 'B22DCCN009', 'reader9@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Đỗ Phương Thảo', 'READER', FALSE),
(13, 'B22DCCN010', 'reader10@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Trịnh Tuấn Kiệt', 'READER', FALSE),
(14, 'B22DCCN099', 'locked@ptit.edu.vn', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Tài khoản Bị Khóa', 'READER', TRUE);

-- 3. NẠP 33 ĐẦU SÁCH TỪ seed_books_3 (ĐỒNG BỘ CẢ cover_url VÀ image_url)
INSERT INTO books (id, title, author, category_id, total_copies, available_copies, image_url, cover_url, isbn, publisher, publication_year, description) VALUES
(1,  'The C Programming Language', 'Brian W. Kernighan, Dennis M. Ritchie', 5, 4, 2, 'https://covers.openlibrary.org/b/id/5732572-L.jpg', 'https://covers.openlibrary.org/b/id/5732572-L.jpg', '9780131103627', 'Prentice Hall', 1988, 'Cuốn sách kinh điển về ngôn ngữ C do chính tác giả ngôn ngữ biên soạn.'),
(2,  'Clean Code', 'Robert C. Martin', 5, 8, 7, 'https://covers.openlibrary.org/b/id/15126503-L.jpg', 'https://covers.openlibrary.org/b/id/15126503-L.jpg', '9780132350884', 'Prentice Hall', 2008, 'Nguyên tắc và thực hành viết mã nguồn sạch, dễ đọc, dễ bảo trì.'),
(3,  'Effective Java (3rd Edition)', 'Joshua Bloch', 5, 4, 3, 'https://covers.openlibrary.org/b/id/12420356-L.jpg', 'https://covers.openlibrary.org/b/id/12420356-L.jpg', '9780134685991', 'Addison-Wesley', 2018, 'Các thực hành tốt nhất khi lập trình Java, phù hợp với học phần Java và Spring Boot.'),
(4,  'The Pragmatic Programmer (20th Anniversary Edition)', 'David Thomas, Andrew Hunt', 5, 6, 6, '/covers/the-pragmatic-programmer-20th-anniversary-edition.svg', '/covers/the-pragmatic-programmer-20th-anniversary-edition.svg', '9780135957059', 'Addison-Wesley', 2019, 'Tư duy và thói quen làm việc của lập trình viên chuyên nghiệp.'),
(5,  'Python Crash Course (2nd Edition)', 'Eric Matthes', 5, 9, 8, 'https://covers.openlibrary.org/b/id/8800209-L.jpg', 'https://covers.openlibrary.org/b/id/8800209-L.jpg', '9781593279288', 'No Starch Press', 2019, 'Giáo trình nhập môn Python qua các dự án thực hành.'),
(6,  'JavaScript: The Good Parts', 'Douglas Crockford', 7, 10, 10, 'https://covers.openlibrary.org/b/id/2536428-L.jpg', 'https://covers.openlibrary.org/b/id/2536428-L.jpg', '9780596517748', 'O''Reilly Media', 2008, 'Những phần cốt lõi, đáng dùng của JavaScript.'),
(7,  'Designing Data-Intensive Applications', 'Martin Kleppmann', 7, 10, 9, 'https://covers.openlibrary.org/b/id/8434671-L.jpg', 'https://covers.openlibrary.org/b/id/8434671-L.jpg', '9781449373320', 'O''Reilly Media', 2017, 'Nền tảng thiết kế hệ thống dữ liệu, dịch vụ web và hệ thống phân tán.'),
(8,  'Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 2, 6, 5, 'https://covers.openlibrary.org/b/id/10827044-L.jpg', 'https://covers.openlibrary.org/b/id/10827044-L.jpg', '9780201633610', 'Addison-Wesley', 1994, '23 mẫu thiết kế hướng đối tượng kinh điển.'),
(9,  'Software Engineering (9th Edition)', 'Ian Sommerville', 2, 3, 2, '/covers/software-engineering-9th-edition.svg', '/covers/software-engineering-9th-edition.svg', '9780137035151', 'Pearson', 2010, 'Giáo trình công nghệ phần mềm: quy trình, yêu cầu, thiết kế, kiểm thử.'),
(10, 'Introduction to Algorithms (3rd Edition)', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', 8, 4, 4, 'https://covers.openlibrary.org/b/id/11106524-L.jpg', 'https://covers.openlibrary.org/b/id/11106524-L.jpg', '9780262033848', 'MIT Press', 2009, 'Giáo trình thuật toán và cấu trúc dữ liệu được dùng rộng rãi nhất.'),
(11, 'Algorithms (4th Edition)', 'Robert Sedgewick, Kevin Wayne', 8, 4, 3, 'https://covers.openlibrary.org/b/id/7992499-L.jpg', 'https://covers.openlibrary.org/b/id/7992499-L.jpg', '9780321573513', 'Addison-Wesley', 2011, 'Thuật toán và cấu trúc dữ liệu kèm cài đặt Java.'),
(12, 'Discrete Mathematics and Its Applications (7th Edition)', 'Kenneth H. Rosen', 8, 7, 7, 'https://covers.openlibrary.org/b/id/9663849-L.jpg', 'https://covers.openlibrary.org/b/id/9663849-L.jpg', '9780073383095', 'McGraw-Hill', 2012, 'Toán rời rạc: logic, tập hợp, đồ thị, tổ hợp.'),
(13, 'Computer Networking: A Top-Down Approach (7th Edition)', 'James F. Kurose, Keith W. Ross', 6, 4, 4, 'https://covers.openlibrary.org/b/id/8509058-L.jpg', 'https://covers.openlibrary.org/b/id/8509058-L.jpg', '9780133594140', 'Pearson', 2016, 'Mạng máy tính tiếp cận từ tầng ứng dụng xuống tầng vật lý.'),
(14, 'Computer Networks (5th Edition)', 'Andrew S. Tanenbaum, David J. Wetherall', 6, 10, 10, '/covers/computer-networks-5th-edition.svg', '/covers/computer-networks-5th-edition.svg', '9780132126953', 'Pearson', 2010, 'Giáo trình mạng máy tính theo mô hình phân tầng.'),
(15, 'Fundamentals of Wireless Communication', 'David Tse, Pramod Viswanath', 6, 3, 3, 'https://covers.openlibrary.org/b/id/359109-L.jpg', 'https://covers.openlibrary.org/b/id/359109-L.jpg', '9780521845274', 'Cambridge University Press', 2005, 'Cơ sở lý thuyết của truyền thông vô tuyến hiện đại.'),
(16, 'Digital Communications (5th Edition)', 'John G. Proakis, Masoud Salehi', 6, 10, 10, 'https://covers.openlibrary.org/b/id/2317868-L.jpg', 'https://covers.openlibrary.org/b/id/2317868-L.jpg', '9780072957167', 'McGraw-Hill', 2008, 'Điều chế, mã hóa kênh và truyền dẫn số.'),
(17, 'Wireless Communications: Principles and Practice (2nd Edition)', 'Theodore S. Rappaport', 6, 8, 8, 'https://covers.openlibrary.org/b/id/83070-L.jpg', 'https://covers.openlibrary.org/b/id/83070-L.jpg', '9780130422323', 'Prentice Hall', 2002, 'Nguyên lý và thực hành thông tin di động.'),
(18, 'Signals and Systems (2nd Edition)', 'Alan V. Oppenheim, Alan S. Willsky', 6, 6, 6, 'https://covers.openlibrary.org/b/id/92117-L.jpg', 'https://covers.openlibrary.org/b/id/92117-L.jpg', '9780138147570', 'Prentice Hall', 1996, 'Tín hiệu và hệ thống: nền tảng của xử lý tín hiệu.'),
(19, 'Database System Concepts (6th Edition)', 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', 3, 9, 9, 'https://covers.openlibrary.org/b/id/8635569-L.jpg', 'https://covers.openlibrary.org/b/id/8635569-L.jpg', '9780073523323', 'McGraw-Hill', 2010, 'Giáo trình cơ sở dữ liệu: mô hình quan hệ, SQL, giao dịch.'),
(20, 'Operating System Concepts (9th Edition)', 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', 3, 7, 7, 'https://covers.openlibrary.org/b/id/7298708-L.jpg', 'https://covers.openlibrary.org/b/id/7298708-L.jpg', '9781118063330', 'Wiley', 2012, 'Giáo trình hệ điều hành: tiến trình, bộ nhớ, tệp, đồng bộ hóa.'),
(21, 'Modern Operating Systems (4th Edition)', 'Andrew S. Tanenbaum, Herbert Bos', 3, 8, 8, 'https://covers.openlibrary.org/b/id/7294469-L.jpg', 'https://covers.openlibrary.org/b/id/7294469-L.jpg', '9780133591620', 'Pearson', 2014, 'Hệ điều hành hiện đại với nhiều ví dụ thực tế.'),
(22, 'Computer Organization and Design: The Hardware/Software Interface (5th Edition)', 'David A. Patterson, John L. Hennessy', 3, 8, 8, 'https://covers.openlibrary.org/b/id/8092095-L.jpg', 'https://covers.openlibrary.org/b/id/8092095-L.jpg', '9780124077263', 'Morgan Kaufmann', 2013, 'Kiến trúc máy tính và giao diện phần cứng, phần mềm.'),
(23, 'Cryptography and Network Security: Principles and Practice (7th Edition)', 'William Stallings', 1, 9, 9, 'https://covers.openlibrary.org/b/id/10152467-L.jpg', 'https://covers.openlibrary.org/b/id/10152467-L.jpg', '9780134444284', 'Pearson', 2016, 'Mật mã học và an ninh mạng: nguyên lý và thực hành.'),
(24, 'Security Engineering (2nd Edition)', 'Ross Anderson', 1, 4, 4, 'https://covers.openlibrary.org/b/id/4970809-L.jpg', 'https://covers.openlibrary.org/b/id/4970809-L.jpg', '9780470068526', 'Wiley', 2008, 'Hướng dẫn xây dựng hệ thống tin cậy trước các tác nhân tấn công.'),
(25, 'Applied Cryptography (2nd Edition)', 'Bruce Schneier', 1, 8, 8, 'https://covers.openlibrary.org/b/id/300930-L.jpg', 'https://covers.openlibrary.org/b/id/300930-L.jpg', '9780471117094', 'Wiley', 1996, 'Giao thức, thuật toán và mã nguồn mật mã học.'),
(26, 'Cơ sở an toàn thông tin', 'Hoàng Xuân Dậu', 1, 2, 0, '/covers/co-so-an-toan-thong-tin.svg', '/covers/co-so-an-toan-thong-tin.svg', NULL, 'NXB Thông tin và Truyền thông', 2020, 'Giáo trình của Học viện Công nghệ Bưu chính Viễn thông về các khái niệm nền tảng của an toàn thông tin.'),
(27, 'Artificial Intelligence: A Modern Approach (3rd Edition)', 'Stuart Russell, Peter Norvig', 9, 7, 7, 'https://covers.openlibrary.org/b/id/6926355-L.jpg', 'https://covers.openlibrary.org/b/id/6926355-L.jpg', '9780136042594', 'Pearson', 2009, 'Giáo trình trí tuệ nhân tạo toàn diện nhất hiện nay.'),
(28, 'Deep Learning', 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', 9, 7, 7, 'https://covers.openlibrary.org/b/id/8183675-L.jpg', 'https://covers.openlibrary.org/b/id/8183675-L.jpg', '9780262035613', 'MIT Press', 2016, 'Nền tảng toán học và kỹ thuật học sâu.'),
(29, 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow (2nd Edition)', 'Aurélien Géron', 9, 10, 10, 'https://covers.openlibrary.org/b/id/9388208-L.jpg', 'https://covers.openlibrary.org/b/id/9388208-L.jpg', '9781492032649', 'O''Reilly Media', 2019, 'Học máy qua thực hành với Python.'),
(30, 'Pattern Recognition and Machine Learning', 'Christopher M. Bishop', 9, 5, 5, 'https://covers.openlibrary.org/b/id/245089-L.jpg', 'https://covers.openlibrary.org/b/id/245089-L.jpg', '9780387310732', 'Springer', 2006, 'Nhận dạng mẫu và học máy theo hướng xác suất.'),
(31, 'Principles of Economics (8th Edition)', 'N. Gregory Mankiw', 4, 7, 7, 'https://covers.openlibrary.org/b/id/10319849-L.jpg', 'https://covers.openlibrary.org/b/id/10319849-L.jpg', '9781305585126', 'Cengage Learning', 2017, 'Nguyên lý kinh tế học vi mô và vĩ mô.'),
(32, 'Giáo trình Thông tin di động', 'Nguyễn Phạm Anh Dũng', 6, 1, 0, '/covers/giao-trinh-thong-tin-di-ong.svg', '/covers/giao-trinh-thong-tin-di-ong.svg', NULL, 'NXB Bưu điện', 2001, 'Giáo trình thông tin di động của Học viện Công nghệ Bưu chính Viễn thông.'),
(33, 'Lý thuyết trải phổ và đa truy nhập vô tuyến', 'Nguyễn Phạm Anh Dũng', 6, 8, 8, '/covers/ly-thuyet-trai-pho-va-a-truy-nhap-vo-tuyen.svg', '/covers/ly-thuyet-trai-pho-va-a-truy-nhap-vo-tuyen.svg', NULL, 'Học viện Công nghệ Bưu chính Viễn thông', 2006, 'Tài liệu về kỹ thuật trải phổ và các phương pháp đa truy nhập vô tuyến.');

-- 4. NẠP PHIẾU MƯỢN / TRẢ 6 THÁNG GẦN NHẤT (KHỚP ID 1..33)
INSERT INTO loans (id, user_id, book_id, status, days, extension_count, borrow_date, due_date, return_date, approved_by, created_at) VALUES
(1,  4, 26, 'BORROWING', 7,  0, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL, 2, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2,  5, 26, 'BORROWING', 7,  0, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL, 2, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(3,  6, 32, 'BORROWING', 7,  0, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL, 2, DATE_SUB(NOW(), INTERVAL 10 DAY)),

(4,  4, 1,  'BORROWING', 14, 0, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  DATE_ADD(CURDATE(), INTERVAL 12 DAY), NULL, 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5,  5, 1,  'BORROWING', 14, 0, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  DATE_ADD(CURDATE(), INTERVAL 11 DAY), NULL, 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(6,  6, 2,  'BORROWING', 14, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY),  DATE_ADD(CURDATE(), INTERVAL 16 DAY), NULL, 2, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7,  7, 3,  'BORROWING', 14, 0, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  DATE_ADD(CURDATE(), INTERVAL 13 DAY), NULL, 3, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(8,  8, 5,  'BORROWING', 30, 0, DATE_SUB(CURDATE(), INTERVAL 4 DAY),  DATE_ADD(CURDATE(), INTERVAL 26 DAY), NULL, 3, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(9,  9, 7,  'BORROWING', 14, 0, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  DATE_ADD(CURDATE(), INTERVAL 12 DAY), NULL, 3, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10, 10, 8, 'BORROWING', 14, 0, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  DATE_ADD(CURDATE(), INTERVAL 11 DAY), NULL, 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(11, 11, 9, 'BORROWING', 14, 0, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  DATE_ADD(CURDATE(), INTERVAL 13 DAY), NULL, 2, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(12, 12, 11,'BORROWING', 14, 0, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  DATE_ADD(CURDATE(), INTERVAL 12 DAY), NULL, 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),

(13, 4,  2,  'PENDING', 7,  0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(14, 5,  4,  'PENDING', 14, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(15, 7,  10, 'PENDING', 7,  0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(16, 8,  13, 'PENDING', 14, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 40 MINUTE)),
(17, 13, 19, 'PENDING', 30, 0, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 15 MINUTE)),

(18, 4,  2, 'RETURNED', 7, 0, DATE_SUB(CURDATE(), INTERVAL 12 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 2, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(19, 5,  3, 'RETURNED', 7, 0, DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_SUB(CURDATE(), INTERVAL 4 DAY), 2, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(20, 6,  2, 'RETURNED', 7, 0, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY), 3, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(21, 7,  5, 'REJECTED', 7, 0, NULL, NULL, NULL, 2, DATE_SUB(NOW(), INTERVAL 6 DAY)),

(22, 8,  2, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 38 DAY), DATE_SUB(CURDATE(), INTERVAL 24 DAY), DATE_SUB(CURDATE(), INTERVAL 22 DAY), 2, DATE_SUB(NOW(), INTERVAL 38 DAY)),
(23, 9,  3, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_SUB(CURDATE(), INTERVAL 26 DAY), DATE_SUB(CURDATE(), INTERVAL 26 DAY), 2, DATE_SUB(NOW(), INTERVAL 40 DAY)),
(24, 10, 5, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 42 DAY), DATE_SUB(CURDATE(), INTERVAL 28 DAY), DATE_SUB(CURDATE(), INTERVAL 24 DAY), 3, DATE_SUB(NOW(), INTERVAL 42 DAY)),
(25, 11, 10,'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_SUB(CURDATE(), INTERVAL 31 DAY), DATE_SUB(CURDATE(), INTERVAL 31 DAY), 3, DATE_SUB(NOW(), INTERVAL 45 DAY)),
(26, 12, 13,'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 48 DAY), DATE_SUB(CURDATE(), INTERVAL 34 DAY), DATE_SUB(CURDATE(), INTERVAL 35 DAY), 2, DATE_SUB(NOW(), INTERVAL 48 DAY)),

(27, 4,  3, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 68 DAY), DATE_SUB(CURDATE(), INTERVAL 54 DAY), DATE_SUB(CURDATE(), INTERVAL 54 DAY), 2, DATE_SUB(NOW(), INTERVAL 68 DAY)),
(28, 5,  5, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 70 DAY), DATE_SUB(CURDATE(), INTERVAL 56 DAY), DATE_SUB(CURDATE(), INTERVAL 54 DAY), 3, DATE_SUB(NOW(), INTERVAL 70 DAY)),
(29, 6,  10,'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 72 DAY), DATE_SUB(CURDATE(), INTERVAL 58 DAY), DATE_SUB(CURDATE(), INTERVAL 59 DAY), 2, DATE_SUB(NOW(), INTERVAL 72 DAY)),
(30, 7,  2, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 75 DAY), DATE_SUB(CURDATE(), INTERVAL 61 DAY), DATE_SUB(CURDATE(), INTERVAL 61 DAY), 2, DATE_SUB(NOW(), INTERVAL 75 DAY)),

(31, 8,  13,'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 98 DAY),  DATE_SUB(CURDATE(), INTERVAL 84 DAY), DATE_SUB(CURDATE(), INTERVAL 81 DAY), 3, DATE_SUB(NOW(), INTERVAL 98 DAY)),
(32, 9,  2, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 102 DAY), DATE_SUB(CURDATE(), INTERVAL 88 DAY), DATE_SUB(CURDATE(), INTERVAL 88 DAY), 2, DATE_SUB(NOW(), INTERVAL 102 DAY)),
(33, 10, 3, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 105 DAY), DATE_SUB(CURDATE(), INTERVAL 91 DAY), DATE_SUB(CURDATE(), INTERVAL 89 DAY), 2, DATE_SUB(NOW(), INTERVAL 105 DAY)),

(34, 11, 5, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 128 DAY), DATE_SUB(CURDATE(), INTERVAL 114 DAY), DATE_SUB(CURDATE(), INTERVAL 114 DAY), 3, DATE_SUB(NOW(), INTERVAL 128 DAY)),
(35, 12, 10,'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 132 DAY), DATE_SUB(CURDATE(), INTERVAL 118 DAY), DATE_SUB(CURDATE(), INTERVAL 114 DAY), 2, DATE_SUB(NOW(), INTERVAL 132 DAY)),
(36, 13, 13,'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 135 DAY), DATE_SUB(CURDATE(), INTERVAL 121 DAY), DATE_SUB(CURDATE(), INTERVAL 122 DAY), 2, DATE_SUB(NOW(), INTERVAL 135 DAY)),

(37, 4,  5, 'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 158 DAY), DATE_SUB(CURDATE(), INTERVAL 144 DAY), DATE_SUB(CURDATE(), INTERVAL 142 DAY), 2, DATE_SUB(NOW(), INTERVAL 158 DAY)),
(38, 5,  10,'RETURNED', 14, 0, DATE_SUB(CURDATE(), INTERVAL 162 DAY), DATE_SUB(CURDATE(), INTERVAL 148 DAY), DATE_SUB(CURDATE(), INTERVAL 148 DAY), 3, DATE_SUB(NOW(), INTERVAL 162 DAY));

-- 5. NẠP TIỀN PHẠT
INSERT INTO fines (id, loan_id, amount, paid) VALUES
(1, 18, 10000, FALSE),
(2, 19, 15000, FALSE),
(3, 22, 10000, FALSE),
(4, 24, 20000, FALSE),
(5, 28, 10000, TRUE),
(6, 31, 15000, TRUE),
(7, 33, 10000, TRUE),
(8, 35, 20000, TRUE),
(9, 37, 10000, TRUE);

-- 6. NẠP ĐẶT TRƯỚC SÁCH (CHO 2 CUỐN HẾT BẢN: #26 Cơ sở an toàn thông tin & #32 Giáo trình Thông tin di động)
INSERT INTO reservations (id, user_id, book_id, status, created_at, hold_expires_at) VALUES
(1, 7, 26, 'WAITING', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
(2, 8, 26, 'WAITING', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
(3, 9, 32, 'WAITING', DATE_SUB(NOW(), INTERVAL 5 HOUR), NULL);

-- 7. NẠP NHẬT KÝ HỆ THỐNG
INSERT INTO audit_logs (id, actor_id, action, detail, created_at) VALUES
(1, 1, 'SEED_DATABASE', 'SYSTEM: Nạp bộ 33 đầu sách chuyên ngành PTIT từ seed_books_3', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 2, 'APPROVE_LOAN',  'LOAN: Duyệt phiếu mượn ID 4 cho độc giả B22DCCN001', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 2, 'COLLECT_FINE',  'FINE: Xác nhận thu 10.000đ tiền phạt phiếu mượn ID 37', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 3, 'RETURN_LOAN',   'LOAN: Nhận trả sách phiếu mượn ID 20 đúng hạn', DATE_SUB(NOW(), INTERVAL 8 DAY));

SET FOREIGN_KEY_CHECKS = 1;