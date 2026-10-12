const form = document.querySelector("#note-form");
const submitBtn=document.querySelector("#submit-btn");
const loadButton = document.querySelector("#load-btn");
const message = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const bodyInput=document.querySelector("#body-input");
const titleInput=document.querySelector("#note-title");
const API_URL= "https://jsonplaceholder.typicode.com/posts";

async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error("The server request failed.");
    }

    const data = await response.json();

    return {
        data: data,
        status: response.status
    };
}










async function loadNotes(){
    loadButton.disabled=true;
    message.textContent="Loading notes....";
    notesList.replaceChildren();
    try{
        const notes=await request(`${API_URL}?_limit=10`);
        if (notes.length===0){
            const emptyMessage=document.createElement("li");
            emptyMessage.textContent = "No notes available yet.";
            notesList.appendChild(emptyMessage);
            message.textContent="No notes were found.";
            return;
         }
         notes.forEach(note=>{
            const listItem=document.createElement("li");
            const title=document.createElement("h2");
            const body=document.createElement("p");
            title.textContent=note.title;
            body.textContent=note.body;

            listItem.append(title,body);
            notesList.appendChild(listItem);
         });
         message.textContent=`Loaded ${notes.length} notes from the server.`;
    }catch (error) {
        message.textContent="Sorry,we couldn't load your notes.Please try again.";
        
    }finally{
        loadButton.disabled = false;
    }
    
}
loadButton.addEventListener("click",loadNotes);

async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        message.textContent = "Please enter a title.";
        message.className = "error";
        return;
    }

    if (title.length > 100) {
        message.textContent =
            "Title must be 100 characters or fewer.";
        message.className = "error";
        return;
    }

    submitBtn.disabled = true;
    message.textContent = "Creating note...";
    message.className = "";

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                body: body,
                userId: 1
            })
        });

        const note = result.data;

        const listItem = document.createElement("li");
        const heading = document.createElement("h2");
        const paragraph = document.createElement("p");

        heading.textContent = note.title;
        paragraph.textContent = note.body || "";

        listItem.append(heading, paragraph);
        notesList.prepend(listItem);

        message.textContent =
            `Note created (status ${result.status}, id ${note.id}).`;
        message.className = "success";

        form.reset();

    } catch (error) {
        console.error(error);
        message.textContent =
            "Sorry, we couldn't create your note. Please try again.";
        message.className = "error";

    } finally {
        submitBtn.disabled = false;
    }
}

form.addEventListener("submit", createNote);