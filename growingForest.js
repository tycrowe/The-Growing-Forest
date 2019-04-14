const WIDTH = 500;
const HEIGHT = 500;

const CELL_WIDTH = 10;
const CELL_HEIGHT = 10;

let rows = 0;
let columns = 0;

let agents;
let gc;

// After-generated objects
let humans = [];
let trees = [];
let voids = [];

let step = 0;

// This function will be called once the page loads completely
function pageLoaded() {
    let container = document.getElementById("container");
    container.setAttribute("style", "width: " + WIDTH + "px; " + "height: " + HEIGHT + "px; margin: 0 auto;")
    // Note: (0,0) is in the top left corner of the canvas.
    let ca = document.getElementById("main-canvas");
    ca.setAttribute("width", WIDTH + "px");
    ca.setAttribute("height", HEIGHT + "px");

    rows = Math.floor(ca.offsetWidth / CELL_WIDTH);
    columns = Math.floor(ca.offsetHeight / CELL_HEIGHT);
    agents = new Array(rows);

    for (let i = 0; i < agents.length; i++) {
        agents[i] = new Array(columns);
    }

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            agents[i][j] = {
                "status": "empty",
                "pos": {
                    "x": i,
                    "y": j
                },
                "color": "white"
            };
        }
    }

    gc = ca.getContext('2d');
    buildRandom();
    createGrid(gc);
    updateTags();
}

function updateTags() {
    document.getElementById("total").innerText = "" + (rows * columns);
    document.getElementById("stepCount").innerText = step + "";
    document.getElementById("humanCount").innerText = humans.length + "";
    document.getElementById("treeCount").innerText = trees.length + "";
}

function createGrid() {
    let x = 0, y = 0;
    for (let i = 0; i < rows; i++) {
        gc.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
        y = 0;
        for (let j = 0; j < columns; j++) {
            if(!(agents[i][j] === undefined)) {
                gc.fillStyle = agents[i][j].color;
                setCellColorAt(x / CELL_WIDTH, y / CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
            }
            gc.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
            y += CELL_HEIGHT;
        }
        x += CELL_WIDTH;
    }
}

function buildRandom() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            let tempA = agents[i][j];
            switch (Math.floor((Math.random() * 11) + 1)) {
                case 1: // Tree
                case 2:
                case 3:
                case 4:
                case 5:
                    tempA.status = "tree";
                    tempA.color = "green";
                    trees.push(tempA);
                    break;
                case 6: // Empty
                case 7:
                case 8:
                case 9:
                    tempA.status = "empty";
                    tempA.color = "white";
                    voids.push(tempA);
                    break;
                case 10: // Water
                    tempA.status = "water";
                    tempA.color = "blue";
                    break;
                case 11: // Human
                    // humans are nasty, given them an extra challenge to being created.
                    if(Math.random() * 100 < 100) {
                        tempA.status = "human";
                        tempA.color = "purple";
                        humans.push(tempA);
                        break;
                    } else {
                        tempA.status = "empty";
                        tempA.color = "white";
                        voids.push(tempA);
                        break;
                    }
            }
        }
    }
}

/**
 * Rules:
 *  1. If a human is next to a tree, cut-down the tree and move to empty cell.
 *  2. If a human is next to another human, add another human.
 *  3. If a tree is next to water, spawn another tree but remove water.
 *  4. If it rains, add water to any empty square.
 */
