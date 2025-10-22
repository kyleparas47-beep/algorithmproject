CREATE DATABASE IF NOT EXISTS nu_scheduling;
USE nu_scheduling;

CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    year_level INT NOT NULL,
    letter CHAR(1) NOT NULL,
    student_count INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_section (program_id, year_level, letter)
);

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type ENUM('lecture', 'leclab', 'laboratory') NOT NULL,
    hours_lecture DECIMAL(4,2) NOT NULL,
    hours_lab DECIMAL(4,2) DEFAULT 0,
    term ENUM('TERM 1', 'TERM 2', 'TERM 3') NOT NULL DEFAULT 'TERM 1',
    program_id INT NOT NULL,
    year_level INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('lecture', 'laboratory') NOT NULL,
    start_time TIME DEFAULT '07:00:00',
    end_time TIME DEFAULT '21:00:00',
    available_days VARCHAR(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    course_id INT NOT NULL,
    room_id INT NOT NULL,
    day_pattern VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    schedule_type ENUM('lecture', 'lab') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

INSERT INTO programs (code, name) VALUES 
    ('BSIT', 'Bachelor of Science in Information Technology'),
    ('BSCS', 'Bachelor of Science in Computer Science'),
    ('BSIS', 'Bachelor of Science in Information Systems')
ON DUPLICATE KEY UPDATE name=VALUES(name);
