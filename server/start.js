const fs = require("fs");
const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 3001;
const INDEX = path.join(__dirname, "../client/index.html");
const { Chess, Action } = require("bchess");

const server = express()
    .use(express.static(path.join(__dirname, "../client")))
    .use((req, res) => res.sendFile(INDEX) )
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = require("socket.io")(server);

let dir = `${__dirname}/games`;
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const saveGame = (opts) => {
    const { fen, gamePath } = opts;
    fs.writeFileSync(gamePath, JSON.stringify({ fen }), "UTF-8", {"flags": "w+"});
};

const loadGame = (opts) => {
    const { gameId, chess } = opts;
    chess.input({fen: JSON.parse(fs.readFileSync(getGamePath(gameId), "utf8")).fen});
};

const getGamePath = gameId => `${dir}/${gameId}.json`;

console.log("Server started");

io.on("connect", function(socket){
    socket.on("join", data => {
        const chess = new Chess();
        const { gameId } = data;
        socket.join(gameId);
        console.log(`A user joined game ${gameId}`);
        if (fs.existsSync(getGamePath(gameId))){
            // load game
            loadGame({gameId, chess});
        } else {
            // new game
            saveGame({ fen: chess.fen({turn:true}), gamePath: getGamePath(gameId) });
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
            const fen = chess.fen({turn:true});
            saveGame({ fen, gamePath: getGamePath(gameId) });
            socket.broadcast.to(gameId).emit("move",{from, to, fen});
        }
    });
});
