const userGrid = document.querySelector(".grid-user");
const computerGrid = document.querySelector(".grid-computer");
const displayGrid = document.querySelector(".grid-display");
const ships = document.querySelectorAll(".ship");
const destroyer = document.querySelector(".destroyer-container");
const submarine = document.querySelector(".submarine-container");
const cruiser = document.querySelector(".cruiser-container");
const battleship = document.querySelector(".battleship-container");
const carrier = document.querySelector(".carrier-container");
const startButton = document.querySelector("#start");
const rotateButton = document.querySelector("#rotate");
const randomButton = document.querySelector("#random");
const hintButton = document.querySelector("#hint");
const restartButton = document.querySelector("#restart");
const turnDisplay = document.querySelector("#whose-turn");
const infoDisplay = document.querySelector("#info");
const width = 10;
let userSquares = [];
let computerSquares = [];
let isHorizontal = true;
let isGameOver = false;
let currentPlayer = "user";
let playerNum = 0;
let ready = false;
let enemyReady = false;
let allShipsPlaced = false;
let shotFired = -1;
let moves = 0;

// Ships
const shipArray = [
  {
    name: "destroyer",
    directions: [
      [0, 1],
      [0, width],
    ],
  },
  {
    name: "submarine",
    directions: [
      [0, 1, 2],
      [0, width, width * 2],
    ],
  },
  {
    name: "cruiser",
    directions: [
      [0, 1, 2],
      [0, width, width * 2],
    ],
  },
  {
    name: "battleship",
    directions: [
      [0, 1, 2, 3],
      [0, width, width * 2, width * 3],
    ],
  },
  {
    name: "carrier",
    directions: [
      [0, 1, 2, 3, 4],
      [0, width, width * 2, width * 3, width * 4],
    ],
  },
];

const shipLength = {
  destroyer: 2,
  submarine: 3,
  cruiser: 3,
  battleship: 4,
  carrier: 5,
};

// Artificial Intelligence
const userAI = new AI();
const computerAI = new AI();

// Create Board
function createBoard(grid, squares) {
  for (let i = 0; i < width * width; i++) {
    const square = document.createElement("div");
    square.dataset.id = i;
    grid.appendChild(square);
    squares.push(square);
  }
}
createBoard(userGrid, userSquares);
createBoard(computerGrid, computerSquares);

let hintGrid = computerSquares[44];

// Select Player Mode
if (gameMode === "singlePlayer") {
  startSinglePlayer();
} else {
  startMultiPlayer();
}

// Multiplayer
function startMultiPlayer() {
  const socket = io();

  // Get your player number
  socket.on("player-number", (num) => {
    if (num === -1) {
      infoDisplay.innerHTML = "Sorry, the server is full";
    } else {
      playerNum = parseInt(num);
      if (playerNum === 1) currentPlayer = "enemy";
      console.log("playerNum", playerNum);

      // Get other player status
      socket.emit("check-players");
    }
  });

  // Another player has connected or disconnected
  socket.on("player-connection", (num) => {
    console.log(`Player number ${num} has connected or disconnected`);
    playerConnectedOrDisconnected(num);
  });

  // On enemy ready
  socket.on("enemy-ready", (num) => {
    enemyReady = true;
    playerReady(num);
    if (ready) {
      playGameMulti(socket);
    }
  });

  // Check player status
  socket.on("check-players", (players) => {
    players.forEach((p, i) => {
      if (p.connected) playerConnectedOrDisconnected(i);
      if (p.ready) {
        playerReady(i);
        if (i !== playerNum) enemyReady = true;
      }
    });
  });

  // On Timeout
  socket.on("timeout", () => {
    infoDisplay.innerHTML = "You have reached the 10 minute limit";
  });

  // Ready button click
  startButton.addEventListener("click", () => {
    if (allShipsPlaced) playGameMulti(socket);
    else infoDisplay.innerHTML = "Please place all ships.";
  });

  // Setup event listeners for firing
  computerSquares.forEach((square) => {
    square.addEventListener("click", () => {
      if (currentPlayer === "user" && ready && enemyReady) {
        shotFired = parseInt(square.dataset.id);
        socket.emit("fire", shotFired);
      }
    });
  });

  // On Fire Received
  socket.on("fire", (id) => {
    enemyGo(id);
    const square = userSquares[id];
    socket.emit("fire-reply", square.classList);
    playGameMulti(socket);
  });

  // On Fire Reply Received
  socket.on("fire-reply", (classList) => {
    revealSquare(classList);
    playGameMulti(socket);
  });

  function playerConnectedOrDisconnected(num) {
    let player = `.p${parseInt(num) + 1}`;
    document.querySelector(`${player} .connected`).classList.toggle("active");
    if (parseInt(num) === playerNum) document.querySelector(player).style.color = "green";
  }
}

