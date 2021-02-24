function ArtificialIntelligence() {
    let squares = [];
    let lastMove = 0;
    let stack = [];
    let probability = [];
    let display = -1;
    let destroyer = 0;
    let submarine = 0;
    let cruiser = 0;
    let battleship = 0;
    let carrier = 0;
    let ships = JSON.parse(JSON.stringify(shipArray));

    this.algorithm = (grid, actual) => {
        if (actual) {
            stack = stack.filter(value => value !== actual);
            lastMove = actual;
        } else {
            if (stack.length > 0) lastMove = stack.pop();
        }
        squares = grid;
        config();
        updateShips();
        if (squares[lastMove]?.classList.contains('boom')) {
            if (Math.floor(lastMove / width) !== 0) pushStack(lastMove - 10); // up
            if (lastMove % width !== 0) pushStack(lastMove - 1); // left
            if (Math.floor(lastMove / width) !== width - 1) pushStack(lastMove + 10); // down
            if (lastMove % width !== width - 1) pushStack(lastMove + 1); // right
        }
        if (stack.length > 0) lastMove = stack[stack.length - 1]; //dfs
        else lastMove = hunt();
        return lastMove;
    };

    function hunt() {
        probability = new Array(width * width).fill(0);
        for (let ship of ships) {
            for (let current of ship.directions) {
                for (let start = 0; start < probability.length; start++) {
                    let isOutside = current.some(index => (start + index) > 99 || (start + index) < 0);
                    if (!isOutside) {
                        let isBoom = current.some(index => squares[start + index].classList.contains('boom'));
                        let isMiss = current.some(index => squares[start + index].classList.contains('miss'));
                        let isAtRightEdge = current.some(index => (start + index) % width === width - 1);
                        let isAtLeftEdge = current.some(index => (start + index) % width === 0);
                        if (!(isBoom || isMiss) && !(isAtLeftEdge && isAtRightEdge)) {
                            for (let index of current) {
                                probability[start + index]++;
                            }
                        }
                    }
                }
            }
        }
        let max = -1;
        let optimal = -1;
        for (let i = 0; i < probability.length; i++) {
            document.querySelectorAll(`[data-id = "${i}"]`)[display].innerHTML = `<span>[${i}] ${probability[i]}</span>`;
            if (probability[i] > max) {
                optimal = i;
                max = probability[i];
            }
        }
        return optimal;
    }

    function pushStack(num) {
        if (!(squares[num].classList.contains('boom') || squares[num].classList.contains('miss'))) {
            stack.push(num);
        }
    }

    function updateShips() {
        if (destroyer >= 2) ships = ships.filter(ship => ship.name !== 'destroyer');
        if (submarine >= 3) ships = ships.filter(ship => ship.name !== 'submarine'); 
        if (cruiser >= 3) ships = ships.filter(ship => ship.name !== 'cruiser');
        if (battleship >= 4) ships = ships.filter(ship => ship.name !== 'battleship');
        if (carrier >= 5) ships = ships.filter(ship => ship.name !== 'carrier');
    }

    function config() {
        if (squares === userSquares) { // Computer
            display = 0;
            destroyer = cpuDestroyerCount;
            submarine = cpuSubmarineCount;
            cruiser = cpuCruiserCount;
            battleship = cpuBattleshipCount;
            carrier = cpuCarrierCount;
        } else if (squares === computerSquares) { // User
            display = 1;
            destroyer = destroyerCount;
            submarine = submarineCount;
            cruiser = cruiserCount;
            battleship = battleshipCount;
            carrier = carrierCount;
        }
    }
}
