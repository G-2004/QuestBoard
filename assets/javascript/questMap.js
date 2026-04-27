//########################################################
//########################################################
//######################################################## Global Variables
//########################################################
//########################################################
const regionModifiers = { //currently these are being assigned here. MAKE USER MADE LATER.
  floweringmeadow: 1,
  dragonlands: 3,
  sandyhollow: 2
};
const camera = {
  x: 0,
  y: 0,
  zoom: 1
};
const mapContainer = document.querySelector("#mapContainer"); //contains both the canvas and ui buttons
const nodes = new Map(); // id - node
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const animSpeed = 0.01; // adjust smoothness
//button elements
const addNodeBtn = document.querySelector("#addNode");
const connectBtn = document.querySelector("#addConnect");
const pathBtn = document.querySelector("#runPath");
const delNodeBtn = document.querySelector("#deleteNode");
//...
let selectedStart = null;//user selected path start
let selectedGoal = null; //user selected path end
let mapImage = new Image(); //the actual image used for the map
let currentPath = []; //a variable to hold the current best path to the goal
let animatedPath = [];
let animSegment = 0;
let animT = 0; // 0 to 1 along current segment
let pendingConnectionNode = null;
let mode = "none"; // "add" | "connect" | "path" | "delete" | "none"
let dragging = false; //if we are moving the screen
let last = { x: 0, y: 0 };//where the mouse was last frame?
//ui states
let pathMode = false;
let addMode = false;
let connectMode = false;
let deleteMode = false;
//size canvas to window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


//########################################################
//########################################################
//######################################################## Pathing
//########################################################
//########################################################

//######################################################## get the id of all connected nodes and the cost to move there
function getNeighbors(node) {
  return node.connections.map(c => ({ //make a map out of all connections 
  // each mapped connection is linked to its cost and node id
    node: nodes.get(c.id), //current connection node
    cost: c.cost //current connection cost
  }));
}

//######################################################## get the cost to move to a given node from a given node
function getTraversalCost(fromNode, toNode, baseCost) {
  const regionFactor = regionModifiers[toNode.region] || 1; //get cost of region of node you are moving to or 1
  return baseCost * regionFactor; //multiply base cost by region difficulty/problems (maybe change to add?)
}

//######################################################## CURRENTLY USELESS ... but used
function heuristic(a, b) {
  return 0;
  //const dx = a.x - b.x;
  //const dy = a.y - b.y;
  //return Math.sqrt(dx * dx + dy * dy); //pythagorean theorem
}

//######################################################## return the path we took to reach the goal
function reconstructPath(cameFrom, current) {
  const path = [current.id]; //give goal node as start of path // goal is the active node

  while (cameFrom.has(current.id)) {
    current = cameFrom.get(current.id);//current node is node we cameFrom
    path.push(current.id);//add new current to end of array
  }

  return path.reverse(); //return the array but flipped/backwards
}

//######################################################## create a node at a given location
function createNode(id, region, x, y) {
  nodes.set(id, {//in nodes find or create node with matching id
    id, //assign an id
    region, //assign a region
    connections: [], // connections to other nodes
    x,
    y
  });
}

//######################################################## connect two nodes and set the cost to move between them
function connect(aId, bId, cost) {
  const a = nodes.get(aId); //point 1
  const b = nodes.get(bId); // point 2

  a.connections.push({ id: bId, cost }); //give node A a connection to node B with cost
  b.connections.push({ id: aId, cost });//give node B a connection to node A with cost
}

