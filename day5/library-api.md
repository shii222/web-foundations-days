# Library Books REST API Design

This document describes a REST API for managing books in a library.

## 1. List All Books

- **Method:** GET
- **Path:** `/books`
- **Description:** Returns a list of all books in the library.
- **Success Status Code:** `200 OK`

---

## 2. Get One Book

- **Method:** GET
- **Path:** `/books/42`
- **Description:** Returns the book with ID 42.
- **Success Status Code:** `200 OK`

---

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
```

---

## 4. Update a Book

- **Method:** PUT
- **Path:** `/books/42`
- **Description:** Updates the details of the book with ID 42.
- **Success Status Code:** `200 OK`

### Example Request Body

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

---

## 5. Delete a Book

- **Method:** DELETE
- **Path:** `/books/42`
- **Description:** Deletes the book with ID 42.
- **Success Status Code:** `204 No Content`

---

## 6. List Books by Author

- **Method:** GET
- **Path:** `/books?author=Chinua%20Achebe`
- **Description:** Returns all books written by the specified author using the `author` query parameter.
- **Success Status Code:** `200 OK`

### Example Request

```text
GET /books?author=Chinua%20Achebe
```

---

# Error Status Codes

## 400 Bad Request

- **Status Code:** `400 Bad Request`
- **Description:** The request contains invalid or missing information.
- **Example:** A client tries to create a book without providing a title.

### Example Invalid Request Body

```json
{
  "author": "Chinua Achebe",
  "year": 1958
}
```

The server could return `400 Bad Request` because the required `title` field is missing.

---

## 404 Not Found

- **Status Code:** `404 Not Found`
- **Description:** The requested book could not be found.
- **Example:** A client requests a book with ID 999, but that book does not exist.

### Example Request

```text
GET /books/999
```

The server would return `404 Not Found` if book 999 does not exist.