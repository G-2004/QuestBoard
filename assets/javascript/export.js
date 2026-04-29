//########################################################
//########################################################
//######################################################## Global Variables
//########################################################
//########################################################
const DB_NAME = "QuestDB";

const STORES = {
  QUESTS: "quests",
  MAPS: "maps"
};

//######################################################## opens the database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

//######################################################## loads quest cards
async function loadCards(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.QUESTS, "readonly");
    const store = tx.objectStore(STORES.QUESTS);

    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

//######################################################## loads the map
async function loadMap(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MAPS, "readonly");
    const store = tx.objectStore(STORES.MAPS);

    const req = store.get("current");

    req.onsuccess = () => resolve(req.result?.data || null);
    req.onerror = () => reject(req.error);
  });
}

//######################################################## downloads project to a json
function downloadJSON(obj, filename = "quest-project.json") {
  const dataStr = JSON.stringify(obj, null, 2);

  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

//######################################################## gathers everything together to download project then downloads
export async function downloadProject() {
  const db = await openDB();

  const [cards, map] = await Promise.all([
    loadCards(db),
    loadMap(db)
  ]);

  const payload = {
    cards,
    map
  };

  downloadJSON(payload);
}