QQuickNotes

Description

QuickNotes is a simple notes application project built to practice web development and REST API integration. The API client uses JavaScript's Fetch API to retrieve, create, and delete notes using JSONPlaceholder as a test API.

The project also includes documentation covering REST API design, database modeling, and system architecture.

Features

- Retrieve and display notes from an API.
- Create notes by sending POST requests.
- Delete notes using DELETE requests.
- Handle loading states and API errors.
- Practice HTTP methods, JSON, and asynchronous JavaScript.

Important: JSONPlaceholder is a testing API. Creating or deleting notes does not permanently modify its server data.

Project Structure

quicknotes-app/
├── docs/
│   ├── api-design.md
│   ├── data-model.md
│   └── architecture.md
├── index.html
├── style.css
├── api.js
└── README.md

How to Run the API Client

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Ensure the HTML file loads the correct JavaScript file.
4. Open "index.html" in your browser, or use the VS Code Live Server extension.
5. Click the button to load notes from the API.
6. Create a note using the form and test the delete functionality.

An internet connection is required to communicate with JSONPlaceholder.

Project Documentation

- "REST API Design" (docs/api-design.md)
- "Database Data Model" (docs/data-model.md)
- "System Architecture" (docs/architecture.md)

What I Learned

- REST APIs: How GET, POST, and DELETE requests communicate with a server and how HTTP status codes indicate the outcome.
- Asynchronous JavaScript: How "async", "await", and "fetch()" handle API requests and responses.
- Error handling: How to handle unsuccessful responses and display helpful messages to users.
- Database design: How primary keys, foreign keys, and junction tables represent relationships between users, notes, and tags.
- System architecture: How load balancers, caches, read replicas, queues, and workers can help a system scale.
- Git and GitHub: How meaningful commits track development progress and document changes.

Future Improvements

- Build a persistent backend API.
- Connect the application to a real database.
- Add user authentication and authorization.
- Implement note editing and tag management.