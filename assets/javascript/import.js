//########################################################
//########################################################
//######################################################## import
//########################################################
//########################################################

//######################################################## imports json to page as appropriate
export function setupImporter({ 
  inputSelector, 
  setCards, 
  renderCards, 
  hydrateMap 
}) {
  const uploadInput = document.querySelector(inputSelector);
  if (!uploadInput) return;

  uploadInput.addEventListener("change", () => {
    const file = uploadInput.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);

        if (!imported || typeof imported !== "object") {
          throw new Error("Invalid format");
        }

        let data = imported;

        // support raw map files
        if (!data.map && data.nodes) {
          data = { map: data };
        }

        // cards
        if (Array.isArray(data.cards) && setCards) {
          setCards(data.cards.map(q => ({
            id: q.id || "quest_" + Date.now() + Math.random(),
            title: String(q.title || "Untitled Quest"),
            reward: Number(q.reward) || 0,
            difficulty: Number(q.difficulty) || 1,
            thumbnail: q.thumbnail || "assets/images/defaultThumb.png",
            pixelated: Boolean(q.pixelated),
            description: String(q.description || ""),
            host: String(q.host || ""),
            images: Array.isArray(q.images) ? q.images : []
          })));
        }

        // map
        if (data.map && hydrateMap) {
          hydrateMap(data.map);
        }

        if (renderCards) {
          renderCards();
        }

      } catch (err) {
        console.error(err);
        alert("Invalid project file.");
      }
    };

    reader.readAsText(file);
  });
}