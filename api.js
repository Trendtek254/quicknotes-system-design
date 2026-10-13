const API_URL = "https://jsonplaceholder.typicode.com/posts";

const form = document.querySelector("#note-form");
const titleInput = document.querySelector("#note-title");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const loadButton = document.querySelector("#load-btn");
const message = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

// Display status messages
function showStatus(text, type = "") {
    message.textContent = text;
    message.className = type;
}

// Reusable API request function
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    // A 204 response has no JSON body.
    if (response.status === 204) {
        return {
            data: null,
            status: response.status
        };
    }

    const data = await response.json();

    return {
        data,
        status: response.status
    };
}

// Render a note with its Delete button
function renderNote(note, addToTop = false) {
    const item = document.createElement("li");
    const title = document.createElement("h2");
    const body = document.createElement("p");
    const deleteButton = document.createElement("button");

    title.textContent = note.title;
    body.textContent = note.body || "";

    deleteButton.textContent = "Delete";
    deleteButton.type = "button";

    deleteButton.addEventListener("click", () => {
        deleteNote(note.id, item, deleteButton);
    });

    item.append(title, body, deleteButton);

    if (addToTop) {
        notesList.prepend(item);
    } else {
        notesList.appendChild(item);
    }
}

// TASK 1: GET notes
async function loadNotes() {
    loadButton.disabled = true;
    showStatus("Loading notes...");
    notesList.replaceChildren();

    try {
        const result = await request(`${API_URL}?_limit=10`);
        const notes = result.data;

        if (notes.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.textContent = "No notes available yet.";
            notesList.appendChild(emptyItem);

            showStatus("No notes were found.");
            return;
        }

        notes.forEach(note => renderNote(note));

        showStatus(
            `Loaded ${notes.length} notes from the server.`,
            "success"
        );
    } catch (error) {
        console.error("GET error:", error);

        showStatus(
            "Sorry, we couldn't load your notes. Please try again.",
            "error"
        );
    } finally {
        loadButton.disabled = false;
    }
}

// TASK 2: POST a new note
async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        showStatus("Please enter a note title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus(
            "Title must be 100 characters or fewer.",
            "error"
        );
        return;
    }

    submitBtn.disabled = true;
    showStatus("Creating note...");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                body,
                userId: 1
            })
        });

        const note = result.data;

        // JSONPlaceholder simulates creation; it does not
        // permanently save new notes on its server.
        renderNote(note, true);

        showStatus(
            `Note created (status ${result.status}, id ${note.id}).`,
            "success"
        );

        form.reset();
    } catch (error) {
        console.error("POST error:", error);

        showStatus(
            "Sorry, we couldn't create your note. Please try again.",
            "error"
        );
    } finally {
        submitBtn.disabled = false;
    }
}

// TASK 3: DELETE a note
async function deleteNote(id, item, deleteButton) {
    if (!confirm("Are you sure you want to delete this note?")) {
        return;
    }

    deleteButton.disabled = true;
    showStatus("Deleting note...");

    try {
        const result = await request(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        // JSONPlaceholder simulates deletion and does not permanently
        // change server data. Remove the note from this page only.
        item.remove();

        showStatus(
            `Note deleted successfully (status ${result.status}).`,
            "success"
        );
    } catch (error) {
        console.error("DELETE error:", error);

        showStatus(
            "Sorry, we couldn't delete the note. Please try again.",
            "error"
        );

        deleteButton.disabled = false;
    }
}

// Connect events
loadButton.addEventListener("click", loadNotes);
form.addEventListener("submit", createNote);