//######################################################## determine best route to goal node from start node
function aStar(startId, goalId) {
  const start = nodes.get(startId); //id of start node
  const goal = nodes.get(goalId); // id of end node

  const openSet = [start];//nodes to check //start is checked by default
  const cameFrom = new Map(); //stores best path

  const gScore = new Map();//cost to get to current node
  const fScore = new Map();//estimated cost to goal from node

  nodes.forEach(n => {//for every node
    gScore.set(n.id, Infinity);//all nodes default assumed impossibly expensive
    fScore.set(n.id, Infinity);//all nodes default assumed impossibly expensive
  });

  gScore.set(start.id, 0); //cost to get to starting node is 0
  fScore.set(start.id, heuristic(start, goal)); //estimate distance to get from start to goal //always underestimates or gets it exact

  while (openSet.length > 0) { //for as long as there are nodes in openSet to be checked
    // get node with lowest fScore
    openSet.sort((a, b) => fScore.get(a.id) - fScore.get(b.id));//sort nodes in openSet by comparing fScores so the lowest cost is first
    const current = openSet.shift();//remove best option from openSet (nodes to be checked) and assign that value to current

    if (current.id === goal.id) {//if current id is the goal reconstruct the path we took to get here.
      return reconstructPath(cameFrom, current);
    }

    for (let neighborData of getNeighbors(current)) { //neighborData is all connections to current node //for each item in neighborData
      const neighbor = neighborData.node; //set just the node part as neighbor

      const cost = getTraversalCost(//get cost to move to neighbor
        current,
        neighbor,
        neighborData.cost
      );

      const tentativeG = gScore.get(current.id) + cost; //tentativeG is the cost it took to get here plus the cost it takes to get to the connection
      
      //the cost to go backwards will always be = or higher to the cost to get to the current node because tentativeG includes the cost it took to get to the current location
      if (tentativeG < gScore.get(neighbor.id)) {//if the cost to reach the connection is lower than the best known cost to get to that neighbor
        cameFrom.set(neighbor.id, current);//current is node this neighbor node came from so it'll chain back to start

        gScore.set(neighbor.id, tentativeG);//best cost to reach neighbor is now tentativeG
        fScore.set(//update estimated cost based on real cost thus far and estimated cost
          neighbor.id,
          tentativeG + heuristic(neighbor, goal) //set fscore to cost to get here and assumed cost to reach goal
        );

        if (!openSet.includes(neighbor)) {//add this to nodes to explore if not already present
          openSet.push(neighbor);
        }
      }
    }
  }

  return null; // no path to goal from start
}
//########################################################
//########################################################
//######################################################## Camera
//########################################################
//########################################################

//######################################################## adjusts camera zoom level
canvas.addEventListener("wheel", (e) => {//when scrolling over canvas item
  e.preventDefault();//do not scroll the page as normal

  const zoomFactor = 1.1;//how much to change the zoom by. 10%
  const direction = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor; // deltaY is scroll direction // if deltaY greater than 0 zoom in else zoom out

  // mouse position in screen space
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  // convert mouse position to world coordinates BEFORE zoom
  const worldX = camera.x + mouseX / camera.zoom;
  const worldY = camera.y + mouseY / camera.zoom;

  const newZoom = camera.zoom * direction; //take current zoom and multiply by 1.1 or 0.91 (direction)

  // adjust camera so zoom focuses on mouse position
  camera.x = worldX - mouseX / newZoom;
  camera.y = worldY - mouseY / newZoom;

  camera.zoom = newZoom; //update zoom level

  render();//render everything
});

//######################################################## returns x and y location on map as an x and y on the screen (hard to describe)
function worldToScreen(x, y) {//How far is this world point from the camera
  return {
    x: (x - camera.x) * camera.zoom, 
    y: (y - camera.y) * camera.zoom
  };
}

//######################################################## update background image based on user upload
document.querySelector("#mapUpload").addEventListener("change", (e) => { //if a file is uploaded to #mapUpload
  const file = e.target.files[0]; // get that file
  const url = URL.createObjectURL(file); //turn file into usable url

  mapImage.onload = () => {
    render(); // render after image is ready
  };

  mapImage.src = url; //mapImage is the image uploaded now
});

//######################################################## tell code we are panning when holding down mouse
mapContainer.addEventListener("mousedown", (e) => {
  dragging = true; //we are actively moving
  
  //horizontal and vertical position of mouse
  last.x = e.clientX;
  last.y = e.clientY;
});

//######################################################## if the mouse has been released from being held down we are not panning the camera
mapContainer.addEventListener("mouseup", () => dragging = false);

