-- CSDL library_ptit (MySQL 8). Chay mot lan: mysql -u root -p < database/schema.sql
-- Ten cot theo tu dien du lieu trong SRS muc 5.3; neu nhom da co schema.sql rieng thi doi chieu va sua @Column o entity cho khop.
CREATE DATABASE IF NOT EXISTS library_ptit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_ptit;

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    student_code  VARCHAR(20)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'READER',
    locked        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('READER', 'LIBRARIAN', 'ADMIN'))
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS categories (
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS books (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    author      VARCHAR(150) NOT NULL,
    category_id BIGINT NULL,
    total       INT NOT NULL,
    available   INT NOT NULL,
    CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT chk_books_total CHECK (total >= 0),
    CONSTRAINT chk_books_available CHECK (available >= 0 AND available <= total),
    INDEX idx_books_title (title),
    INDEX idx_books_author (author)
) ENGINE = InnoDB;

-- requested_at: thoi diem dang ky, de hien thi "ngay dang ky" o man hinh Duyet dang ky
CREATE TABLE IF NOT EXISTS loans (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    book_id      BIGINT      NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    days         INT         NOT NULL,
    requested_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    borrow_date  DATE NULL,
    due_date     DATE NULL,
    return_date  DATE NULL,
    approved_by  BIGINT NULL,
    CONSTRAINT fk_loans_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_loans_book FOREIGN KEY (book_id) REFERENCES books (id),
    CONSTRAINT fk_loans_approver FOREIGN KEY (approved_by) REFERENCES users (id),
    CONSTRAINT chk_loans_status CHECK (status IN ('PENDING', 'BORROWING', 'RETURNED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_loans_days CHECK (days IN (7, 14, 30)),
    INDEX idx_loans_user_status (user_id, status),
    INDEX idx_loans_book_status (book_id, status),
    INDEX idx_loans_due_date (due_date)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS fines (
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_id BIGINT  NOT NULL UNIQUE,
    amount  INT     NOT NULL,
    paid    BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_fines_loan FOREIGN KEY (loan_id) REFERENCES loans (id),
    CONSTRAINT chk_fines_amount CHECK (amount >= 0)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS reservations (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    book_id    BIGINT      NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hold_until DATETIME NULL,
    CONSTRAINT fk_resv_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_resv_book FOREIGN KEY (book_id) REFERENCES books (id),
    CONSTRAINT chk_resv_status CHECK (status IN ('WAITING', 'HOLDING', 'CANCELLED', 'DONE')),
    INDEX idx_resv_book_status (book_id, status, created_at)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id   BIGINT NULL,
    action     VARCHAR(50)  NOT NULL,
    detail     VARCHAR(255) NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_actor FOREIGN KEY (actor_id) REFERENCES users (id),
    INDEX idx_logs_created (created_at)
) ENGINE = InnoDB;
