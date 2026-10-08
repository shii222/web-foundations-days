# School Database Design

## 1. Introduction

This database is designed to manage students, courses, and student enrolments in a school. It stores student information, course details, and grades while maintaining relationships between the tables.

## 2. Database Tables

### Students Table

The `students` table stores information about each student.

- `student_id`: Primary key that uniquely identifies each student.
- `name`: Stores the student's full name and cannot be NULL.
- `email`: Stores the student's email address. It must be unique and cannot be NULL.

### Courses Table

The `courses` table stores information about courses offered by the school.

- `course_id`: Primary key that uniquely identifies each course.
- `course_name`: Stores the name of the course.
- `credits`: Stores the number of credits assigned to the course.

### Enrolments Table

The `enrolments` table records which students are enrolled in which courses.

- `enrolment_id`: Primary key that uniquely identifies each enrolment.
- `student_id`: Foreign key referencing the students table.
- `course_id`: Foreign key referencing the courses table.
- `grade`: Stores the student's grade for the course.

The combination of `student_id` and `course_id` is unique, preventing duplicate enrolments in the same course.

## 3. Relationships Between Tables

### One-to-Many Relationships

One student can have many enrolment records, but each enrolment belongs to only one student.

Similarly, one course can have many enrolment records, but each enrolment belongs to only one course.

### Many-to-Many Relationship

Students and courses have a many-to-many relationship because one student can take multiple courses, and one course can contain multiple students.

The `enrolments` table acts as a join table to connect students and courses. It also stores the grade associated with each enrolment.

## 4. Recommended Database Index

I would create an index on the `course_id` column in the `enrolments` table.

```sql
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);
```

This index can improve the performance of queries that find students enrolled in a particular course, especially when the database contains many enrolment records.

## 5. SQL vs NoSQL

I would choose **SQL** for this school database because the information is structured and the relationships between students, courses, and enrolments are important. SQL databases support primary keys, foreign keys, unique constraints, and joins, which help maintain data integrity and prevent invalid records. SQLite is also lightweight and easy to use for a small school database. Although NoSQL databases are useful for flexible or unstructured data, SQL is more suitable for this system because it requires consistent relationships and reliable queries.