//######################################################## pan the camera when the mouse is being held down and moved
mapContainer.addEventListener("mousemove", (e) => { //when the mouse moves
  if (!dragging) return; //if we are dragging continue else return

  //delta of x/y //how far has the mouse moved since last frame //divide by zoom cause it changes the mapUnits to move by. (basically make zoom matter when panning)
  const dx = (e.clientX - last.x) / camera.zoom;
  const dy = (e.clientY - last.y) / camera.zoom;

  //take the current camera x/y and move up/down left/right based on change/delta
  camera.x -= dx;
  camera.y -= dy;

  //last position is now current mouse position
  last.x = e.clientX;
  last.y = e.clientY;

  //render everything
  render();
});
//########################################################
//########################################################
//######################################################## Draw
//########################################################
//########################################################

//######################################################## Draws the connection between two points
function drawEdge(a, b) { //connects two given nodes
  ctx.beginPath();// start path
  ctx.moveTo(a.x, a.y); //set coords
  ctx.lineTo(b.x, b.y); //from coords make line to b coords
  ctx.stroke(); //draw that line
}

//######################################################## Draws a given node
function drawNode(node) { //draws the location of given node
  ctx.beginPath();
  ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
  ctx.fill();
}

//######################################################## Draws a line segment t being the completion percentage (1 = done | 0 = none)
function drawAnimatedEdge(a, b, t) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);

  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;

  ctx.lineTo(x, y);
  ctx.stroke();
}

//######################################################## Draw all nodes and connections taking camera position into account
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);//clear canvas

  ctx.save();//save drawing settings

  // move drawing based on camera x and y and zoom
  ctx.translate(-camera.x * camera.zoom, -camera.y * camera.zoom);
  ctx.scale(camera.zoom, camera.zoom);

  // draw background image
  if (mapImage.complete) {
    ctx.drawImage(mapImage, 0, 0);
  }

  // draw connections/edges (Base)
  nodes.forEach(node => { //for every node
    node.connections.forEach(c => {//for every connection to that node
      const target = nodes.get(c.id);//current node to connect to 

      if (node.id < target.id) { //sort by uuid to prevent drawing a connection twice
        ctx.strokeStyle = "white";
        drawEdge(node, target);
      }
    });
  });

  // draw connections/edges (animated overlay)
  if (currentPath && currentPath.length > 1) { //if there is a path and it has more than one node in it
    for (let i = 0; i < animSegment; i++) { //for each segmant of the animation prior to this
      const a = nodes.get(currentPath[i]); //current node
      const b = nodes.get(currentPath[i + 1]); //next node

      ctx.strokeStyle = "red"; //draw in red
      drawEdge(a, b);//draw the edge with no animation //appears like nothing changed to user
    }

    // partial segment
    if (animSegment < currentPath.length - 1) { //if this isn't the last segmant/node
      const a = nodes.get(currentPath[animSegment]); //current node
      const b = nodes.get(currentPath[animSegment + 1]);//next node

      ctx.strokeStyle = "red";// draw in red
      drawAnimatedEdge(a, b, animT); //run drawAnimatedEdge
      
    }
  }

  // draw nodes
  nodes.forEach(node => {
    const isCompleted =
      currentPath.indexOf(node.id) !== -1 &&
      currentPath.indexOf(node.id) < animSegment;

    const isCurrent = node.id === currentPath[animSegment];

    const isNext = node.id === currentPath[animSegment + 1];
    if (node === pendingConnectionNode) ctx.fillStyle = "green";
    else if (node === selectedStart) ctx.fillStyle = "blue"; //if this is selected start draw in blue
    else if (node === selectedGoal) ctx.fillStyle = "yellow"; //if this is selected end draw in yellow
    else if (isCompleted) ctx.fillStyle = "red";
    else if (isCurrent || isNext) ctx.fillStyle = "red"; //if this node is in the animated path draw in red
    else ctx.fillStyle = "white"; //otherwise draw in white
    drawNode(node);//draw it
  });

  ctx.restore();//restore from save settings
}

