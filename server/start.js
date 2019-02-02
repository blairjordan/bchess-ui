const fs = require("fs");
const io = require("socket.io")(3001);
const { Chess, Piece, Action } = require("bchess");

let dir = `${__dirname}/games`;
if (!fs.existsSync(dir)){
  fs.mkdirSync(dir);
}

const saveGame = (opts) => {
    const { fen, path } = opts;
    fs.writeFileSync(path, JSON.stringify({ fen }), "UTF-8", {'flags': 'w+'});
};

const path = gameId => `${dir}/${gameId}.json`;

io.on("connect", function(socket){
    console.log("a user connected");
    const chess = new Chess();

    socket.on("join", data => {
        const { gameId } = data;
        socket.join(gameId);
        if (fs.existsSync(path(gameId))){
            // load game
            chess.input({fen: JSON.parse(fs.readFileSync(path(gameId), 'utf8')).fen});
        } else {
            // new game
            saveGame({ fen: chess.fen(), path: path(gameId) });
        }
        socket.emit("move", {fen: chess.fen(), turn: chess.turn()});
    });

    socket.on("move", function(data){
        const {move, color, gameId} = data;
        const {from, to} = move;
        if (color === chess.turn()) {
            const action = chess.move({from, to});
            if (action !== Action.INVALID_ACTION) {
                const fen = chess.fen();
                socket.broadcast.to(gameId).emit("move",{from, to, fen, turn: chess.turn()});
                saveGame({ fen, path: path(gameId) });
            }
        }
    });
});
