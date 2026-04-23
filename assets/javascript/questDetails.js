// get id from URL
const params = new URLSearchParams(window.location.search);
const questId = params.get("id");

// get stored quests
const stored = localStorage.getItem("quests");
const cards = stored ? JSON.parse(stored) : [];

// find the quest
const quest = cards.find(q => q.id === questId);

// fail safely
if (!quest) {
  document.body.innerHTML = "<h2>Quest not found</h2>";
  throw new Error("Quest not found");
}

// populate plain text
document.querySelector("#title").textContent = quest.title || "No title";
document.querySelector("#host").textContent = "Host: " + (quest.host || "Unknown");
document.querySelector("#reward").textContent = "Reward: " + (quest.reward || 0) + " gold";
document.querySelector("#difficulty").textContent = "Difficulty: " + (quest.difficulty || 1);
document.querySelector("#description").textContent = quest.description || "No description";

//image carousel

const container = document.querySelector("#carouselContainer");

const images = [ //carousel will contain thumbnail and any additional images
  quest.thumbnail,
  ...(quest.images || [])
];

if (images.length === 0) {// use default if nothing provided
  images.push("assets/images/defaultThumb.png");
}

const carouselId = "questCarousel"; //as per bootstrap requirements

let indicators = ""; //marks at the bottom
let slides = ""; //images

images.forEach((img, index) => {//for all images
  //add an indicator
  indicators += `
    <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${index}"
      class="${index === 0 ? "active" : ""}">
    </button>
  `;

  //and add a slide
  slides += `
    <div class="carousel-item ${index === 0 ? "active" : ""}">
      <img src="${img}" class="d-block w-100">
    </div>
  `;
});

//inside the div add everything
container.innerHTML = `
<div id="${carouselId}" class="carousel slide">

  <div class="carousel-indicators">
    ${indicators}
  </div>

  <div class="carousel-inner">
    ${slides}
  </div>

  <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
    <span class="carousel-control-prev-icon"></span>
  </button>

  <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
    <span class="carousel-control-next-icon"></span>
  </button>

</div>
`;