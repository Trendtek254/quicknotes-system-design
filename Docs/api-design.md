QuickNotes REST API Design

1. Overview

QuickNotes provides a REST API for creating, viewing, updating, and deleting notes. The API uses JSON for request and response bodies.

Base URL: "/api/v1"

Content-Type: "application/json"

2. REST Endpoints

Method| Path| Description| Success Status
GET| "/api/v1/notes"| Retrieve all notes belonging to the authenticated user.| 200 OK
GET| "/api/v1/notes/:id"| Retrieve a single note by its ID.| 200 OK
POST| "/api/v1/notes"| Create a new note.| 201 Created
PUT| "/api/v1/notes/:id"| Replace all editable fields of an existing note.| 200 OK
PATCH| "/api/v1/notes/:id"| Update selected fields of an existing note.| 200 OK
DELETE| "/api/v1/notes/:id"| Delete an existing note.| 204 No Content
GET| "/api/v1/health"| Check whether the API service is running.| 200 OK

Note: ":id" represents the unique ID of a note. Note endpoints require authentication. The health endpoint may be public.

3. Data Model

A note contains the following fields:

- "id": Unique identifier assigned by the server.
- "title": Required string containing the note title.
- "body": Optional string containing the note content.
- "createdAt": Timestamp indicating when the note was created.
- "updatedAt": Timestamp indicating when the note was last updated.

Example note:

{
  "id": 1,
  "title": "Learn Python",
  "body": "Practice building REST APIs",
  "createdAt": "2026-10-13T08:00:00Z",
  "updatedAt": "2026-10-13T08:00:00Z"
}

4. Create a Note

Request

"POST /api/v1/notes"

Headers:

Content-Type: application/json
Authorization: Bearer <access_token>

Request body:

{
  "title": "Learn Python",
  "body": "Practice building REST APIs"
}

Successful response — "201 Created"

{
  "id": 1,
  "title": "Learn Python",
  "body": "Practice building REST APIs",
  "createdAt": "2026-10-13T08:00:00Z",
  "updatedAt": "2026-10-13T08:00:00Z"
}

The server validates the request, assigns a unique ID, saves the note, and returns the created resource.

5. List Notes

Request

"GET /api/v1/notes"

Headers:

Authorization: Bearer <access_token>

Successful response — "200 OK"

{
  "notes": [
    {
      "id": 1,
      "title": "Learn Python",
      "body": "Practice building REST APIs",
      "createdAt": "2026-10-13T08:00:00Z",
      "updatedAt": "2026-10-13T08:00:00Z"
    },
    {
      "id": 2,
      "title": "Study Anatomy",
      "body": "Review the skeletal system",
      "createdAt": "2026-10-13T08:30:00Z",
      "updatedAt": "2026-10-13T08:30:00Z"
    }
  ],
  "total": 2
}

The server returns the notes accessible to the authenticated user. If the user has no notes, the API returns an empty array and a total of zero.

6. Error Status Codes

Status Code| Name| When It Is Returned
400| Bad Request| The request body is invalid or required fields are missing.
401| Unauthorized| Authentication credentials are missing or invalid.
403| Forbidden| The authenticated user is not allowed to perform the requested action.
404| Not Found| The requested note or endpoint does not exist.
500| Internal Server Error| An unexpected server-side error occurs.

7. Example Error Response

Example: "400 Bad Request"

{
  "error": {
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "The note title is required."
  }
}

All API errors use a consistent JSON structure containing the HTTP status, a machine-readable error code, and a human-readable message. The server must not expose passwords, access tokens, or sensitive internal details in error responses.

8. Design Decisions

1. The API uses standard HTTP methods to perform CRUD operations: Create, Read, Update, and Delete.
2. JSON is used for request and response bodies.
3. The server generates note IDs and timestamps.
4. Authentication protects users' notes from unauthorized access.
5. Validation errors return "400 Bad Request".
6. Successful deletion returns "204 No Content" without a response body.
7. Consistent error responses help clients handle failures predictably.