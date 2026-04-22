let cards = [];

const overlay = document.querySelector("#questFormOverlay");
const openBtn = document.querySelector("#openQuestForm");
const closeBtn = document.querySelector("#closeForm");
const addBtn = document.querySelector("#addQuest");

//when clicking create quest show the form
openBtn.addEventListener("click", () => {
  overlay.classList.remove("hidden");
});

//when clicking close hide the form
closeBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  previewImg.src = "assets/images/defaultThumb.png";
});

// hide when clicking outside the form area
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
      overlay.classList.add("hidden");
      previewImg.src = "assets/images/defaultThumb.png";
  }
});

//function for deciding what to display based on given difficulty
function getDifficultyDisplay(level) {
    if (!level || level < 1) return "—";

    if (level <= 10) {
        return "X".repeat(level); //REPLACE with an image later
    } else {
        return `X x ${level}`; //REPLACE with an image later
    }
}

// image upload preview
const thumbnailInput = document.querySelector("#questThumbnail");
const previewImg = document.querySelector("#thumbnailPreview");

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

//gathers form data to use in addQuest function
addBtn.addEventListener("click", () => {
  const title = document.querySelector("#questTitle").value;
  const reward = Number(document.querySelector("#questReward").value);
  const difficulty = Number(document.querySelector("#questDifficulty").value);
  const pixelated = document.querySelector("#pixelToggle").checked;
  let thumbnail = "assets/images/defaultThumb.png";

  // minimum requirements - have a title
  const errorMsg = document.querySelector("#formError");
  if (!title) {
      errorMsg.textContent = "Quest needs a title";
      errorMsg.classList.remove("hidden");
      return;
  } 
  else {
      errorMsg.classList.add("hidden");
  }
  if (thumbnailInput.files && thumbnailInput.files[0]) { //is true if thumbnail input exists
    const file = thumbnailInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      thumbnail = e.target.result; //user thumbnail over-write default

      //create quest using upload
      addQuest(title, reward, difficulty, thumbnail, pixelated);
    };
    reader.readAsDataURL(file);
  }
  else {
    //create quest using default
    addQuest(title, reward, difficulty, thumbnail, pixelated);
  }
});

//add quest to cards array
function addQuest(title, reward, difficulty, thumbnail, pixelated) {
  const newQuest = {
    id: "quest_" + Date.now(),
    title: title,
    reward: reward || 0,
    difficulty: difficulty || 1,
    thumbnail: thumbnail,
    pixelated: pixelated
  };

  cards.push(newQuest);
  //refresh card display
  renderCards();

  // reset form
  resetForm();

  //hide that form
  overlay.classList.add("hidden");
}
/*
//render the quest cards
function renderCards() {
  const container = document.querySelector(".cardHolder");
  container.innerHTML = ""; //resets if filled to blank for a moment
  cards.forEach(card => {
    const div = document.createElement("div"); //create empty div/card
    div.classList.add("questCard"); //give that div the questCard class

    const pixelClass = card.pixelated ? "pixelated" : ""; //if pixel switch is true ${pixelClass} is pixelated otherwise there is no class added

    //fill in key details with the info on the card and insert into the div
    div.innerHTML = `
        <img src="${card.thumbnail}" alt="${card.title}" class="questThumbnail ${pixelClass}">
      <div class="cardText">
        <h3>${card.title}</h3>
        <p>Reward: ${card.reward} gold</p>
        <p class="TNR">Difficulty: ${getDifficultyDisplay(card.difficulty)}</p>
      </div>
    `;
    container.appendChild(div); //add this new div under the container div.
  });
}
*/

//renders each card. slightly safer
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

    textDiv.appendChild(title); //make these children of the text
    textDiv.appendChild(reward);
    textDiv.appendChild(difficulty);

    div.appendChild(img); //make these children of the card
    div.appendChild(textDiv);

    container.appendChild(div); //make these children of the existing html

  });
}

// reset form
function resetForm() {
  document.querySelector("#questTitle").value = "";
  document.querySelector("#questReward").value = "";
  document.querySelector("#questDifficulty").value = "";
  document.querySelector("#questThumbnail").value = "";
  document.querySelector("#thumbnailPreview").src = "assets/images/defaultThumb.png";
  document.querySelector("#pixelToggle").checked = false;
}