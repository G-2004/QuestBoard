//########################################################
//########################################################
//######################################################## Global Variables
//########################################################
//########################################################
const DEFAULT_REGION_ID = "default";
const DB_NAME = "QuestDB";
const STORES = {
  MAPS: "maps",
  QUESTS: "quests"
};
const regions = new Map(); // id -> region object
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
//size canvas to window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
import { downloadProject } from "./export.js";
import { setupImporter } from "./import.js";

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
  //get cost of region of node you are moving to or 1
  const region = regions.get(toNode.regionId) || regions.get(DEFAULT_REGION_ID);
  const regionFactor = region?.modifier ?? 1;

  return baseCost * regionFactor; //multiply base cost by region difficulty/problems (maybe change to add?)
}

//######################################################## CURRENTLY USELESS ... but used
function heuristic(a, b) { //technically dijkstra since I decided the taking into acount distance/direction was counterintuitive for this project
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
function createNode(id, regionId, x, y) {

  //========== add a node or overwrite a node with the given id ==========//
  nodes.set(id, {//in nodes find or create node with matching id
    id, //assign an id
    name: "Node",
    regionId, //assign a region
    connections: [], // connections to other nodes
    x,
    y
  });


  //========== save the project ==========//
  autosave();
}

//######################################################## connect two nodes and set the cost to move between them
function connect(aId, bId, cost) {
  //========== get the id of both nodes ==========//
  const a = nodes.get(aId); //point 1
  const b = nodes.get(bId); // point 2

  //========== add a connection to the other node to both ==========//
  a.connections.push({ id: bId, cost }); //give node A a connection to node B with cost
  b.connections.push({ id: aId, cost });//give node B a connection to node A with cost

  //========== save the project ==========//
  autosave();
}

//######################################################## determine best route to goal node from start node
function aStar(startId, goalId) {
  //========== variables to hold the start and end node ids ==========//
  const start = nodes.get(startId); //id of start node
  const goal = nodes.get(goalId); // id of end node

  //========== variables to hold the most optimal path ==========//
  const openSet = [start];//nodes that have been explored but not fully explored
  const cameFrom = new Map(); //stores best path

  //========== variables to hold data on best path to a given node and approximate distance to goal ==========//
  const gScore = new Map();//cost to get to current node along best known path to node from start
  const fScore = new Map();//estimated cost to goal from node

  //========== by default most nodes have no data on the best way to reach them ==========//
  nodes.forEach(n => {//for every node
    gScore.set(n.id, Infinity);//all nodes default assumed impossibly expensive
    //fscore no longer really used (leave present in case we decide to change heuristic)
    fScore.set(n.id, Infinity);//all nodes default assumed impossibly expensive
  });

  //========== set gscore at start to 0 to say there will be no better path to the start because this is the start ==========//
  gScore.set(start.id, 0); //cost to get to starting node is 0
  fScore.set(start.id, heuristic(start, goal)); //estimate distance to get from start to goal //always underestimates or gets it exact

  //========== find the optimal path from start to goal ==========//
  while (openSet.length > 0) { //for as long as there are nodes in openSet to be checked
    // get node with lowest fScore
    //========== look at nodes to be checked and find the one most likely to bring us toward the goal ==========// NOT CURRENTLY USEFUL
    openSet.sort((a, b) => fScore.get(a.id) - fScore.get(b.id));//sort nodes in openSet by comparing fScores so the lowest cost is first
    const current = openSet.shift();//remove best option from openSet (nodes to be checked) and assign that value to current

    //========== if the most likely node to work is the goal recontruct the path ==========//
    if (current.id === goal.id) {
      return reconstructPath(cameFrom, current);
    }

    //========== check all neighbors of current node and ... ==========//
    for (let neighborData of getNeighbors(current)) { //neighborData is all connections to current node //for each item in neighborData
      const neighbor = neighborData.node; //set just the node part as neighbor

      //========== how much would it cost us to move to this neighbor ==========//
      const cost = getTraversalCost(
        current,
        neighbor,
        neighborData.cost
      );

      //========== cost to get to current location and move to neighbor ==========//
      const tentativeG = gScore.get(current.id) + cost;
      
      //========== if this is a more efficient route to this neighbor update neighbors gScore ==========//
      //the cost to go backwards will always be = or higher to the cost to get to the current node because tentativeG includes the cost it took to get to the current location
      if (tentativeG < gScore.get(neighbor.id)) {//if the cost to reach the connection is lower than the best known cost to get to that neighbor

        //========== tell neighbor what node led to this new gScore ==========//
        cameFrom.set(neighbor.id, current);//current is node this neighbor node came from so it'll chain back to start

        gScore.set(neighbor.id, tentativeG);//best cost to reach neighbor is now tentativeG
        fScore.set(//update estimated cost based on real cost thus far and estimated cost
          neighbor.id,
          tentativeG + heuristic(neighbor, goal) //set fscore to cost to get here and assumed cost to reach goal
        );

        //========== this neighbor should be explored now too ==========//
        if (!openSet.includes(neighbor)) {//add this to nodes to explore if not already present
          openSet.push(neighbor);
        }
      }
    }
  }

  //========== if ya couldn't find a path at all say so ==========//
  return null; // no path to goal from start
}

//########################################################
//########################################################
//######################################################## Camera
//########################################################
//########################################################

//######################################################## adjusts camera zoom level
canvas.addEventListener("wheel", (e) => {//when scrolling over canvas item
  //========== remove users normal page scroll ability ==========//
  e.preventDefault();

  //========== how much each wheel click changes zoom by and which direction ==========//
  const zoomFactor = 1.1;//how much to change the zoom by. 10%
  const direction = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor; // deltaY is scroll direction // if deltaY greater than 0 zoom in else zoom out

  //========== where the mouse is on the screen ==========//
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  //========== where the mouse is in the world so we can say where to zoom in on ==========//
  const worldX = camera.x + mouseX / camera.zoom;
  const worldY = camera.y + mouseY / camera.zoom;
  /*
    //ex: current camera position + mouse position on screen / camera zoom level = where the mouse is in the world
    //Zoom is how many pixels on your screen makes up a single world pixel. so a zoom of 2 says two pixels on your screen is one pixel on the canvas
    //(2 would be 2px y and 2 px x so it is a 2 by 2 area making up one canvas pixel/unit)
    //zoom must be undone to say one pixel on the screen is one pixel in the world
  */

  //========== take current zoom level and adjust it with a new zoom level ==========//
  const newZoom = camera.zoom * direction; //take current zoom and multiply by 1.1 or 0.91 (direction)
  //(direction is which way to zoom and how strong combined)

  //========== adjust camera so zoom focuses on mouse position ==========//
  camera.x = worldX - mouseX / newZoom;
  camera.y = worldY - mouseY / newZoom;

  //========== set the new zoom level ==========//
  camera.zoom = newZoom; //update zoom level

  //========== render everything ==========//
  render();
});

//######################################################## returns x and y location on map as an x and y on the screen (hard to describe)
function worldToScreen(x, y) {//How far is this world point from the camera
  return {
    x: (x - camera.x) * camera.zoom, 
    y: (y - camera.y) * camera.zoom
  };
  /*
    //Zoom is how many pixels on your screen makes up a single world pixel. so a zoom of 2 says two pixels on your screen is one pixel on the canvas
    //(2 would be 2px y and 2 px x so it is a 2 by 2 area making up one canvas pixel/unit)
    //zoom must be undone to say one pixel on the screen is one pixel in the world
  */
}

//######################################################## update background image based on user upload
document.querySelector("#mapUpload").addEventListener("change", (e) => {
  //========== when we think a file is uploaded assign that file to a variable and ==========//
  const file = e.target.files[0];
  //========== if nothing was actually uploaded stop ==========//
  if (!file) return;
  //========== a reader used to interpret the file ==========//
  const reader = new FileReader();

  //========== once the reader has converted the file ==========//
  reader.onload = async (event) => {
    //========== this is the image ==========//
    const base64 = event.target.result;

    mapImage = new Image();

    //========== once the reader has converted the file render it and save the project ==========//
    mapImage.onload = () => {
      render();
      autosave();
    };

    //========== if the image is corrupted or not an image send a warning ==========//
    mapImage.onerror = () => {
      console.warn("Invalid base64 map image");
    };

    //========== set the backround image to the uploaded image ==========//
    mapImage.src = base64;
  };

  //========== turn the binary data of the file into base64 image data/url ==========//
  reader.readAsDataURL(file);
});

//######################################################## tell code we are panning when holding down mouse
mapContainer.addEventListener("mousedown", (e) => {
  //========== tell the program we are panning ==========//
  dragging = true;
  
  //========== where the mouse is ==========//
  last.x = e.clientX;
  last.y = e.clientY;
});

//######################################################## if the mouse has been released from being held down we are not panning the camera
mapContainer.addEventListener("mouseup", () => dragging = false);

//######################################################## pan the camera when the mouse is being held down and moved
mapContainer.addEventListener("mousemove", (e) => { //when the mouse moves
  //========== ignore movement if the mouse is not also being held down ==========//
  if (!dragging) return;

  //========== how far did the mouse move from its last position? ==========//
  const dx = (e.clientX - last.x) / camera.zoom;
  const dy = (e.clientY - last.y) / camera.zoom;

  //========== move the camera the distance the mouse moved and in the opposite direction ==========//
  camera.x -= dx;
  camera.y -= dy;
  //take the current camera x/y and move up/down left/right based on change/delta

  //========== set last position of mouse to current mouse position ==========//
  last.x = e.clientX;
  last.y = e.clientY;

  //========== render the changes ==========//
  render();
});
//########################################################
//########################################################
//######################################################## Draw
//########################################################
//########################################################

//######################################################## Draws the connection between two points
function drawEdge(a, b) { //connects two given nodes visually
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

  ctx.strokeStyle = "black"; //color is black
  ctx.lineWidth = 2; //when following the path draw with a width of two
  ctx.stroke(); //follow the arc and draw
}

//######################################################## Draws a line segment t being the completion percentage (1 = done | 0 = none)
function drawAnimatedEdge(a, b, t) {
  //a = node to start at | b = node to end at | t = percentage along path
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

  // draw background image //
  if (mapImage && mapImage.complete && mapImage.naturalWidth > 0) {
    ctx.drawImage(mapImage, 0, 0);
  }

  // draw connections/edges (Base)
  nodes.forEach(node => { //for every node
    node.connections.forEach(c => {//for every connection to that node
      const target = nodes.get(c.id);//current node to connect to 

      if (node.id < target.id) { //sort by uuid to prevent drawing a connection twice
        ctx.strokeStyle = "rgb(255, 255, 255)";
        drawEdge(node, target);
      }
    });
  });

  // draw connections/edges (animated overlay)
  if (currentPath && currentPath.length > 1) { //if there is a path and it has more than one node in it
    for (let i = 0; i < animSegment; i++) { //for each segmant of the animation prior to this
      const a = nodes.get(currentPath[i]); //current node
      const b = nodes.get(currentPath[i + 1]); //next node

      ctx.strokeStyle = "rgb(158, 23, 23)"; //draw in red
      drawEdge(a, b);//draw the edge with no animation //appears like nothing changed to user
    }

    // partial segment
    if (animSegment < currentPath.length - 1) { //if this isn't the last segmant/node
      const a = nodes.get(currentPath[animSegment]); //current node
      const b = nodes.get(currentPath[animSegment + 1]);//next node

      ctx.strokeStyle = "rgb(158, 23, 23)";// draw in red
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
    if (node === pendingConnectionNode) ctx.fillStyle = "rgb(82, 214, 82)";
    else if (node === selectedStart) ctx.fillStyle = "rgb(0, 0, 255)"; //if this is selected start draw in blue
    else if (node === selectedGoal) ctx.fillStyle = "rgb(231, 209, 111)"; //if this is selected end draw in yellow
    else if (isCompleted) ctx.fillStyle = "rgb(158, 23, 23)";
    else if (isCurrent || isNext) ctx.fillStyle = "rgb(158, 23, 23)"; //if this node is in the animated path draw in red
    else ctx.fillStyle = "rgb(255, 255, 255)"; //otherwise draw in white
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

//######################################################## set mode based on button click
addNodeBtn.addEventListener("click", () => setMode("add"));
connectBtn.addEventListener("click", () => setMode("connect"));
pathBtn.addEventListener("click", () => setMode("path"));
delNodeBtn.addEventListener("click", () => setMode("delete"));

//######################################################## update mode to whatever mode is fed in
function setMode(newMode) {
  mode = (mode === newMode) ? "none" : newMode;

  if (mode === "path") {
    clearPath();
    toggleExitButton(true);
  } 
  else {
    toggleExitButton(false);
  }

  updateMode();
}

//######################################################## turns off all modes
function resetModes() {
  mode = "none";
}

//######################################################## set existance of class on button based on whether that mode is active
function updateModeUI() {
  addNodeBtn.classList.toggle("buttonActive", mode === "add");
  connectBtn.classList.toggle("buttonActive", mode === "connect");
  pathBtn.classList.toggle("buttonActive", mode === "path");
  delNodeBtn.classList.toggle("buttonActive", mode === "delete");
}

//######################################################## press the escape key to exit pathMode
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") exitPathMode();
});

//######################################################## turn off/exit pathMode
function exitPathMode() {
  resetModes()

  clearPath();

  updateCursor();
  toggleExitButton(false);
  render();
}

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

  autosave();
}

//######################################################## based on active mode add, delete, connect, etc.
canvas.addEventListener("click", (e) => {

  switch (mode) {
    case "delete": {

      const node = getClickedNode(e);
      if (node) {
        const deletedId = node.id;
        deleteNode(deletedId);

        if (selectedStart === node) selectedStart = null;
        if (selectedGoal === node) selectedGoal = null;
        if (pendingConnectionNode === node) pendingConnectionNode = null;

        if (currentPath.includes(deletedId)) clearPath();

        render();
        break;
      }

      const pos = getMouseWorldPos(e);
      const edge = getEdgeAt(pos.x, pos.y);
      if (edge) {
        //unlike deleting a node clearing the path is taken care of in deleteEdge()
        deleteEdge(edge);
        render();
        break;
      }
      break;
    }

    case "add": {
      const pos = getMouseWorldPos(e);
      createNode(generateId(), "dragonlands", pos.x, pos.y);
      render();
      break;
    }

    case "path": {
      const node = getClickedNode(e);
      if (!node) return;

      if (!selectedStart) {
        clearPath();
        selectedStart = node;
        selectedGoal = null;
      } 
      else if (!selectedGoal) {
        selectedGoal = node;
        currentPath = aStar(selectedStart.id, selectedGoal.id) || [];
        animatePath();
      } 
      else {
        clearPath();
        selectedStart = node;
        selectedGoal = null;
      }

      render();
      break;
    }

    case "connect": {
      const node = getClickedNode(e);
      if (!node) return;

      if (!pendingConnectionNode) {
        pendingConnectionNode = node;
        render();
        return;
      }

      const nodeA = pendingConnectionNode;
      const nodeB = node;

      if (nodeA !== nodeB) {
        const exists = nodeA.connections.some(c => c.id === nodeB.id);
        if (!exists) connect(nodeA.id, nodeB.id, 5);
      }

      pendingConnectionNode = null;
      render();
      break;
    }

    default: {
      const pos = getMouseWorldPos(e);

      const node = getNodeAt(pos.x, pos.y);
      if (node) {
        openNodeEditor(node);
        return;
      }

      const edge = getEdgeAt(pos.x, pos.y);
      if (edge) {
        openEdgeEditor(edge);
        return;
      }

      closeEditor();
      break;
    }
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
  canvas.style.cursor = mode === "none" ? "default" : "crosshair";
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
//######################################################## returns a connection at a given x/y coordinate
function getEdgeAt(x, y) {
  const threshold = 6; // how close you have to be

  for (let node of nodes.values()) {
    for (let c of node.connections) {
      const target = nodes.get(c.id);

      // avoid duplicate checking
      if (node.id > target.id) continue;

      const dist = pointToSegmentDistance(x, y, node.x, node.y, target.x, target.y);

      if (dist <= threshold) {
        return {
          a: node,
          b: target,
          cost: c.cost
        };
      }
    }
  }

  return null;
}
//######################################################## determines where to display node/connection editor and associated nib
function positionEditor(worldX, worldY) {
  const el = document.querySelector("#editor");

  const screen = worldToScreen(worldX, worldY);
  const padding = 10;

  const navBar = document.querySelector(".headerBar");
  const navHeight = navBar ? navBar.offsetHeight : 0;

  el.style.display = "block";
  el.style.visibility = "hidden";

  const rect = el.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  el.classList.remove("nib-top", "nib-bottom", "nib-left", "nib-right");

  let x, y;
  let nib = "nib-bottom"; // default above node

  x = screen.x - w / 2;
  y = screen.y - h - 20;

  let fitsAbove =
    y >= navHeight + padding &&
    x >= padding &&
    x + w <= window.innerWidth - padding;

  if (fitsAbove) {
    nib = "nib-bottom";
  }

  else {
    x = screen.x - w / 2;
    y = screen.y + 20;

    let fitsBelow =
      y + h <= window.innerHeight - padding &&
      x >= padding &&
      x + w <= window.innerWidth - padding;

    if (fitsBelow) {
      nib = "nib-top";
    }

    else {
      // decide side based on available space
      const spaceLeft = screen.x;
      const spaceRight = window.innerWidth - screen.x;

      if (spaceRight >= spaceLeft) {
        x = screen.x + 20;
        y = screen.y - h / 2;
        nib = "nib-left";
      } else {
        x = screen.x - w - 20;
        y = screen.y - h / 2;
        nib = "nib-right";
      }

      // clamp vertically
      y = Math.max(
        navHeight + padding,
        Math.min(window.innerHeight - h - padding, y)
      );
    }
  }

  //clamp
  x = Math.max(padding, Math.min(window.innerWidth - w - padding, x));
  y = Math.max(navHeight + padding, Math.min(window.innerHeight - h - padding, y));

  el.style.left = x + "px";
  el.style.top = y + "px";

  el.classList.add(nib);
  el.style.visibility = "visible";
}
//######################################################## opens node editor for user
function openNodeEditor(node) {
  const el = document.querySelector("#editor");
  el.innerHTML = "";

  const container = document.createElement("div");
  container.classList.add("editorElements");

  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Name:";

  const nameInput = document.createElement("input");
  nameInput.value = node.name ?? "";

  const regionLabel = document.createElement("label");
  regionLabel.textContent = "Region:";

  const regionSelect = document.createElement("select");

  // build options from regions map
  regions.forEach(region => {
    const option = document.createElement("option");
    option.value = region.id;
    option.textContent = region.name;
    regionSelect.appendChild(option);
  });

  // validate region assignment
  const validRegion =
    regions.has(node.regionId) ? node.regionId : DEFAULT_REGION_ID;

  regionSelect.value = validRegion;

  const saveIcon = document.createElement("i");
  saveIcon.classList.add("fa-solid", "fa-floppy-disk");

  const saveBtn = document.createElement("button");
  saveBtn.appendChild(saveIcon);

  saveBtn.onclick = () => {
    node.name = nameInput.value;
    node.regionId = regionSelect.value;

    render();
    autosave();
  };

  container.append(
    nameLabel,
    nameInput,
    regionLabel,
    regionSelect,
    saveBtn
  );

  el.appendChild(container);

  el.style.display = "block";
  positionEditor(node.x, node.y);
}
//######################################################## opens edge editor for user
function openEdgeEditor(edge) {
  const el = document.querySelector("#editor");
  el.innerHTML = "";

  const container = document.createElement("div");
  container.classList.add("editorElements");

  const label = document.createElement("label");
  label.textContent = "Cost:";

  const input = document.createElement("input");
  input.type = "number";
  input.value = edge.cost ?? 1;
  input.id = "edgeCost";

  const saveIcon = document.createElement("i");
  saveIcon.classList.add("fa-solid", "fa-floppy-disk");

  const saveBtn = document.createElement("button");
  saveBtn.appendChild(saveIcon);

  saveBtn.onclick = () => {
    const newCost = Number(input.value);

    if (Number.isNaN(newCost)) return;

    const ab = edge.a.connections.find(c => c.id === edge.b.id);
    const ba = edge.b.connections.find(c => c.id === edge.a.id);

    if (ab) ab.cost = newCost;
    if (ba) ba.cost = newCost;

    render();
    autosave();
  };

  container.append(label, input, saveBtn);
  el.appendChild(container);

  el.style.display = "block";

  const midX = (edge.a.x + edge.b.x) / 2;
  const midY = (edge.a.y + edge.b.y) / 2;

  positionEditor(midX, midY);
}
//######################################################## hide the node/edge editor and remove any internal content
function closeEditor() {
  const el = document.querySelector("#editor");
  el.style.display = "none";
  el.innerHTML = "";
  autosave();
}
//######################################################## determines if a clicked location is part of an edge (and which edge/connection)
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  // degenerate segment (point)
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);

  const clampedT = Math.max(0, Math.min(1, t));

  const closestX = x1 + clampedT * dx;
  const closestY = y1 + clampedT * dy;

  return Math.hypot(px - closestX, py - closestY);
}

//######################################################## resize the map area when the window is resized so things don't become morphed weirdly
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  // match internal resolution to displayed size
  canvas.width = rect.width;
  canvas.height = rect.height;

  render();
}

//######################################################## when resizing the window resize the canvas
window.addEventListener("resize", resizeCanvas);

//######################################################## deletes a connection between two points
function deleteEdge(edge) {
  const a = edge.a;
  const b = edge.b;

  // remove connection from A - B
  a.connections = a.connections.filter(c => c.id !== b.id);

  // remove connection from B - A
  b.connections = b.connections.filter(c => c.id !== a.id);

  // check if this edge exists in current path
  if (currentPath && currentPath.length > 1) {
    for (let i = 0; i < currentPath.length - 1; i++) {
      const idA = currentPath[i];
      const idB = currentPath[i + 1];

      // if path contains this exact edge (in either direction)
      if (
        (idA === a.id && idB === b.id) ||
        (idA === b.id && idB === a.id)
      ) {
        clearPath();
        break;
      }
    }
  }

  autosave();
}

//######################################################## convert data into a json friendly format
function serializeMap() {
  return {
    nodes: Array.from(nodes.values()),
    mapImage: mapImage?.src && mapImage.src.startsWith("data:image")
      ? mapImage.src
      : null,
    regions: Array.from(regions.values())
  };
}

//######################################################## open or create the database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.MAPS)) {
        db.createObjectStore(STORES.MAPS, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.QUESTS)) {
        db.createObjectStore(STORES.QUESTS, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

//######################################################## save to the database
async function saveMapToDB() {
  const db = await openDB();
  const tx = db.transaction(STORES.MAPS, "readwrite");
  const store = tx.objectStore(STORES.MAPS);

  const data = serializeMap();

  store.put({
    id: "current",
    data
  });

  return tx.complete;
}

//######################################################## load from the database
async function loadMapFromDB() {
  const db = await openDB();
  const tx = db.transaction(STORES.MAPS, "readonly");
  const store = tx.objectStore(STORES.MAPS);

  return new Promise((resolve) => {
    const req = store.get("current");

    req.onsuccess = () => resolve(req.result?.data || null);
    req.onerror = () => resolve(null);
  });
}

//######################################################## undo serialization and set nodes/connections
function hydrateMap(data) {
  if (!data) return;

  // unwrap project format if needed
  if (data.map && data.map.nodes) {
    data = data.map;
  }

  if (!Array.isArray(data.nodes)) {
    console.error("Invalid map format:", data);
    return;
  }

  nodes.clear();

  for (const n of data.nodes) {
    nodes.set(n.id, {
      id: n.id,
      name: n.name ?? "Node",
      regionId: n.regionId ?? DEFAULT_REGION_ID,
      x: Number(n.x),
      y: Number(n.y),
      connections: Array.isArray(n.connections) ? n.connections : []
    });
  }

  clearPath();

  if (data.mapImage && data.mapImage.startsWith("data:image")) {
    mapImage = new Image();
    mapImage.onload = () => render();
    mapImage.src = data.mapImage;
  } else {
    mapImage = new Image();
  }

  if (Array.isArray(data.regions)) {
    regions.clear();

    data.regions.forEach(r => {
      regions.set(r.id, {
        id: r.id,
        name: r.name ?? "Region",
        modifier: r.modifier ?? 1
      });
    });
  }

  //if the region editor is open on hydrate re-render the editor
  const panel = document.querySelector("#regionsDisplay");
  if (panel && !panel.classList.contains("hidden")) {
    openRegionMenu();
  }

  render();
}

//######################################################## UNUSED/OUTDATED/DEPRICATED
//function exportFullProject() {
//  return {
//    cards: cards,
//    map: serializeMap()
//  };
//}

//######################################################## download the map OUTDATED/DEPRICATED
//function downloadMap() {
//  const data = serializeMap();
//
//  const blob = new Blob([JSON.stringify(data, null, 2)], {
//    type: "application/json"
//  });
//
//  const url = URL.createObjectURL(blob);
//
//  const a = document.createElement("a");
//  a.href = url;
//  a.download = "quest-map.json";
//  a.click();
//
//  URL.revokeObjectURL(url);
//}

//######################################################## download the project to a json file
document.querySelector("#download").addEventListener("click", () => {
  downloadProject();
});

//######################################################## save the current map to the database
async function autosave() {
  await saveMapToDB();
}

//######################################################## toggles region menu visibility on click
document.querySelector("#regions").addEventListener("click", () => {
  const panel = document.querySelector("#regionsDisplay");
  panel.classList.toggle("hidden");

  if (!panel.classList.contains("hidden")) {
    openRegionMenu();
  }
});

//######################################################## fills the region menu with context
function openRegionMenu() {
  const panel = document.querySelector("#regionsDisplay");

  panel.classList.remove("hidden");
  panel.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = "Region Modifiers";

  panel.appendChild(title);

  regions.forEach(region => {
    const row = document.createElement("div");
    row.classList.add("regionRow");

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = region.name;
    nameInput.classList.add("regionNameInput");

    // update name on change
    nameInput.addEventListener("change", () => {
      region.name = nameInput.value.trim() || "Region";
      autosave();
    });

    const input = document.createElement("input");
    input.type = "number";
    input.value = region.modifier;
    input.min = 0.1;
    input.step = 0.1;

    input.addEventListener("change", () => {
      region.modifier = Number(input.value);
      autosave();
    });

    const del = document.createElement("button");
    del.textContent = "Delete";

    del.addEventListener("click", () => {
      regions.delete(region.id);
      row.remove();
      autosave();
    });

    row.append(nameInput, input, del);
    panel.appendChild(row);
  });

  //save
  const save = document.createElement("button");
  save.textContent = "Save Regions";

  save.addEventListener("click", async () => {
    await autosave();
    console.log("Regions saved");
  });

  panel.appendChild(save);

  //create button
  const create = document.createElement("button");
  create.textContent = "Add Region";

  create.addEventListener("click", () => {
    createRegion();
    openRegionMenu();
  });

  panel.appendChild(create);
}

//######################################################## ???
function createRegion(name = "New Region", modifier = 1) {
  const id = generateId();

  regions.set(id, {
    id,
    name,
    modifier
  });

  autosave();
  return id;
}

//########################################################
//########################################################
//######################################################## Run on start
//########################################################
//########################################################

//######################################################## render on starting page
(async function init() {
  const data = await loadMapFromDB();
  hydrateMap(data);
})();

resizeCanvas();// render on page load

setupImporter({
  inputSelector: "#upload",

  setCards: async (newCards) => {
    const db = await openDB();
    const tx = db.transaction(STORES.QUESTS, "readwrite");
    const store = tx.objectStore(STORES.QUESTS);

    await store.clear(); // clear quests

    for (const card of newCards) {
      store.put(card);
    }
  },

  hydrateMap: (mapData) => {
    hydrateMap(mapData);
    saveMapToDB();
  }
});

regions.set(DEFAULT_REGION_ID, {
  id: DEFAULT_REGION_ID,
  name: "Default",
  modifier: 1
});