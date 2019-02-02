const fs = require("fs");
const io = require("socket.io")(process.env.PORT || 3001);
const { Chess, Piece, Action } = require("bchess");

let dir = `${__dirname}/games`;
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const saveGame = (opts) => {
    const { fen, path } = opts;
    fs.writeFileSync(path, JSON.stringify({ fen }), "UTF-8", {'flags': 'w+'});
};

const loadGame = (opts) => {
    const { gameId, chess } = opts;
    chess.input({fen: JSON.parse(fs.readFileSync(path(gameId), 'utf8')).fen});
};

const path = gameId => `${dir}/${gameId}.json`;

console.log("server started");

io.on("connect", function(socket){
    socket.on("join", data => {
        console.log("a user joined the game");
        const chess = new Chess();
        const { gameId } = data;
        socket.join(gameId);
        if (fs.existsSync(path(gameId))){
            // load game
            loadGame({gameId, chess});
        } else {
            // new game
            saveGame({ fen: chess.fen(), path: path(gameId) });
        }
        socket.emit("move", {fen: chess.fen()});
    });

    socket.on("move", function(data){
        const {move, gameId} = data;
        const {from, to} = move;
        const chess = new Chess();
        loadGame({gameId, chess});
        console.log(data);
        const action = chess.move({from, to});
        if (action !== Action.INVALID_ACTION) {
            const fen = chess.fen();
            saveGame({ fen, path: path(gameId) });
            socket.broadcast.to(gameId).emit("move",{from, to, fen});
        }
    });
});