//######################################################## clear previous path and start animation
function animatePath() {
  animSegment = 0;//how many segmants have we gone through
  animT = 0;
  animatedPath = [];

  //######################################################## animate the path being taken to get to the goal from start
  function step() {
    if (!currentPath || currentPath.length < 2) return; //no path no animation

    const aId = currentPath[animSegment]; //current node
    const bId = currentPath[animSegment + 1]; //next node

    //acutally turn them into nodes
    const a = nodes.get(aId); 
    const b = nodes.get(bId);

    animT += animSpeed;//progress along edge

    if (animT >= 1) {//if animT is one it is complete
      if (!animatedPath.includes(aId)) {animatedPath.push(aId)};//store each node that is done animating

      animSegment++;
      animT = 0;//reset animT for next node

      if (animSegment >= currentPath.length - 1) {
        animatedPath.push(bId);//push next node into completed path
        render();//render everything
        return; //stop we are done
      }
    }

    render();//render everything
    requestAnimationFrame(step); //when screen refreshes step again
  }

  step();
}
//########################################################
//########################################################
//######################################################## Mode
//########################################################
//########################################################

//######################################################## CURRENTLY UNUSED
function setMode(newMode) {
  mode = (mode === newMode) ? "none" : newMode;
  updateMode()
}

//######################################################## resets all modes into the inactive state (false)
function resetModes() { //generate a universally unique Id
  pathMode = false;
  addMode = false;
  connectMode = false;
  deleteMode = false;
}

//######################################################## set existance of class on button based on whether that mode is active
function updateModeUI() {
  addNodeBtn.classList.toggle("buttonActive", addMode);
  connectBtn.classList.toggle("buttonActive", connectMode);
  pathBtn.classList.toggle("buttonActive", pathMode);
  delNodeBtn.classList.toggle("buttonActive", deleteMode);
}

//######################################################## press the escape key to exit pathMode
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") exitPathMode();
});

//######################################################## turn off/exit pathMode
function exitPathMode() {
  pathMode = false;

  clearPath();

  updateCursor();
  toggleExitButton(false);
  render();
}

//######################################################## when clicking addNode button change addMode to on or off mode (turn other modes off too)
document.querySelector("#addNode").addEventListener("click", () => {
  const wasActive = addMode; //save current state t/f

  resetModes();//set all modes to false

  addMode = !wasActive; // flip state from t to f or vise versa

  // reset state when entering

  updateMode()
});

//######################################################## when clicking addConnect button change connectMode to on or off mode (turn other modes off too)
document.querySelector("#addConnect").addEventListener("click", () => {
  const wasActive = connectMode; //save current state t/f

  resetModes();//set all modes to false

  connectMode = !wasActive; // flip state from t to f or vise versa

  // reset state when entering

  updateMode()
});

//######################################################## when clicking deleteNode button change deleteMode to on or off mode (turn other modes off too)
document.querySelector("#deleteNode").addEventListener("click", () => {
  const wasActive = deleteMode; //save current state t/f

  resetModes();//set all modes to false
  node = 

  deleteMode = !wasActive; // flip state from t to f or vise versa

  updateMode()
});

//######################################################## when clicking runPath button change pathMode to on or off mode (turn other modes off too)
document.querySelector("#runPath").addEventListener("click", () => {
  const wasActive = pathMode; //save current state t/f

  resetModes();//set all modes to false

  pathMode = !wasActive; // flip state from t to f or vise versa

  // reset state when entering
  if (pathMode) {
    clearPath();
    toggleExitButton(true);
  }
  else {
    toggleExitButton(false);
  }

  updateMode();
});
//######################################################## delete a clicked node and its connections
function deleteNode(nodeId) {
  const node = nodes.get(nodeId);
  if (!node) return;

  // remove references from neighbors
  node.connections.forEach(c => {
    const neighbor = nodes.get(c.id);
    if (!neighbor) return;

    neighbor.connections = neighbor.connections.filter(
      conn => conn.id !== nodeId
    );
  });

  // remove the node itself
  nodes.delete(nodeId);
}

