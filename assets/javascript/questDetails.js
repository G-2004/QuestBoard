//NEW database stuff
const DB_NAME = "QuestDB";//variable for database name
const STORE_NAME = "quests";//object storage

function openDB() {//create or open database
  return new Promise((resolve, reject) => {//return results of promise? (I still don't fully get async & promises)
    const request = indexedDB.open(DB_NAME, 1); //open database with matching name and version or create it

    request.onupgradeneeded = (event) => {//if the database has just been created or the version # has increased
      const db = event.target.result;//the database is assigned to variable db

      if (!db.objectStoreNames.contains(STORE_NAME)) { //does the object storage table exist
        db.createObjectStore(STORE_NAME, { keyPath: "id" });//if not create it
      }
    };

    request.onsuccess = () => resolve(request.result);//fulfill promise
    request.onerror = () => reject(request.error);//tell await to throw an error
  });
}

const params = new URLSearchParams(window.location.search);//grab url parameters fed in
const questId = params.get("id");//questId is id from params/the url

async function getQuestById(id) {//return id of quest
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);//return object with matching id
    request.onerror = () => reject(request.error);
  });
}

(async () => {
  const quest = await getQuestById(questId);

  if (!quest) {
    document.body.innerHTML = "<h2>Quest not found</h2>";
    return;
  }
  

  renderQuest(quest);
})();

function renderQuest(q) {//render the quest
  const carousel = document.querySelector("#carouselContainer");
  const indicators = document.querySelector("#carouselIndicators");

  if (!carousel || !indicators) return; //if the carousel or indicators don't exist stop rendering

  //clean out carousel
  carousel.innerHTML = "";
  indicators.innerHTML = "";

  //fill these id's with quest data
  document.querySelector("#title").textContent = q.title;
  document.querySelector("#host").textContent = q.host;
  document.querySelector("#reward").textContent = q.reward;
  document.querySelector("#difficulty").textContent = q.difficulty;
  document.querySelector("#description").textContent = q.description;

  const mainImg = document.querySelector("#thumbnail");
  if (mainImg) mainImg.src = q.thumbnail;

  //for every image create a slide and indicator
  (q.images || []).forEach((src, index) => {

    // Slide
    const item = document.createElement("div");
    item.classList.add("carousel-item");
    if (index === 0) item.classList.add("active");

    const img = document.createElement("img");
    img.src = src;
    img.classList.add("d-block", "w-100");

    item.appendChild(img);
    carousel.appendChild(item);

    // Indicator
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-bs-target", "#carouselContainerContainer");
    button.setAttribute("data-bs-slide-to", index);

    if (index === 0) button.classList.add("active");

    indicators.appendChild(button);
  });
}

//create bootstrap carousel
const carouselEl = document.querySelector("#carouselContainerContainer");

new bootstrap.Carousel(carouselEl, {
  interval: false,
  ride: false,
  pause: true,
  wrap: false
});