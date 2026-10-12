const form = document.querySelector("#note-form");
const submitBtn=document.querySelector("#submit-btn");
const loadButton = document.querySelector("#load-btn");
const message = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const newNotes=document.querySelector("#body-input");
const category=document.querySelector("#category");
const API_URL= "https://jsonplaceholder.typicode.com/posts";

async function request(url){
    const response = await fetch(url);
    if (!response.ok){
        throw new Error("The server could not load your notes.");
    }
    return response.json();
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