function simulate(n) {
    for (let i = 0; i < n; i++) {
        // Check rule 1.
        trees.forEach(function (tree) {
            let neighbors = getNeighbors(tree.pos.x, tree.pos.y);
            for (let i = 0; i < 8; i++) {
                if(!(neighbors[i] === undefined)) {
                    if(neighbors[i].status === "water") {
                        setCellType(neighbors[i].pos.x, neighbors[i].pos.y, "tree");
                        break;
                    }
                }
            }
        });
        if(Math.random() < .5) {
            // Rain!
            voids.forEach(function (empty) {
                if(Math.random() < .95) {
                    setCellType(empty.pos.x, empty.pos.y, "water");
                }
            });
        }
        humans.forEach(function (human) {
            let neighbors = getNeighbors(human.pos.x, human.pos.y);
            let found = false;
            for (let i = 0; i < 8; i++) {
                if(!(neighbors[i] === undefined)) {
                    if(neighbors[i].status === "tree") {
                        found = true;
                        setCellType(neighbors[i].pos.x, neighbors[i].pos.y, "empty");
                        break;
                    }
                }
            }
            if(found) {
                // Move to an empty cell and check for reproduction.
                let choice = voids[Math.floor(Math.random() * voids.length)];
                setCellType(human.pos.x, human.pos.y, "empty");
                setCellType(choice.pos.x, choice.pos.y, "human");
                let neighbors = getNeighbors(choice.pos.x, choice.pos.y);
                for (let i = 0; i < 8; i++) {
                    if(!(neighbors[i] === undefined)) {
                        if(neighbors[i].status === "human" && (Math.random() * 100) < 95) {
                            setCellType(neighbors[i].pos.x, neighbors[i].pos.y, "human");
                            break;
                        }
                    }
                }
            } else {
                setCellType(human.pos.x, human.pos.y, "empty");
            }
        });
        step++;
        updateTags();
        createGrid();
    }
}

function getNeighbors(x, y) {
    let neighbors = new Array(8);
    x *= CELL_WIDTH;
    y *= CELL_HEIGHT;
    let x1 = 0, y1 = 0;
    for (let i = 0; i < rows; i++) {
        y1 = 0;
        for (let j = 0; j < columns; j++) {
            // North neighbor, x = and y = (
            if(x1 === x && y1 === (y - CELL_HEIGHT)) { // North cell
                neighbors[0] = agents[i][j];
            }
            if(x1 === x && y1 === (y + CELL_HEIGHT)) { // South cell
                neighbors[1] = agents[i][j];
            }
            if(x1 === (x - CELL_WIDTH) && y1 === y) { // West Cell
                neighbors[2] = agents[i][j];
            }
            if(x1 === (x + CELL_WIDTH) && y1 === y) { // East Cell
                neighbors[3] = agents[i][j];
            }
            if(x1 === (x + CELL_WIDTH) && y1 === (y + CELL_HEIGHT)) { // SE Cell
                neighbors[4] = agents[i][j];
            }
            if(x1 === (x - CELL_WIDTH) && y1 === (y - CELL_HEIGHT)) { // NW Cell
                neighbors[5] = agents[i][j];
            }
            if(x1 === (x + CELL_WIDTH) && y1 === (y - CELL_HEIGHT)) { // NE Cell
                neighbors[6] = agents[i][j];
            }
            if(x1 === (x - CELL_WIDTH) && y1 === (y + CELL_HEIGHT)) { // SW Cell
                neighbors[7] = agents[i][j];
            }
            y1 += CELL_HEIGHT;
        }
        x1 += CELL_WIDTH;
    }
    return neighbors;
}

function setCellType(x, y, type) {
    type = type.toLowerCase();
    let tempA = agents[x][y];
    if(tempA === undefined)
        return null;
    else if(tempA.status === "empty") {
        // remove from voids array
        voids.splice(voids.indexOf(tempA), 1);
    } else if(tempA.status === "human") {
        // remove from voids array
        humans.splice(humans.indexOf(tempA), 1);
    } else if(tempA.status === "tree") {
        // remove from voids array
        trees.splice(trees.indexOf(tempA), 1);
    }
    switch (type) {
        case "tree":
            tempA.status = "tree";
            tempA.color = "green";
            trees.push(tempA);
            break;
        case "human":
            tempA.status = "human";
            tempA.color = "purple";
            humans.push(tempA);
            break;
        case "water":
            tempA.status = "water";
            tempA.color = "blue";
            break;
        case "empty":
            tempA.status = "empty";
            tempA.color = "white";
            voids.push(tempA);
            break;
        default:
            setCellType(x, y, "empty");
            break;
    }
}

function setCellColorAt(x, y, color) {
    gc.fillStyle = color;
    gc.fillRect(x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
}