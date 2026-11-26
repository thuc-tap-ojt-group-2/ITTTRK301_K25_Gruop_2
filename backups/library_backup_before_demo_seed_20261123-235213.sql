-- PTIT Library backup before demo seeding
-- Created: 2026-11-23T23:52:14

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_id` bigint DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_audit_logs_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (1, NULL, 'LOGIN_FAILED', 'AUTH: Đăng nhập thất bại', '2026-11-17 03:48:04');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (2, NULL, 'LOGIN_FAILED', 'AUTH: Đăng nhập thất bại', '2026-11-17 03:48:06');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (3, NULL, 'LOGIN_FAILED', 'AUTH: Đăng nhập thất bại', '2026-11-17 03:48:06');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (4, NULL, 'LOGIN_FAILED', 'AUTH: Đăng nhập thất bại', '2026-11-17 03:48:06');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (5, NULL, 'LOGIN_FAILED', 'AUTH: Đăng nhập thất bại', '2026-11-17 03:48:11');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (6, 10, 'REGISTER', 'USER: Đăng ký tài khoản độc giả', '2026-11-17 03:48:35');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (7, NULL, 'LOGIN_FAILED', 'AUTH: Đăng nhập thất bại', '2026-11-17 04:00:09');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (8, 5, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 04:02:25');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (9, 5, 'CREATE_LOAN', 'LOAN: Tạo phiếu mượn ID 1', '2026-11-17 04:03:09');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (10, 5, 'CREATE_LOAN', 'LOAN: Tạo phiếu mượn ID 2', '2026-11-17 04:04:33');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (11, 5, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-17 14:27:11');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (12, NULL, 'LOGIN_FAILED', 'AUTH: Đăng nhập thất bại', '2026-11-17 14:28:46');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (13, NULL, 'LOGIN_FAILED', 'AUTH: Đăng nhập thất bại', '2026-11-17 14:30:48');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (14, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:32:08');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (15, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:32:09');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (16, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:32:09');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (17, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:33:25');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (18, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-17 14:34:09');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (19, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:34:14');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (20, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-17 14:34:18');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (21, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:34:22');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (22, 13, 'CREATE_LOAN', 'LOAN: Tạo phiếu mượn ID 3', '2026-11-17 14:34:27');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (23, 13, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-17 14:34:31');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (24, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:34:34');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (25, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:34:56');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (26, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:34:57');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (27, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:34:57');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (28, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:36:02');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (29, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:41:23');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (30, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-17 14:42:55');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (31, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-17 14:42:59');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (32, 11, 'LOCK_USER', 'USER: Khóa tài khoản 3', '2026-11-17 14:45:14');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (33, 11, 'UNLOCK_USER', 'USER: Mở khóa tài khoản 3', '2026-11-17 14:45:18');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (34, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-18 03:29:57');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (35, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-19 14:32:39');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (36, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-19 14:34:09');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (37, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-19 14:35:49');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (38, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-19 14:39:59');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (39, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-19 14:40:08');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (40, 13, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-19 14:40:19');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (41, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-19 14:40:25');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (42, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-19 14:41:57');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (43, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-19 15:07:18');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (44, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 03:24:40');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (45, 14, 'REGISTER', 'USER: Đăng ký tài khoản độc giả', '2026-11-20 03:34:54');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (46, 14, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 03:35:03');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (47, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 03:37:08');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (48, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 03:38:58');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (49, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 03:40:47');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (50, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 03:41:19');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (51, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 03:41:54');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (52, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 03:42:01');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (53, 13, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 03:42:37');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (54, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 03:42:45');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (55, 12, 'APPROVE_LOAN', 'LOAN: Duyệt phiếu mượn ID 3', '2026-11-20 03:42:57');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (56, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 03:43:03');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (57, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 03:43:10');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (58, 13, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 03:44:34');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (59, 14, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 04:39:37');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (60, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 12:10:05');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (61, 11, 'RETURN_LOAN', 'LOAN: Nhận trả phiếu mượn ID 3; tiền phạt 0đ', '2026-11-20 12:10:35');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (62, 11, 'APPROVE_LOAN', 'LOAN: Duyệt phiếu mượn ID 2', '2026-11-20 12:10:42');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (63, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 12:11:22');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (64, 15, 'REGISTER', 'USER: Đăng ký tài khoản độc giả', '2026-11-20 13:57:02');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (65, 16, 'REGISTER', 'USER: Đăng ký tài khoản độc giả', '2026-11-20 13:57:36');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (66, 16, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 13:57:50');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (67, 17, 'REGISTER', 'USER: Đăng ký tài khoản độc giả', '2026-11-20 14:02:34');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (68, 17, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 14:03:51');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (69, 17, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 14:03:59');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (70, 18, 'REGISTER', 'USER: Đăng ký tài khoản độc giả', '2026-11-20 14:47:09');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (71, 18, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 14:47:17');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (72, 18, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 14:48:49');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (73, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 14:48:57');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (74, 11, 'ADD_BOOK', 'Thêm sách mới: ''nakjbdac'' (ID: 18, Số bản: 1)', '2026-11-20 14:49:57');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (75, 11, 'UPDATE_USER_ROLE', 'USER: Đổi vai trò tài khoản 18: READER -> ADMIN', '2026-11-20 14:51:49');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (76, 11, 'UPDATE_USER_ROLE', 'USER: Đổi vai trò tài khoản 2: ADMIN -> READER', '2026-11-20 14:52:24');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (77, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 14:55:53');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (78, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 14:56:00');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (79, 12, 'RETURN_LOAN', 'LOAN: Nhận trả phiếu mượn ID 2; tiền phạt 0đ', '2026-11-20 14:56:43');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (80, 12, 'APPROVE_LOAN', 'LOAN: Duyệt phiếu mượn ID 1', '2026-11-20 14:56:48');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (81, 12, 'RETURN_LOAN', 'LOAN: Nhận trả phiếu mượn ID 1; tiền phạt 0đ', '2026-11-20 14:56:52');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (82, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 14:59:21');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (83, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 14:59:24');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (84, 11, 'LOCK_USER', 'USER: Khóa tài khoản 2', '2026-11-20 14:59:35');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (85, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 14:59:44');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (86, 5, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 15:00:16');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (87, 5, 'CREATE_LOAN', 'LOAN: Tạo phiếu mượn ID 4', '2026-11-20 15:00:52');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (88, 5, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 15:09:55');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (89, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 15:39:13');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (90, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 15:39:36');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (91, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 15:39:40');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (92, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 15:39:58');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (93, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-20 15:40:04');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (94, 13, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-20 15:41:00');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (95, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-21 04:47:19');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (96, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-21 04:52:47');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (97, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-21 04:56:56');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (98, 11, 'APPROVE_LOAN', 'LOAN: Duyệt phiếu mượn ID 4', '2026-11-21 04:57:52');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (99, 11, 'RETURN_LOAN', 'LOAN: Nhận trả phiếu mượn ID 4; tiền phạt 0đ', '2026-11-21 04:58:40');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (100, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-21 04:58:49');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (101, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-21 04:58:54');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (102, 13, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-21 04:59:04');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (103, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-21 05:14:23');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (104, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-21 05:14:47');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (105, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-21 05:14:51');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (106, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 06:05:27');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (107, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 06:06:58');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (108, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 06:07:14');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (109, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 06:07:35');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (110, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 06:20:59');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (111, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 06:21:10');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (112, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 06:21:56');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (113, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 06:23:33');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (114, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 06:23:39');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (115, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 06:33:02');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (116, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 06:33:51');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (117, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 06:33:56');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (118, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 06:58:28');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (119, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 07:03:50');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (120, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 07:13:37');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (121, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 07:19:54');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (122, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 07:20:25');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (123, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 07:48:40');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (124, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 07:49:02');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (125, 11, 'LOCK_USER', 'USER: Khóa tài khoản 16', '2026-11-22 07:50:14');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (126, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 07:50:26');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (127, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-22 08:05:48');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (128, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-22 08:06:18');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (129, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 03:40:26');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (130, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 04:32:14');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (131, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 04:32:30');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (132, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 04:32:51');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (133, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 04:34:01');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (134, 12, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 04:34:08');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (135, 12, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 04:44:45');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (136, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 06:56:00');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (137, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 14:07:55');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (138, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 14:08:04');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (139, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 14:08:10');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (140, 13, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 14:10:18');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (141, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 14:14:27');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (142, 13, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 14:15:04');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (143, 13, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 14:15:25');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (144, 13, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 14:29:51');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (145, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 14:31:47');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (146, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 14:50:52');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (147, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 15:10:00');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (148, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 15:17:58');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (149, 11, 'LOGIN', 'AUTH: Đăng nhập thành công', '2026-11-23 16:05:45');
INSERT INTO `audit_logs` (`id`, `actor_id`, `action`, `detail`, `created_at`) VALUES (150, 11, 'LOGOUT', 'AUTH: Đăng xuất', '2026-11-23 16:48:27');

DROP TABLE IF EXISTS `books`;
CREATE TABLE `books` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `author` varchar(150) NOT NULL,
  `category_id` bigint NOT NULL,
  `total_copies` int NOT NULL,
  `available_copies` int NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `cover_url` varchar(500) DEFAULT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `publisher` varchar(150) DEFAULT NULL,
  `publication_year` int DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `ix_books_id` (`id`),
  CONSTRAINT `books_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (1, 'Cấu trúc dữ liệu và Giải thuật', 'Nguyễn Đức Nghĩa', 1, 10, 10, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbQOwD_WLD0qcmEusIH28EETE3zE2y7YtGTm8FE1461Q&s=10', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbQOwD_WLD0qcmEusIH28EETE3zE2y7YtGTm8FE1461Q&s=10', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (2, 'Clean Code - Mã sạch', 'Robert C. Martin', 1, 6, 6, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTuerhqpH9BLOD2nkwOkCubvRQBsFA-8jA6Jmg2ySKWw&s=10', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTuerhqpH9BLOD2nkwOkCubvRQBsFA-8jA6Jmg2ySKWw&s=10', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (3, 'Lập trình hướng đối tượng Python', 'Phan Ngọc Tài', 1, 8, 8, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR30pRRwz_WR_qriW9ABRzFs2DMUwphs2-7KuRXdAXEHA&s=10', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR30pRRwz_WR_qriW9ABRzFs2DMUwphs2-7KuRXdAXEHA&s=10', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (4, 'Hệ quản trị cơ sở dữ liệu MySQL', 'Lê Hà Thanh Sang', 1, 5, 5, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSORfzL-imjySXOuThcbx1YdwdVSDxmxT1jEeKZlXiplw&s=10', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSORfzL-imjySXOuThcbx1YdwdVSDxmxT1jEeKZlXiplw&s=10', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (5, 'Scrum: The Art of Doing Twice the Work in Half the Time', 'Jeff Sutherland', 3, 4, 4, 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500', 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (6, 'MininoNihongo', 'NXB Trẻ', 3, 10, 10, 'https://www.davibooks.vn/stores/uploads/l/b4__84402_image2_800_thum.jpg', 'https://www.davibooks.vn/stores/uploads/l/b4__84402_image2_800_thum.jpg', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (7, 'Toán Cao Cấp 1', 'Nguyễn Đình Trí', 1, 10, 10, 'https://th.bing.com/th/id/OIP.OF7M-TmkojxXlCuibIO62gHaLB?w=204&h=305&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3', 'https://th.bing.com/th/id/OIP.OF7M-TmkojxXlCuibIO62gHaLB?w=204&h=305&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (8, 'Nền tảng Giáo dục học', 'Nguyễn An Bình', 4, 2, 2, 'https://images.unsplash.com/photo-1462331848778-442579fb8e70?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1462331848778-442579fb8e70?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (9, 'Phương pháp học tập chủ động', 'Lê Minh Châu', 4, 2, 2, 'https://images.unsplash.com/photo-1544620348-c7fd4533399f?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1544620348-c7fd4533399f?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (10, 'Kinh tế học qua tình huống đời thường', 'Trần Quang Huy', 5, 2, 2, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (11, 'Quản lý tài chính cá nhân căn bản', 'Phạm Thảo Linh', 5, 2, 2, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (12, 'Mùa hạ bên hiên nhà', 'Nguyễn Gia Hân', 6, 2, 2, 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (13, 'Chuyến tàu qua miền sương', 'Lê Hoàng Nam', 6, 2, 2, 'https://images.unsplash.com/photo-1559539707-721290587a0e?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1559539707-721290587a0e?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (14, 'Bầu trời đêm cho người mới bắt đầu', 'Vũ Hải Đăng', 7, 2, 2, 'https://images.unsplash.com/photo-1557339572-1d76094753bd?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1557339572-1d76094753bd?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (15, 'Hệ Mặt Trời và những hành tinh', 'Đỗ Ngọc Mai', 7, 2, 2, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (16, 'Khám phá đại dương sâu', 'Trần Phương Anh', 8, 2, 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (17, 'Hành trình qua rừng nhiệt đới', 'Nguyễn Minh Khoa', 8, 2, 2, 'https://images.unsplash.com/photo-1534578678718-a14456294e09?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1534578678718-a14456294e09?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (18, 'Kỹ thuật Viễn thông và Mạng không dây', 'TS. Nguyễn Văn Hùng', 1, 10, 10, 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (19, 'Lập trình Web hiện đại', 'Phạm Văn Hạnh', 1, 2, 2, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (20, 'Hệ quản trị cơ sở dữ liệu', 'Lê Hà Thanh Sang', 1, 2, 2, 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (21, 'Mạng máy tính căn bản', 'Trần Minh Tuấn', 1, 2, 2, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (22, 'An toàn thông tin ứng dụng', 'Nguyễn Quang Huy', 1, 2, 2, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (23, 'Trí tuệ nhân tạo cho người mới bắt đầu', 'Đỗ Nhật Minh', 1, 2, 2, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (24, 'Kỹ thuật phần mềm thực hành', 'Vũ Minh Phương', 1, 2, 2, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (25, 'Python nâng cao', 'Ngô Thanh Sơn', 1, 2, 2, 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (26, 'Java từ cơ bản đến dự án', 'Hoàng Quốc Anh', 1, 2, 2, 'https://images.unsplash.com/photo-1516101922849-9109e3b0f58f?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1516101922849-9109e3b0f58f?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (27, 'Tiếng Anh giao tiếp cho sinh viên', 'Sarah Nguyễn', 9, 2, 2, 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (28, 'Từ vựng tiếng Anh chuyên ngành CNTT', 'Michael Phạm', 9, 2, 2, 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (29, 'Luyện nghe tiếng Anh qua hội thoại', 'David Trần', 9, 2, 2, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (30, 'Tiếng Nhật sơ cấp', 'Haruka Yamamoto', 9, 2, 2, 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (31, 'Vật lý đại cương', 'Lê Văn Khoa', 10, 2, 2, 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (32, 'Hóa học cơ sở', 'Nguyễn Thu Hà', 10, 2, 2, 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (33, 'Sinh học phân tử', 'Phạm Đức Long', 10, 2, 2, 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (34, 'Đại số tuyến tính ứng dụng', 'Trần Văn Bình', 10, 2, 2, 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (35, 'Xác suất và Thống kê', 'Nguyễn Minh Châu', 10, 2, 2, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (36, 'Lãnh đạo và Quản trị', 'Phạm Ngọc Tùng', 5, 2, 2, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (37, 'Khởi nghiệp sáng tạo', 'Lê Thu Trang', 5, 2, 2, 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (38, 'Kỹ năng thuyết trình', 'Nguyễn Gia Hưng', 12, 2, 2, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLw_o11SujvfTynLon0oNUDgV13MLjoYSlJ0vm75S9Ng&s=10', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLw_o11SujvfTynLon0oNUDgV13MLjoYSlJ0vm75S9Ng&s=10', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (39, 'Quản lý thời gian hiệu quả', 'Trần Hồng Nhung', 12, 2, 2, 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (40, 'Tư duy phản biện', 'Vũ Thảo My', 12, 2, 2, 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (41, 'Kinh tế Việt Nam trong hội nhập', 'Đặng Quốc Bảo', 11, 2, 2, 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (42, 'Chính trị học đại cương', 'Lê Mai Anh', 11, 2, 2, 'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=400&h=600&fit=crop', NULL, NULL, NULL, NULL);
INSERT INTO `books` (`id`, `title`, `author`, `category_id`, `total_copies`, `available_copies`, `image_url`, `cover_url`, `isbn`, `publisher`, `publication_year`, `description`) VALUES (43, 'Tâm lý học đám đông', 'Nguyễn Hữu Đức', 11, 2, 2, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsE5BIqn2T3bMutLovBukB99sw54xMWHgt9J8Y2iWjJQ&s=10', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsE5BIqn2T3bMutLovBukB99sw54xMWHgt9J8Y2iWjJQ&s=10', NULL, NULL, NULL, NULL);

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `ix_categories_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `categories` (`id`, `name`) VALUES (1, 'Công nghệ thông tin');
INSERT INTO `categories` (`id`, `name`) VALUES (4, 'Giáo dục');
INSERT INTO `categories` (`id`, `name`) VALUES (8, 'Khám phá');
INSERT INTO `categories` (`id`, `name`) VALUES (10, 'Khoa học');
INSERT INTO `categories` (`id`, `name`) VALUES (2, 'Khoa học máy tính');
INSERT INTO `categories` (`id`, `name`) VALUES (5, 'Kinh tế');
INSERT INTO `categories` (`id`, `name`) VALUES (12, 'Kỹ năng');
INSERT INTO `categories` (`id`, `name`) VALUES (3, 'Kỹ năng & Quản trị');
INSERT INTO `categories` (`id`, `name`) VALUES (9, 'Ngoại ngữ');
INSERT INTO `categories` (`id`, `name`) VALUES (7, 'Thiên văn');
INSERT INTO `categories` (`id`, `name`) VALUES (6, 'Tiểu thuyết');
INSERT INTO `categories` (`id`, `name`) VALUES (11, 'Xã hội');

DROP TABLE IF EXISTS `fines`;
CREATE TABLE `fines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `loan_id` bigint NOT NULL,
  `amount` int NOT NULL,
  `paid` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loan_id` (`loan_id`),
  KEY `ix_fines_id` (`id`),
  CONSTRAINT `fines_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `loans`;
CREATE TABLE `loans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `status` varchar(20) NOT NULL,
  `days` int NOT NULL,
  `borrow_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `extension_count` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`),
  KEY `ix_loans_id` (`id`),
  CONSTRAINT `loans_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `loans` (`id`, `user_id`, `book_id`, `status`, `days`, `borrow_date`, `due_date`, `return_date`, `approved_by`, `created_at`, `extension_count`) VALUES (1, 5, 13, 'RETURNED', 14, '2026-11-20', '2026-12-04', '2026-11-20', 12, '2026-11-17 04:03:09', 0);
INSERT INTO `loans` (`id`, `user_id`, `book_id`, `status`, `days`, `borrow_date`, `due_date`, `return_date`, `approved_by`, `created_at`, `extension_count`) VALUES (2, 5, 10, 'RETURNED', 7, '2026-11-20', '2026-11-27', '2026-11-20', 11, '2026-11-17 04:04:33', 0);
INSERT INTO `loans` (`id`, `user_id`, `book_id`, `status`, `days`, `borrow_date`, `due_date`, `return_date`, `approved_by`, `created_at`, `extension_count`) VALUES (3, 13, 17, 'RETURNED', 7, '2026-11-20', '2026-11-27', '2026-11-20', 12, '2026-11-17 14:34:27', 0);
INSERT INTO `loans` (`id`, `user_id`, `book_id`, `status`, `days`, `borrow_date`, `due_date`, `return_date`, `approved_by`, `created_at`, `extension_count`) VALUES (4, 5, 1, 'RETURNED', 14, '2026-11-21', '2026-12-05', '2026-11-21', 11, '2026-11-20 15:00:52', 0);

DROP TABLE IF EXISTS `reservations`;
CREATE TABLE `reservations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `hold_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_reservations_id` (`id`),
  KEY `ix_reservations_user_id` (`user_id`),
  KEY `ix_reservations_book_id` (`book_id`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `revoked_tokens`;
CREATE TABLE `revoked_tokens` (
  `jti` varchar(36) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime NOT NULL,
  PRIMARY KEY (`jti`),
  KEY `ix_revoked_tokens_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('41475fb5-4ecc-4075-a962-479c6613375b', '2026-11-24 14:15:25', '2026-11-23 14:29:51');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('63e6ae7e-24fa-457c-b2bc-5dbfc54611bb', '2026-11-24 15:09:59', '2026-11-23 15:17:58');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('6d4e5938-d4b7-4591-91c3-d5e43baa5d3b', '2026-11-24 04:32:51', '2026-11-23 04:34:01');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('78c5d82a-9905-408d-9de8-7d34d31cca46', '2026-11-24 14:14:26', '2026-11-23 14:15:04');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('a3215f36-634a-4357-bbe1-12d433ddd980', '2026-11-24 03:40:25', '2026-11-23 06:56:00');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('a451dda1-2240-41d1-9ce8-027e2d8f3c6d', '2026-11-24 14:08:09', '2026-11-23 14:10:18');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('d12cf1d1-ac2f-48bf-9249-1d4980f0c930', '2026-11-24 14:07:54', '2026-11-23 14:08:04');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('d59e7e4d-1c25-41f2-9955-53a40cefb5da', '2026-11-24 04:32:13', '2026-11-23 04:32:30');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('d67852a8-2d32-4916-9fab-a4ec44ea51eb', '2026-11-24 04:34:07', '2026-11-23 04:44:45');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('eb66a356-3dc7-4d87-998e-c7df2f6602d2', '2026-11-24 14:31:46', '2026-11-23 14:50:52');
INSERT INTO `revoked_tokens` (`jti`, `expires_at`, `revoked_at`) VALUES ('fac44bd3-12b2-40b9-b2ec-8c26069ff3f2', '2026-11-24 16:05:44', '2026-11-23 16:48:27');

DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `details` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `ix_system_logs_id` (`id`),
  CONSTRAINT `system_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` varchar(20) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`),
  UNIQUE KEY `ix_users_username` (`username`),
  KEY `ix_users_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (1, 'B22DCCN001', 'nguyenvanan@ptit.edu.vn', '$2b$12$QsHpOKjnyTNg2ts/9Bjo4OuW1YGTMPl9eNQWRfJ8bwRS7uvsFHaLC', 'Nguyễn Văn An', 'READER', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (2, 'thongnguyen', 'nguyenthong1212015@gmail.com', '$2b$12$JIGPNOOWMjwvYXy9SmdhMOSlTsG0Wu1bDY4YnUaV5a8jywN1Nh4FC', 'Nguyễn Văn Thông ', 'READER', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (5, 'N25DTCN140', 'nguyenthong12122015@gmail.com', '$2b$12$S3DkK4iL99NNuRBuwMUU4uY4/5laC88c37dHcits70CFjjqvKuUrC', 'Nguyễn Văn Thông', 'READER', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (8, 'N25DTCN100', 'thong12122015@gmail.com', '$2b$12$/Bu/rHMYd2If.iD7N9zyb.Nl/Kaonpq7mPMNfHRz5dxBBxvcOFe/S', 'Nguyễn Văn Thành', 'READER', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (9, 'N25DTCN141', 'thien12122015@gmail.com', '$2b$12$EgRUwxKSbh2REPeC4GPAE.uiQaae/o5bHdXDjzDs0RoiOxv9YTNGa', 'Nguyễn Văn Thành', 'READER', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (11, 'admin', 'admin@ptit.edu.vn', '$2b$12$dIKQ5iV8/M3H5wGsKOs4PeKTvbD9Up0W9l/uywBLFZ9C.rmdWjdTu', 'Quản trị viên Hệ thống', 'ADMIN', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (12, 'thuthu', 'thuthu@ptit.edu.vn', '$2b$12$FVW3hYe.zl.XpiZPcQhNieGGOrV8meykyDR/4qYqt/yEqW/Mzxpj.', 'Lê Thị Thu Thư', 'LIBRARIAN', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (13, 'B22DCCN101', 'docgia@ptit.edu.vn', '$2b$12$0bSJhINKy8/sf7Gd749lFOE0CVXGwlqydBccH367WfCYuRuRKLe9.', 'Nguyễn Hoàng An', 'READER', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (14, 'N25DTCN143', 'hoang612007@gmail.com', '$2b$12$uGODuCmm1.oRcdOGBW/m6./Noj/DO40MbhxVCDt8miJ79a4rD/uim', 'Hoàng Minh Đức', 'READER', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (15, 'thuthu2', 'thuthu2@ptit.edu.vn', '$2b$12$ARYqV0EEqlYkhvN.1wd9c.MLuRuZWkzvz5Fvhys5huhDFTskI8guS', 'Phạm Thu Trang', 'LIBRARIAN', 1, 0);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (16, 'thuthu3', 'thuthu3@ptit.edu.vn', '$2b$12$Xi815chU8OSIGtbj9oVHFOKp6pz8sbi4TpU57GtSfQHpD.V64S3Bm', 'Vũ Minh Tuấn', 'LIBRARIAN', 1, 1);
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `is_locked`) VALUES (18, 'N25DTCN144', 'nguyen12122015@gmail.com', '$2b$12$R0an54PSlkBu3TdCbMyKuOLhjgFsOyk/fsY4YmbYzE3fiGrpRgd3u', 'Nguyễn Văn Thông', 'ADMIN', 1, 0);

SET FOREIGN_KEY_CHECKS=1;
