QuickNotes Database Data Model

1. Overview

QuickNotes uses a relational database to store users, notes, tags, and the relationships between notes and tags.

This design uses PostgreSQL, an SQL database that supports primary keys, foreign keys, constraints, transactions, and indexes.

2. Entities and Columns

2.1 Users

Stores information about registered users.

Column| Type| Key / Constraint| Description
"id"| BIGINT| Primary Key| Unique user ID
"username"| VARCHAR(50)| UNIQUE, NOT NULL| User's username
"email"| VARCHAR(255)| UNIQUE, NOT NULL| User's email
"password_hash"| VARCHAR(255)| NOT NULL| Secure password hash
"created_at"| TIMESTAMPTZ| NOT NULL| Account creation time

2.2 Notes

Stores notes created by users.

Column| Type| Key / Constraint| Description
"id"| BIGINT| Primary Key| Unique note ID
"user_id"| BIGINT| Foreign Key, NOT NULL| Owner of the note
"title"| VARCHAR(100)| NOT NULL| Note title
"body"| TEXT| Nullable| Note content
"created_at"| TIMESTAMPTZ| NOT NULL| Creation time
"updated_at"| TIMESTAMPTZ| NOT NULL| Last update time

The "user_id" column references "users.id".

2.3 Tags

Stores labels that users can apply to their notes.

Column| Type| Key / Constraint| Description
"id"| BIGINT| Primary Key| Unique tag ID
"user_id"| BIGINT| Foreign Key, NOT NULL| Owner of the tag
"name"| VARCHAR(50)| NOT NULL| Tag name

The "user_id" column references "users.id". A unique constraint on "(user_id, name)" prevents a user from creating duplicate tag names.

2.4 Note_Tags

A junction table connecting notes and tags.

Column| Type| Key / Constraint| Description
"note_id"| BIGINT| Composite Primary Key, Foreign Key| Referenced note
"tag_id"| BIGINT| Composite Primary Key, Foreign Key| Referenced tag

The combination of "note_id" and "tag_id" forms the composite primary key. Both columns are foreign keys.

3. Relationships

One-to-many relationships

- Users to Notes: One user can create many notes, but each note belongs to one user.
- Users to Tags: One user can create many tags, but each tag belongs to one user.

Many-to-many relationship

- Notes to Tags: A note can have several tags, and a tag can be attached to several notes.

The "note_tags" junction table implements this many-to-many relationship using two foreign keys.

4. CREATE TABLE Statements

The following PostgreSQL statements create all four tables. Create the tables in the order shown because foreign keys depend on previously created tables.

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT unique_tag_per_user UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id)
        ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id)
        ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

"ON DELETE CASCADE" removes dependent notes, tags, or note-tag associations when their referenced records are deleted. Passwords must be stored as secure hashes, never as plain text.

5. Example SQL Queries

Query 1: Retrieve all notes belonging to a user

SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = 1
ORDER BY updated_at DESC;

This query retrieves the notes owned by user "1", with recently updated notes first.

Query 2: Create a new note

INSERT INTO notes (user_id, title, body)
VALUES (1, 'Learn Python', 'Practice building APIs')
RETURNING id, user_id, title, body, created_at;

This inserts a new note for user "1" and returns the created record. The user must already exist.

Query 3: Retrieve notes and their tags using JOIN

SELECT
    n.id AS note_id,
    n.title,
    t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt ON n.id = nt.note_id
JOIN tags AS t ON nt.tag_id = t.id
WHERE n.user_id = 1
ORDER BY n.id;

This query joins three tables to show each note alongside its associated tags. A note with multiple tags can appear in multiple result rows.

Query 4: Count notes for each user

SELECT
    u.id,
    u.username,
    COUNT(n.id) AS total_notes
FROM users AS u
LEFT JOIN notes AS n ON u.id = n.user_id
GROUP BY u.id, u.username
ORDER BY total_notes DESC;

This query counts each user's notes. The "LEFT JOIN" ensures users with zero notes are included.

6. Indexes

PostgreSQL automatically creates indexes for primary keys and unique constraints. We also add an index to speed up queries that retrieve a user's notes in update-time order.

CREATE INDEX idx_notes_user_updated
ON notes (user_id, updated_at DESC);

Reason: QuickNotes frequently needs to retrieve a particular user's notes, often ordered by the most recently updated. This composite index can improve the performance of those queries as the database grows.

7. SQL vs NoSQL Decision

QuickNotes will use SQL, specifically PostgreSQL, because its data has clear relationships: users own notes, users create tags, and notes can have multiple tags. Relational tables, foreign keys, and transactions help maintain data integrity and prevent invalid relationships. SQL also makes it straightforward to retrieve notes and their tags through joins. A NoSQL database could work, but PostgreSQL is a suitable starting point for this structured data model and expected application needs.