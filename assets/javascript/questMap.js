const nodes = new Map(); // id - node

function createNode(id, region, x, y) {
  nodes.set(id, {//in nodes find or create node with matching id
    id, //assign an id
    region, //assign a region
    connections: [], // connections to other nodes
    x,
    y
  });
}

function connect(aId, bId, cost) {
  const a = nodes.get(aId); //point 1
  const b = nodes.get(bId); // point 2

  a.connections.push({ id: bId, cost }); //give node A a connection to node B with cost
  b.connections.push({ id: aId, cost });//give node B a connection to node A with cost
}

function getNeighbors(node) {
  return node.connections.map(c => ({ //make a map out of all connections 
  // each mapped connection is linked to its cost and node id
    node: nodes.get(c.id), //current connection node
    cost: c.cost //current connection cost
  }));
}

function getTraversalCost(fromNode, toNode, baseCost) {
  const regionFactor = regionModifiers[toNode.region] || 1; //get cost of region of node you are moving to or 1
  return baseCost * regionFactor; //multiply base cost by region difficulty/problems (maybe change to add?)
}

//based on distance on canvas between two nodes return estimate of difficulty
function heuristic(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy); //pythagorean theorem
}

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

function reconstructPath(cameFrom, current) {
  const path = [current.id]; //give goal node as start of path // goal is the active node

  while (cameFrom.has(current.id)) {//???
    current = cameFrom.get(current.id);//current node is node we cameFrom
    path.push(current.id);//add new current to end of array
  }

  return path.reverse(); //return the array but flipped/backwards
}

const regionModifiers = { //currently these are being assigned here. MAKE USER MADE LATER.
  floweringmeadow: 1,
  dragonlands: 3,
  sandyhollow: 2
};

//Temporary Scripted Creation
createNode("A", "floweringmeadow", 100, 200);
createNode("B", "dragonlands", 300, 250);
createNode("C", "dragonlands", 400, 250);
createNode("D", "dragonlands", 800, 250);
createNode("E", "dragonlands", 200, 280);

connect("A", "B", 5);
connect("A", "E", 5);
connect("B", "E", 5);
connect("B", "C", 5);
connect("C", "D", 5);

console.log(nodes.get("A"));

function drawEdge(a, b) { //connects two given nodes
  ctx.beginPath();// start path
  ctx.moveTo(a.x, a.y); //set coords
  ctx.lineTo(b.x, b.y); //from coords make line to b coords
  ctx.stroke(); //draw that line
}

function drawNode(node) { //draws the location of given node
  ctx.beginPath();
  ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
  ctx.fill();
}

function renderGraph() {//draws all nodes and connections
  ctx.clearRect(0, 0, canvas.width, canvas.height);//clear canvas

  const drawn = new Set();//a collection of values without duplicates used to contain already checked connections

  // draw edges
  nodes.forEach(node => {//for every node
    node.connections.forEach(c => {//for each connection to the current noce
      const key = [node.id, c.id].sort().join("-");//sorts the two nodes in the connection so that...
      if (drawn.has(key)) return;//...if the two have already been used together we return and don't draw that connection twice

      drawn.add(key);//add key to drawn to indicate this path is already drawn next loop

      const target = nodes.get(c.id);//target is node with matching id

      ctx.strokeStyle = "white";//draw line as white

      // highlight edges in path
      for (let i = 0; i < currentPath.length - 1; i++) {//for every item in current path
        const a = currentPath[i];//active item
        const b = currentPath[i + 1];//next item

        if (
          (node.id === a && c.id === b) || //if the id for this node is in current path and the node we connect to is in current path
          (node.id === b && c.id === a) //if the next node is in currentPath and it connects to us
        ) {
          ctx.strokeStyle = "red";//draw line as red
        }
      }

      drawEdge(node, target);//draw line
    });
  });

  // draw nodes
  nodes.forEach(node => {//for every node
    ctx.fillStyle = "white"; //make the color white

    if (currentPath.includes(node.id)) { //if the current path includes this node
      ctx.fillStyle = "red"; //make the color red instead
    }

    drawNode(node); //draw the node circle
  });
}

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

//size canvas to window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let currentPath = []; //a variable to hold the current best path to the goal
renderGraph();// render on loading the page

//run through a* with given start and end then render path
document.querySelector("#runPath").addEventListener("click", () => {
  const start = document.querySelector("#startNode").value;
  const end = document.querySelector("#endNode").value;

  const result = aStar(start, end);

  currentPath = result || [];

  renderGraph();
});