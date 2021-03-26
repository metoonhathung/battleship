function AI() {
  let squares = [];
  let ships = [...shipArray];
  let lastMove = -1;
  let stack = [];
  let count = {
    destroyer: 0,
    submarine: 0,
    cruiser: 0,
    battleship: 0,
    carrier: 0,
  };
  let minimumParity = 5;
  let probability = [];
  let lastSunkShips = [];
  let continuousHits = [];

  this.algorithm = (originalSquares, actual) => {
    return advanced(originalSquares, actual);
  };

  function naive(originalSquares, actual) {
    if (actual) {
      stack = stack.filter((value) => value !== actual);
      lastMove = actual;
    } else {
      if (stack.length > 0) lastMove = stack.pop();
    }
    squares = originalSquares;
    lastMove = target() || hunt();
    return lastMove;
  }

  function hunt() {
    let move = Math.floor(Math.random() * (width * width));
    while (squares[move].classList.contains("boom") || squares[move].classList.contains("miss")) {
      move = Math.floor(Math.random() * (width * width));
    }
    return move;
  }

  function target() {
    if (squares[lastMove]?.classList.contains("boom")) {
      if (Math.floor(lastMove / width) !== 0) pushStack(lastMove - 10); // up
      if (lastMove % width !== 0) pushStack(lastMove - 1); // left
      if (Math.floor(lastMove / width) !== width - 1) pushStack(lastMove + 10); // down
      if (lastMove % width !== width - 1) pushStack(lastMove + 1); // right
    }
    return stack[stack.length - 1]; //dfs
  }

  function pushStack(num) {
    if (!(squares[num].classList.contains("boom") || squares[num].classList.contains("miss"))) {
      stack.push(num);
    }
  }

  function advanced(originalSquares, actual) {
    if (actual) {
      lastMove = actual;
    }
    squares = originalSquares;
    updateShips();
    if (squares[lastMove]?.classList.contains("boom")) {
      continuousHits.push(lastMove);
    }
    if (lastSunkShips.length > 0) {
      updateContinuousHits();
    }
    lastMove = prob();
    return lastMove;
  }

  function prob() {
    probability = new Array(width * width).fill(0);
    for (let ship of ships) {
      for (let direction of ship.directions) {
        for (let start = 0; start < probability.length; start++) {
          let isOutside = direction.some((index) => start + index > 99 || start + index < 0);
          if (!isOutside) {
            let isBoom = direction.some((index) => squares[start + index].classList.contains("boom") && !continuousHits.includes(start + index));
            let isMiss = direction.some((index) => squares[start + index].classList.contains("miss"));
            let isAtRightEdge = direction.some((index) => (start + index) % width === width - 1);
            let isAtLeftEdge = direction.some((index) => (start + index) % width === 0);
            if (!(isBoom || isMiss) && !(isAtLeftEdge && isAtRightEdge)) {
              let weight = 1;
              for (let hit of continuousHits) {
                if (direction.some((index) => start + index === hit)) {
                  weight += 100;
                }
              }
              for (let index of direction) {
                probability[start + index] += weight;
              }
            }
          }
        }
      }
    }
    let max = -1;
    let optimums = [-1];
    for (let i = 0; i < probability.length; i++) {
      squares[i].innerHTML = `<span class="debug">[${i}] ${probability[i]}</span>`;
      if (probability[i] === max && !continuousHits.includes(i)) {
        optimums.push(i);
      }
      if (probability[i] > max && !continuousHits.includes(i)) {
        optimums = [i];
        max = probability[i];
      }
    }
    for (let optimum of optimums) {
      if (canParitySkip(optimum)) {
        return optimum;
      }
    }
    return optimums[0];
  }

  function canParitySkip(optimum) {
    let ranges = [];
    for (let i = 1; i < minimumParity; i++) {
      let up = optimum + -10 * i;
      if (Math.floor(up / width) < 0 || up < 0 || up > 99) break;
      ranges.push(up);
    }
    for (let i = 1; i < minimumParity; i++) {
      let down = optimum + 10 * i;
      if (Math.floor(down / width) > width - 1 || down < 0 || down > 99) break;
      ranges.push(down);
    }
    for (let i = 1; i < minimumParity; i++) {
      let left = optimum + -1 * i;
      if (left % width === width - 1 || left < 0 || left > 99) break;
      ranges.push(left);
    }
    for (let i = 1; i < minimumParity; i++) {
      let right = optimum + 1 * i;
      if (right % width === 0 || right < 0 || right > 99) break;
      ranges.push(right);
    }
    return ranges.every((range) => {
      if (squares[range].classList.contains("boom") && !continuousHits.includes(range)) {
        return false;
      }
      if (squares[range].classList.contains("miss")) {
        return false;
      }
      return true;
    });
  }

  function updateContinuousHits() {
    let lastSunkHits = lastSunkShips.reduce((total, ship) => total + shipLength[ship], 0);
    if (continuousHits.length === lastSunkHits) {
      continuousHits = [];
      lastSunkShips = [];
    }
  }

  function updateShips() {
    if (squares === userSquares) {
      count = { ...countByCpu };
    } else if (squares === computerSquares) {
      count = { ...countByUser };
    }
    Object.keys(count).forEach((key) => {
      if (count[key] === 10 && ships.some((ship) => ship.name === key)) {
        lastSunkShips.push(key);
        ships = ships.filter((ship) => ship.name !== key);
      }
    });
    minimumParity = 5;
    Object.keys(shipLength).forEach((key) => {
      if (count[key] !== 10) {
        minimumParity = Math.min(minimumParity, shipLength[key]);
      }
    });
  }
}
