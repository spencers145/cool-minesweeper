window.onload = () => {
    // so that right clicking works
    document.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener(`mouseup`, () => {
        const TILE = Minesweeper.board.getTileByObject($(`button.faking`));
        if (TILE) TILE.fakePressEnd();
    });

    Minesweeper.wipeGame();
    Minesweeper.newGame(40, 25, 100);
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
    TILE.clicked = (neighborMines) => {
        if (TILE.hasClass(`flagged`)) return;

        TILE.addClass(`revealed`);
        if (TILE.mine) {
            TILE.addClass(`mine`);
            TILE.css("background-position", `-96px -1792px`);
            return TILE.mine;
        }

        TILE.css("background-position", `0 ${neighborMines * 32 - 1792}px`);
    }
    TILE.flagged = () => {
        if (TILE.hasClass(`revealed`)) return;
        if (TILE.hasClass(`flagged`)) {
            TILE.removeClass(`flagged`);
            TILE.css("background-position", `-32px -1792px`);
        } else {
            TILE.addClass(`flagged`);
            TILE.css("background-position", `-32px -1760px`);
        }
    }
    TILE.fakePressStart = () => {
        if (TILE.hasClass(`revealed`) || TILE.hasClass(`flagged`)) return;
        TILE.addClass(`faking`);
        TILE.css("background-position", "0 -1792px");
    }
    TILE.fakePressFakeEnd = () => {
        if (TILE.hasClass(`revealed`) || TILE.hasClass(`flagged`)) return;
        TILE.css("background-position", "-32px -1792px");
    }
    TILE.fakePressEnd = () => {
        if (TILE.hasClass(`revealed`) || TILE.hasClass(`flagged`)) return;
        TILE.removeClass(`faking`);
        TILE.css("background-position", "-32px -1792px");
    }
    TILE.on("click", Minesweeper.handleClick);
    TILE.on("mousedown", Minesweeper.handleMouseDown);
    TILE.on("mouseleave", Minesweeper.handleMouseLeave);
    TILE.on("mouseenter", Minesweeper.handleMouseEnter);

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
                const HAS_MINE = MINE_ARRAY.includes(sizeX * y + x);
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
        let tile = this.tiles[y];
        tile = tile ? tile[x] : undefined;
        //throw new Error("tried to find a tile but there's no tile at this position: " + x + " " + y);
        return tile;
    }

    getTileByObject(tile) {
        const TILE = this.getTileAt(tile.attr("x"), tile.attr("y"));
        return TILE;
    }

    sweepAtTile(tile) {
        const NEIGHBOR_MINES = Minesweeper.board.countNeighboringMines(tile);
        let mine = tile.clicked(NEIGHBOR_MINES);
        if (mine) return mine;

        if (NEIGHBOR_MINES === 0) {
            this.continueSweep(tile);
        }
    }

    continueSweep(tile) {
        const TILES = Minesweeper.board.getNeighbors(tile);
        while (TILES.length > 0) {
            const NEIGHBOR = TILES.pop();
            if (NEIGHBOR.hasClass("revealed")) continue;
            if (NEIGHBOR.mine) continue;

            const NEIGHBOR_MINES = Minesweeper.board.countNeighboringMines(NEIGHBOR);
            NEIGHBOR.clicked(NEIGHBOR_MINES);

            if (!NEIGHBOR_MINES) this.continueSweep(NEIGHBOR);
        }
    }
    
    getNeighbors(tile) {
        const X = Number(tile.attr("x"));
        const Y = Number(tile.attr("y"));

        let tiles = [];
        tiles.push(this.getTileAt(X + 1, Y + 1));
        tiles.push(this.getTileAt(X, Y + 1));
        tiles.push(this.getTileAt(X - 1, Y + 1));
        tiles.push(this.getTileAt(X + 1, Y));
        tiles.push(this.getTileAt(X - 1, Y));
        tiles.push(this.getTileAt(X + 1, Y - 1));
        tiles.push(this.getTileAt(X, Y - 1));
        tiles.push(this.getTileAt(X - 1, Y - 1));

        return tiles.filter((neighbor) => { return neighbor });
    }

    countNeighboringMines(tile) {
        const NEIGHBORS = this.getNeighbors(tile);
        return this.countMinesInTileList(NEIGHBORS);
    }

    countMinesInTileList(tiles) {
        let mines = 0;
        $.each(tiles, (_index, tile) => {
            if (tile.mine) mines += 1;
        });
        return mines;
    }
}

Minesweeper = {
    wipeGame() {
        Minesweeper.board = new Board();
    },

    newGame(sizeX, sizeY, mineCount) {
        Minesweeper.board.generateTiles(sizeX, sizeY, mineCount);
    },

    handleClick(event) {
        const TILE = Minesweeper.board.getTileByObject($(event.target));
        Minesweeper.sweep(TILE);
    },

    handleMouseDown(event) {
        const TILE = Minesweeper.board.getTileByObject($(event.target));
        if (event.which === 3) {
            Minesweeper.flag(TILE);
        } else if (event.which === 1) {
            TILE.fakePressStart();
        }
    },

    handleMouseLeave(event) {
        const TILE = Minesweeper.board.getTileByObject($(event.target));
        if (TILE.hasClass(`faking`)) {
            TILE.fakePressFakeEnd();
        }
    },

    handleMouseEnter(event) {
        const TILE = Minesweeper.board.getTileByObject($(event.target));
        if (TILE.hasClass(`faking`)) {
            TILE.fakePressStart();
        }
    },

    sweep(tile) {
        const MINE = Minesweeper.board.sweepAtTile(tile);
        if (MINE) {
            Minesweeper.hitMine(MINE);
        }
    },

    flag(tile) {
        tile.flagged();
    },

    hitMine(mine) {
        if (!mine) throw new Error("tried to hit mine but there was no mine to hit");

        Minesweeper.gameOver();
    },

    gameOver() {
    }
};

