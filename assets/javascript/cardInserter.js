//########################################################
//########################################################
//######################################################## Global Variables
//########################################################
//########################################################
//indexed DB
const DB_NAME = "QuestDB";//variable for database name
const STORES = {
  QUESTS: "quests",
  MAPS: "maps"
};
let cards = [];
const overlay = document.querySelector("#questFormOverlay");
const openBtn = document.querySelector("#openQuestForm");
const closeBtn = document.querySelector("#closeForm");
const addBtn = document.querySelector("#addQuest");
const clearBtn = document.querySelector("#clearQuests");
const imagesInput = document.querySelector("#questImages");
const thumbnailInput = document.querySelector("#questThumbnail");
const previewImg = document.querySelector("#thumbnailPreview");
const downloadBtn = document.querySelector("#downloadQuests");
const uploadInput = document.querySelector("#uploadQuests");
import { downloadProject } from "./export.js";
import { setupImporter } from "./import.js";

//########################################################
//########################################################
//######################################################## card display
//########################################################
//########################################################

//######################################################## renders the cards
function renderCards() {
  const container = document.querySelector(".cardHolder");

  container.innerHTML = ""; //clear existing cards

  cards.forEach(card => { //render all cards

    const div = document.createElement("div"); //create base of card
    div.classList.add("questCard");

    const img = document.createElement("img"); //create space for image
    img.classList.add("questThumbnail");
    if (card.pixelated) img.classList.add("pixelated");

    img.src = card.thumbnail; //assign thumbnail image
    img.alt = card.title; //assign title as alt text should image fail

    const textDiv = document.createElement("div"); //holds all text on the card
    textDiv.classList.add("cardText");

    const title = document.createElement("h3"); //quest title
    title.textContent = card.title;

    const reward = document.createElement("p"); //reward amount
    reward.textContent = `Reward: ${card.reward} gold`;

    const difficulty = document.createElement("p"); //difficulty level
    difficulty.classList.add("TNR");
    difficulty.textContent = `Difficulty: ${getDifficultyDisplay(card.difficulty)}`;

    div.addEventListener("click", () => {//make it so if you click on the div/card it opens details page
      window.location.href = `questDetails.html?id=${card.id}`;
    });

    textDiv.appendChild(title); //make these children of the text
    textDiv.appendChild(reward);
    textDiv.appendChild(difficulty);

    div.appendChild(img); //make these children of the card
    div.appendChild(textDiv);

    container.appendChild(div); //make these children of the existing html

  });
}

//######################################################## when clicking create quest show the form
openBtn.addEventListener("click", () => {
  overlay.classList.remove("hidden");
});

//######################################################## when clicking close hide the form
closeBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  previewImg.src = "assets/images/defaultThumb.png";
});

//######################################################## hide when clicking outside the form area
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
      overlay.classList.add("hidden");
      previewImg.src = "assets/images/defaultThumb.png";
  }
});

//######################################################## what to display based on difficulty
function getDifficultyDisplay(level) {
    if (!level || level < 1) return "—";

    if (level <= 10) {
        return "X".repeat(level); //REPLACE with an image later
    } else {
        return `X x ${level}`; //REPLACE with an image later
    }
}

//######################################################## update preview image when one is uploaded
thumbnailInput.addEventListener("change", () => { //when thumbnail input changes...
  if (thumbnailInput.files && thumbnailInput.files[0]) {
    const file = thumbnailInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result; //... display in previewImg the new thumbnail
    };
    reader.readAsDataURL(file);
  } else {
    previewImg.src = "assets/images/defaultThumb.png"; // set back to default preview if no file
  }
});

//########################################################
//########################################################
//######################################################## card creation
//########################################################
//########################################################

//######################################################## gather information for card creation
addBtn.addEventListener("click", async () => {
  const title = document.querySelector("#questTitle").value;
  const reward = Number(document.querySelector("#questReward").value);
  const difficulty = Number(document.querySelector("#questDifficulty").value);
  const pixelated = document.querySelector("#pixelToggle").checked;
  const host = document.querySelector("#questHost").value;
  const description = document.querySelector("#questDescription").value;
  let thumbnail = "assets/images/defaultThumb.png";
  let images = [];
  
  // minimum requirements: have a title
  const errorMsg = document.querySelector("#formError");
  if (!title) {
      errorMsg.textContent = "Quest needs a title";
      errorMsg.classList.remove("hidden");
      return;
  } 
  else {
      errorMsg.classList.add("hidden");
  }
  if (thumbnailInput.files && thumbnailInput.files[0]) { //if custom thumbnail exists
    thumbnail = await readFileAsDataURL(thumbnailInput.files[0]); // thumbnail var is that thumbnail that exists
  }
  if (imagesInput.files.length > 0) {//if there are additional images
    const files = Array.from(imagesInput.files); //make an array out of them

    images = await Promise.all( //wait until all promises finish to continue
      files.map(file => readFileAsDataURL(file))//create an array of promises one per image
    );
  }

  addQuest(title, reward, difficulty, thumbnail, pixelated, description, host, images); //create quest
});

//######################################################## add quest to cards array / creates the quest card
async function addQuest(title, reward, difficulty, thumbnail, pixelated, description, host, images) {
  const newQuest = {
    id: "quest_" + Date.now(),
    title: title,
    reward: reward || 0,
    difficulty: difficulty || 1,
    thumbnail: thumbnail,
    pixelated: pixelated,
    description: description || "", //currently not called for
    host: host || "",
    images: images || []
  };

  cards.push(newQuest);
  try {
    await saveQuestToDB(newQuest); //save the new quest to the database
  } 
  catch (e) {
    console.error(e);
  } 

  //refresh card display
  renderCards();

  // reset form
  resetForm();

  //hide that form
  overlay.classList.add("hidden");
}
//########################################################
//########################################################
//######################################################## upload/download
//########################################################
//########################################################

