# Library Books REST API Design

This document describes a REST API for managing books in a library.

## 1. List All Books

- **Method:** GET
- **Path:** `/books`
- **Description:** Returns a list of all books in the library.
- **Success Status Code:** `200 OK`

## 2. Get One Book

- **Method:** GET
- **Path:** `/books/42`
- **Description:** Returns the book with the ID 42.
- **Success Status Code:** `200 OK`

## 3. Create a Book

- **Method:** POST
- **Path:** `/books`
- **Description:** Creates a new book in the library.
- **Success Status Code:** `201 Created`

### Example Request Body

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}