window.onload = () => {
    Minesweeper.wipeGame();
    Minesweeper.newGame(10, 10, 15);
};

class Mine {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function newTile(x, y, hasMine) {
    const TILE = $(`<button>`).addClass(`tile`);

    TILE.attr("x", x);
    TILE.attr("y", y);
    TILE.mine = hasMine ? new Mine(x, y) : undefined;
    TILE.clicked = () => {
        TILE.addClass(`revealed`);
        if (TILE.mine) return TILE.mine;
    }
    TILE.on("click", Minesweeper.sweep);

    return TILE;
}

class Board {
    constructor() {
        this.tiles = [];
    }

    generateTiles(sizeX, sizeY, mineCount) {
        let x = 0;
        let y = 0;
        const TILE_COUNT = sizeX * sizeY;

        if (this.tiles.length) throw new Error("tiles already generated");
        if (TILE_COUNT <= 0) throw new Error("tried to generate size 0 board");
        if (mineCount > TILE_COUNT) throw new Error("tried to generate board with more mines than tiles");

        const MINE_ARRAY = this.generateMineIndices(sizeX, sizeY, mineCount);

        for (y; y < sizeY; y++) {
            const TABLE_ROW = $("<tr>").addClass("board-row");
            const ARRAY_ROW = [];
            x = 0;
            for (x; x < sizeX; x++) {
                const HAS_MINE = MINE_ARRAY.includes(10 * y + x);
                const TILE = newTile(x, y, HAS_MINE);

                TABLE_ROW.append(TILE);
                ARRAY_ROW.push(TILE);
            }
            $("#board").append(TABLE_ROW);
            this.tiles.push(ARRAY_ROW);
        }
    }

    generateMineIndices(sizeX, sizeY, mineCount) {
        let indices = [];
        for (let i = 0; i < sizeX * sizeY - 1; i++) {
            indices.push(i);
        }

        const MINE_ARRAY = [];
        while (MINE_ARRAY.length < mineCount - 1) {
            const RANDOM = Math.floor(Math.random() * indices.length);
            MINE_ARRAY.push(indices[RANDOM]);
            indices.splice(RANDOM, 1);
        }
        return MINE_ARRAY;
    }

    getTileAt(x, y) {
        const TILE = this.tiles[y][x];
        //throw new Error("tried to find a tile but there's no tile at this position: " + x + " " + y);
        return TILE;
    }

    sweepAtPosition(tile) {
        tile = this.getTileAt(tile.attr("x"),tile.attr("y"));
        let mine = tile.clicked();
        return mine;
    }
}

Minesweeper = {
    wipeGame() {
        Minesweeper.board = new Board();
    },

    newGame(sizeX, sizeY, mineCount) {
        Minesweeper.board.generateTiles(sizeX, sizeY, mineCount);
    },

    sweep(event) {
        const TILE = $(event.target);
        const MINE = Minesweeper.board.sweepAtPosition(TILE);
        if (MINE) {
            Minesweeper.hitMine(MINE);
        }
    },

    hitMine(mine) {
        if (!mine) throw new Error("tried to hit mine but there was no mine to hit");

        Minesweeper.gameOver();
    },

    gameOver() {
        alert("you suck");
    }
};