//######################################################## download the project to a json file
downloadBtn.addEventListener("click", () => { downloadProject(); });

//######################################################## upload a json file to act as current project DEPRICATED
/*
uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);

      // --------------------------
      // validate base structure
      // --------------------------
      if (!imported || typeof imported !== "object") {
        throw new Error("Invalid format");
      }

      // --------------------------
      // CARDS
      // --------------------------
      if (Array.isArray(imported.cards)) {
        cards = imported.cards.map(q => ({
          id: q.id || "quest_" + Date.now() + Math.random(),
          title: String(q.title || "Untitled Quest"),
          reward: Number(q.reward) || 0,
          difficulty: Number(q.difficulty) || 1,
          thumbnail: q.thumbnail || "assets/images/defaultThumb.png",
          pixelated: Boolean(q.pixelated),
          description: String(q.description || ""),
          host: String(q.host || ""),
          images: Array.isArray(q.images) ? q.images : []
        }));
      } else {
        // optional fallback if older format is used
        console.warn("No cards found in import file");
        cards = [];
      }

      //
      if (imported.map && typeof hydrateMap === "function") {
        hydrateMap(imported.map);
      }
      renderCards();

      //save the quests
      cards.forEach(saveQuestToDB);

    } catch (err) {
      console.error("Import failed:", err);
      alert("Invalid project file.");
    }
  };

  reader.readAsText(file);
});
*/

//########################################################
//########################################################
//######################################################## Other
//########################################################
//########################################################

//######################################################## turn file into Data URL //return a promise that does that
function readFileAsDataURL(file) {
  return new Promise((resolve) => {//complete promise when resolve is complete
    const reader = new FileReader();//create a new file reader
    reader.onload = (e) => resolve(e.target.result);//upon loading the image file resolve
    reader.readAsDataURL(file);//read file as a DataURL
  });
}

//######################################################## reset the form fields to their empty state
function resetForm() {
  document.querySelector("#questTitle").value = "";
  document.querySelector("#questReward").value = "";
  document.querySelector("#questDifficulty").value = "";
  document.querySelector("#questThumbnail").value = "";
  document.querySelector("#thumbnailPreview").src = "assets/images/defaultThumb.png";
  document.querySelector("#pixelToggle").checked = false;
  document.querySelector("#questHost").value = "";
  document.querySelector("#questDescription").value = "";
  imagesInput.value = "";
  thumbnailInput.value = "";
}

//######################################################## deletes cards from database and re-renders
clearBtn.addEventListener("click", () => {
  clearDB();
  cards = [];
  renderCards();
});

//######################################################## open or create the database
function openDB() {//create or open database
  return new Promise((resolve, reject) => {//return results of promise? (I still don't fully get async & promises)
    const request = indexedDB.open(DB_NAME, 2); //open database with matching name and version or create it

    request.onupgradeneeded = (event) => {//if the database has just been created or the version # has increased
      const db = event.target.result;//the database is assigned to variable db

      if (!db.objectStoreNames.contains("quests")) {
        db.createObjectStore("quests", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("maps")) {
        db.createObjectStore("maps", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);//fulfill promise
    request.onerror = () => reject(request.error);//tell await to throw an error
  });
}

//######################################################## add a quest to the database
async function saveQuestToDB(quest) {//saves an individual quest to the database
  const db = await openDB(); //wait for openDB to resolve

  const tx = db.transaction(STORES.QUESTS, "readwrite");//create database interaction with ability to read and write to database
  const store = tx.objectStore(STORES.QUESTS);//store is the object storage

  store.put(quest);//add the new quest to store

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();//whatever called us gets resolved promise
    tx.onerror = () => reject(tx.error);//...or not
  });
}

//######################################################## load quests from the database
async function loadQuestsFromDB() {//loads quests from database
  const db = await openDB();//db is database full of quests SAME AS saveQuestToDB
  const tx = db.transaction(STORES.QUESTS, "readonly");
  const store = tx.objectStore(STORES.QUESTS);

  return new Promise((resolve, reject) => { //resolve promise
    const request = store.getAll();//get all database objects

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

//######################################################## removes all quests from database
async function clearDB() {
  const db = await openDB();
  const tx = db.transaction(STORES.QUESTS, "readwrite");
  const store = tx.objectStore(STORES.QUESTS);

  return new Promise((resolve, reject) => {
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

//########################################################
//########################################################
//######################################################## run on start
//########################################################
//########################################################

//######################################################## imports json to the page/database //tells import.js how to do its job
setupImporter({
  inputSelector: "#uploadQuests",

  setCards: async (newCards) => {
    await clearDB();
    cards = newCards;
    await Promise.all(cards.map(saveQuestToDB));
    renderCards();
  },

  hydrateMap: async (mapData) => {
    if (!mapData) return;

    const db = await openDB();
    const tx = db.transaction(STORES.MAPS, "readwrite");
    const store = tx.objectStore(STORES.MAPS);

    store.put({
      id: "current",
      data: mapData
    });
  }
});

//######################################################## loads quests in the database when the page is opened
(async () => {//upon page load
  try {
    cards = await loadQuestsFromDB();//load quests
    renderCards();//render those quests
  } catch (err) {
    console.error("Failed to load DB:", err);
  }
})();