-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Table 1: Students
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Table 2: Courses
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL,
    credits INTEGER NOT NULL
);

-- Table 3: Enrolments
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (student_id, course_id)
);

-- Insert 3 students
INSERT INTO students (student_id, name, email)
VALUES
(1, 'Mohamed Issack', 'mohamed@example.com'),
(2, 'Amina Hassan', 'amina@example.com'),
(3, 'Ali Ahmed', 'ali@example.com');

-- Insert 3 courses
INSERT INTO courses (course_id, course_name, credits)
VALUES
(1, 'Database Systems', 3),
(2, 'Web Development', 4),
(3, 'Computer Networking', 3);

-- Insert 5 enrolments
INSERT INTO enrolments (enrolment_id, student_id, course_id, grade)
VALUES
(1, 1, 1, 'A'),
(2, 1, 2, 'B'),
(3, 2, 1, 'A'),
(4, 2, 3, 'B'),
(5, 3, 2, 'C');

-- Query 1: Find all courses taken by one student
SELECT
    students.name,
    courses.course_name,
    enrolments.grade
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE students.name = 'Mohamed Issack';

-- Query 2: Find all students enrolled in one course
SELECT
    courses.course_name,
    students.name,
    enrolments.grade
FROM courses
JOIN enrolments
    ON courses.course_id = enrolments.course_id
JOIN students
    ON enrolments.student_id = students.student_id
WHERE courses.course_name = 'Database Systems';


-- Query 3: Count students enrolled in each course
SELECT
    courses.course_name,
    COUNT(enrolments.student_id) AS total_students
FROM courses
LEFT JOIN enrolments
    ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name;

-- Query 4: Find students who have no enrolments
SELECT
    students.student_id,
    students.name,
    students.email
FROM students
LEFT JOIN enrolments
    ON students.student_id = enrolments.student_id
WHERE enrolments.enrolment_id IS NULL;


-- Query 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 'A'
WHERE enrolment_id = 5;

-- Check the updated grade
SELECT
    students.name,
    courses.course_name,
    enrolments.grade
FROM enrolments
JOIN students
    ON enrolments.student_id = students.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE enrolments.enrolment_id = 5;

