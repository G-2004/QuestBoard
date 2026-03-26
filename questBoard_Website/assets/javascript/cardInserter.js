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

//render the quest cards
function renderCards() {
  const container = document.querySelector(".cardHolder");
  container.innerHTML = ""; //resets if filled to blank for a moment
  cards.forEach(card => {
    const div = document.createElement("div"); //create empty div/card
    div.classList.add("questCard"); //give that div the questCard class
    //fill in key details with the info on the card and insert into the div
    div.innerHTML = `
      <div class="thumbnailWrapper">
        <img src="${card.thumbnail}" alt="${card.title}" class="questThumbnail">
      </div>
      <div class="cardText">
        <h3>${card.title}</h3>
        <p>Reward: ${card.reward} gold</p>
        <p class="TNR">Difficulty: ${getDifficultyDisplay(card.difficulty)}</p>
      </div>
    `;
    container.appendChild(div); //add this new div under the container div.
  });
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
  let thumbnail = "assets/images/defaultThumb.png";
  // minimum requirements - have a title
  if (!title) {
      alert("Quest needs a title"); //CHANGE from alert to in html message later
      return;
  }
  if (thumbnailInput.files && thumbnailInput.files[0]) { //is true if thumbnail input exists
    const file = thumbnailInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      thumbnail = e.target.result; //user thumbnail over-write default

      //create quest using upload
      addQuest(title, reward, difficulty, thumbnail);
    };
    reader.readAsDataURL(file);
  }
  else {
    //create quest using default
    addQuest(title, reward, difficulty, thumbnail);
  }
});

//add quest to cards array
function addQuest(title, reward, difficulty, thumbnail) {
  const newQuest = {
    id: "quest_" + Date.now(),
    title: title,
    reward: reward || 0,
    difficulty: difficulty || 1,
    thumbnail: thumbnail
  };

  cards.push(newQuest);
  //refresh card display
  renderCards();

  // reset form
  resetForm();

  //hide that form
  overlay.classList.add("hidden");
}

// reset form
function resetForm() {
  document.querySelector("#questTitle").value = "";
  document.querySelector("#questReward").value = "";
  document.querySelector("#questDifficulty").value = "";
  document.querySelector("#questThumbnail").value = "";
  document.querySelector("#thumbnailPreview").src = "assets/images/defaultThumb.png";
}