// Draw the ships in random locations
function generate(ship, squares) {
  let randomDirection = Math.floor(Math.random() * ship.directions.length);
  let current = ship.directions[randomDirection];
  let direction, orientation;
  if (randomDirection === 0) {
    direction = 1;
    orientation = "horizontal";
  }
  if (randomDirection === 1) {
    direction = 10;
    orientation = "vertical";
  }
  let randomStart = Math.floor(Math.random() * (squares.length - ship.directions[randomDirection].length * direction + direction));

  const isTaken = current.some((index) => squares[randomStart + index].classList.contains("taken"));
  const isAtRightEdge = current.some((index) => (randomStart + index) % width === width - 1);
  const isAtLeftEdge = current.some((index) => (randomStart + index) % width === 0);

  if (!isTaken && !(isAtRightEdge && isAtLeftEdge)) {
    current.forEach((index, i) => {
      let directionClass = "middle";
      if (i === 0) directionClass = "start";
      if (i === current.length - 1) directionClass = "end";
      squares[randomStart + index].classList.add("taken", orientation, directionClass, ship.name);
    });
  } else generate(ship, squares);
}

// Single Player
function startSinglePlayer() {
  gameMode = "singlePlayer";

  shipArray.forEach((ship) => generate(ship, computerSquares));

  computerSquares.forEach((square) => {
    square.addEventListener("click", () => {
      if (currentPlayer === "user" && ready) {
        shotFired = parseInt(square.dataset.id);
        revealSquare(square.classList);
        playGameSingle();
      }
    });
  });

  startButton.addEventListener("click", () => {
    if (allShipsPlaced) playGameSingle();
    else infoDisplay.innerHTML = "Please place all ships.";
  });
}

// Rotate the ships
function rotate() {
  destroyer.classList.toggle("destroyer-container-vertical");
  submarine.classList.toggle("submarine-container-vertical");
  cruiser.classList.toggle("cruiser-container-vertical");
  battleship.classList.toggle("battleship-container-vertical");
  carrier.classList.toggle("carrier-container-vertical");
  isHorizontal = !isHorizontal;
}
rotateButton.addEventListener("click", rotate);

// Move around user ship
ships.forEach((ship) => ship.addEventListener("dragstart", dragStart));
userSquares.forEach((square) => square.addEventListener("dragstart", dragStart));
userSquares.forEach((square) => square.addEventListener("dragover", dragOver));
userSquares.forEach((square) => square.addEventListener("dragenter", dragEnter));
userSquares.forEach((square) => square.addEventListener("dragleave", dragLeave));
userSquares.forEach((square) => square.addEventListener("drop", dragDrop));
userSquares.forEach((square) => square.addEventListener("dragend", dragEnd));

let selectedShipNameWithIndex;
let draggedShip;
let draggedShipLength;

ships.forEach((ship) =>
  ship.addEventListener("mousedown", (e) => {
    selectedShipNameWithIndex = e.target.id;
  })
);

function dragStart() {
  draggedShip = this;
  draggedShipLength = this.children.length;
}

function dragOver(e) {
  e.preventDefault();
}

function dragEnter(e) {
  e.preventDefault();
}

function dragLeave() {}

function dragDrop() {
  let userDirection = isHorizontal ? 1 : 10;
  let shipNameWithLastId = draggedShip.lastElementChild.id;
  let shipClass = shipNameWithLastId.slice(0, -2);
  let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
  let shipLastId = lastShipIndex * userDirection + parseInt(this.dataset.id);
  const notAllowedHorizontal = [
    0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 2, 12, 22, 32, 42, 52, 62, 72, 82, 92, 3, 13, 23, 33, 43, 53, 63,
    73, 83, 93,
  ];
  const notAllowedVertical = [
    99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64,
    63, 62, 61, 60,
  ];

  let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex);
  let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex);

  selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));

  shipLastId = shipLastId - selectedShipIndex * userDirection;
  shipFirstId = shipLastId - lastShipIndex * userDirection;

  let isTaken = false;
  if (shipFirstId >= 0 && shipLastId <= 99) {
    for (let i = shipFirstId; i <= shipLastId; i += userDirection) {
      if (userSquares[i].classList.contains("taken")) {
        isTaken = true;
        break;
      }
    }
  }

  if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId) && shipLastId <= 99 && !isTaken) {
    for (let i = 0; i < draggedShipLength; i++) {
      let directionClass = "middle";
      if (i === 0) directionClass = "start";
      if (i === draggedShipLength - 1) directionClass = "end";
      userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add("taken", "horizontal", directionClass, shipClass);
    }
  } else if (!isHorizontal && !newNotAllowedVertical.includes(shipFirstId) && shipFirstId >= 0 && !isTaken) {
    for (let i = 0; i < draggedShipLength; i++) {
      let directionClass = "middle";
      if (i === 0) directionClass = "start";
      if (i === draggedShipLength - 1) directionClass = "end";
      userSquares[parseInt(this.dataset.id) - selectedShipIndex * width + width * i].classList.add("taken", "vertical", directionClass, shipClass);
    }
  } else return;

  displayGrid.removeChild(draggedShip);
  if (!displayGrid.querySelector(".ship")) {
    allShipsPlaced = true;
    rotateButton.style.display = "none";
    randomButton.style.display = "none";
    startButton.removeAttribute("hidden");
  }
}