//######################################################## based on active mode add, delete, connect, etc.
canvas.addEventListener("click", (e) => {

  if(deleteMode){
    const node = getClickedNode(e);

    if (!node) return;

    const deletedId = node.id;

    deleteNode(deletedId);

    // clear selections if deleted
    if (selectedStart === node) selectedStart = null;
    if (selectedGoal === node) selectedGoal = null;
    if (pendingConnectionNode === node) {
      pendingConnectionNode = null;
    }

    // invalidate path if it used this node
    if (currentPath.includes(deletedId)) {
      currentPath = [];
      animatedPath = [];
      animSegment = 0;
      animT = 0;
    }

    render();
  }
  else if(addMode){
    const pos = getMouseWorldPos(e);
    const x = pos.x
    const y = pos.y
    const id = generateId();

    createNode(id, "dragonlands", x, y);

    render();
  }
  else if (pathMode){

    const node = getClickedNode(e);

    if (!node) return;

    //set start of path
    if (!selectedStart) {
      selectedStart = node;
      selectedGoal = null;
      currentPath = [];
      animatedPath = [];
    } 
    //set end of path
    else if (!selectedGoal) {
      selectedGoal = node;

      const result = aStar(selectedStart.id, selectedGoal.id);
      currentPath = result || [];

      animatePath(); //render the path
    }
    //start new path
    else {
      selectedStart = node;
      selectedGoal = null;
      currentPath = [];
      animatedPath = [];
    }

    render();
  }
  else if (connectMode) {

    const node = getClickedNode(e);

    if (!node) return;

    // FIRST CLICK
    if (!pendingConnectionNode) {
      pendingConnectionNode = node;
      render();
      return;
    }

    // SECOND CLICK
    const nodeA = pendingConnectionNode;
    const nodeB = node;

    // prevent self-connection
    if (nodeA === nodeB) {
      pendingConnectionNode = null;
      render();
      return;
    }

    // prevent duplicate connection
    const alreadyConnected = nodeA.connections.some(c => c.id === nodeB.id);

    if (!alreadyConnected) {
      connect(nodeA.id, nodeB.id, 5); // default cost
    }

    // reset for next connection
    pendingConnectionNode = null;

    render();
  }
  else{
    return
  }
});

//######################################################## clicking the exitPathMode (x) button exits path mode
document.querySelector("#exitPathMode")
  .addEventListener("click", exitPathMode);

//######################################################## whether to display the exitPathMode (x) button
function toggleExitButton(show) {
  const el = document.querySelector("#exitPathMode");
  el.style.display = show ? "block" : "none";
}

//######################################################## update cursor style depending on mode
function updateCursor() {
  canvas.style.cursor = pathMode || addMode || connectMode || deleteMode ? "crosshair" : "default";
}
//########################################################
//########################################################
//######################################################## Other
//########################################################
//########################################################

//######################################################## enables bootstrap tooltips
document.addEventListener("DOMContentLoaded", () => {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');

  tooltipTriggerList.forEach(el => {
    new bootstrap.Tooltip(el);
  });
});

//######################################################## returns position of the mouse on the screen
function getMouseWorldPos(e) {
  const rect = canvas.getBoundingClientRect();//coordinates and size of canvas

  const screenX = e.clientX - rect.left; //take X of mouse and subtract how far that is from the canvas x
  const screenY = e.clientY - rect.top;

  return { //undo zoom and pan to correct x/y position and return that
    x: screenX / camera.zoom + camera.x,
    y: screenY / camera.zoom + camera.y
  };
}

//######################################################## returns node at given coordinates (often mouse position)
function getNodeAt(x, y) { // x/y are the x y of the page not canvas
  const radius = 10; // same as drawNode

  for (let node of nodes.values()) { //for everything in nodes.values (every node)
    const dx = node.x - x; //take x coordinate of node and subtract x of mouse to get distance
    const dy = node.y - y;

    if (Math.sqrt(dx * dx + dy * dy) <= radius) { //if the node is within the radius then return this node
      return node;
    }
  }

  return null;//we did not click a node
}

//######################################################## generates a universally unique Id
function generateId() { //generate a universally unique Id
  return crypto.randomUUID();
}

//######################################################## returns node at mouse position
function getClickedNode(e) {
  const pos = getMouseWorldPos(e);
  return getNodeAt(pos.x, pos.y);
}

//######################################################## clears the optimal path from start to goal; also resets start and goal locations to null
function clearPath(){
  selectedStart = null;
  selectedGoal = null;
  currentPath = [];
  animatedPath = [];
}

//######################################################## runs other functions to render page and update cursor style
function updateMode(){
  updateCursor();
  updateModeUI();
  render();
}
//########################################################
//########################################################
//######################################################## Run on start
//########################################################
//########################################################

//######################################################## render on starting page
render();// render on loading the page