function dragEnd() {}

// Game Logic for MultiPlayer
function playGameMulti(socket) {
  startButton.style.display = "none";
  rotateButton.style.display = "none";
  randomButton.style.display = "none";
  hintButton.removeAttribute("hidden");
  if (isGameOver) return;
  if (!ready) {
    socket.emit("player-ready");
    ready = true;
    playerReady(playerNum);
  }

  if (enemyReady) {
    if (currentPlayer === "user") {
      turnDisplay.innerHTML = "Your Turn";
      turnDisplay.style.color = "green";
    }
    if (currentPlayer === "enemy") {
      turnDisplay.innerHTML = "Enemy's Turn";
      turnDisplay.style.color = "red";
    }
  }
}

function playerReady(num) {
  let player = `.p${parseInt(num) + 1}`;
  document.querySelector(`${player} .ready`).classList.toggle("active");
}

// Game Logic for Single Player
function playGameSingle() {
  ready = true;
  startButton.style.display = "none";
  rotateButton.style.display = "none";
  randomButton.style.display = "none";
  hintButton.removeAttribute("hidden");
  if (isGameOver) return;
  if (currentPlayer === "user") {
    turnDisplay.innerHTML = "Your Turn";
    turnDisplay.style.color = "green";
  }
  if (currentPlayer === "enemy") {
    turnDisplay.innerHTML = "Computer's Turn";
    turnDisplay.style.color = "red";
    setTimeout(() => {
      enemyGo();
      playGameSingle();
    }, 500);
  }
}

let countByUser = {
  destroyer: 0,
  submarine: 0,
  cruiser: 0,
  battleship: 0,
  carrier: 0,
};

function revealSquare(classList) {
  const enemySquare = computerSquares[shotFired];
  const classArray = Object.values(classList);
  if (!enemySquare.classList.contains("boom") && !enemySquare.classList.contains("miss") && currentPlayer === "user" && !isGameOver) {
    moves++;
    Object.keys(countByUser).forEach((key) => {
      if (classArray.includes(key)) {
        countByUser[key]++;
      }
    });
    if (classArray.includes("taken")) {
      enemySquare.classList.add("boom");
    } else {
      enemySquare.classList.add("miss");
    }
    checkForWins();
    currentPlayer = "enemy";
    hintGrid.style.border = "";
    let move = userAI.algorithm(computerSquares, shotFired);
    hintGrid = computerSquares[move];
  }
}

let countByCpu = {
  destroyer: 0,
  submarine: 0,
  cruiser: 0,
  battleship: 0,
  carrier: 0,
};

function enemyGo(id) {
  if (gameMode === "singlePlayer") {
    id = computerAI.algorithm(userSquares);
  }
  if (!userSquares[id].classList.contains("boom") && !userSquares[id].classList.contains("miss")) {
    Object.keys(countByCpu).forEach((key) => {
      if (userSquares[id].classList.contains(key)) {
        countByCpu[key]++;
      }
    });
    if (userSquares[id].classList.contains("taken")) {
      userSquares[id].classList.add("boom");
    } else {
      userSquares[id].classList.add("miss");
    }
    checkForWins();
    currentPlayer = "user";
  }
}

function checkForWins() {
  let enemy = "COMPUTER";
  if (gameMode === "multiPlayer") enemy = "ENEMY";
  Object.keys(shipLength).forEach((key) => {
    if (countByUser[key] === shipLength[key]) {
      infoDisplay.innerHTML = `YOU sunk the ${enemy}'s ${key}`;
      countByUser[key] = 10;
    }
    if (countByCpu[key] === shipLength[key]) {
      infoDisplay.innerHTML = `${enemy} sunk YOUR ${key}`;
      countByCpu[key] = 10;
    }
  });

  if (Object.keys(countByUser).reduce((total, key) => total + countByUser[key], 0) === 50) {
    infoDisplay.innerHTML = `YOU WIN AFTER ${moves} MOVES`;
    gameOver();
  }
  if (Object.keys(countByCpu).reduce((total, key) => total + countByCpu[key], 0) === 50) {
    infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS AFTER ${playerNum === 1 ? ++moves : moves} MOVES`;
    gameOver();
  }
}

function gameOver() {
  isGameOver = true;
  hintButton.style.display = "none";
  restartButton.removeAttribute("hidden");
}

function userRandomGenerateShips() {
  userGrid.innerHTML = "";
  userSquares = [];
  createBoard(userGrid, userSquares);
  shipArray.forEach((ship) => generate(ship, userSquares));
  allShipsPlaced = true;
  displayGrid.style.display = "none";
  rotateButton.style.display = "none";
  randomButton.style.display = "none";
  startButton.removeAttribute("hidden");
}

randomButton.addEventListener("click", userRandomGenerateShips);

hintButton.addEventListener("click", () => {
  hintGrid.style.border = "2px solid orange";
});
