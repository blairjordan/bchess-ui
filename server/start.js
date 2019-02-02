const fs = require("fs");
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 3001;
const INDEX = path.join(__dirname, '../client/index.html');
const { Chess, Piece, Action } = require("bchess");

const server = express()
    .use((req, res) => res.sendFile(INDEX) )
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = require("socket.io")(server);

let dir = `${__dirname}/games`;
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const saveGame = (opts) => {
    const { fen, gamePath } = opts;
    fs.writeFileSync(gamePath, JSON.stringify({ fen }), "UTF-8", {'flags': 'w+'});
};

const loadGame = (opts) => {
    const { gameId, chess } = opts;
    chess.input({fen: JSON.parse(fs.readFileSync(getGamePath(gameId), 'utf8')).fen});
};

const getGamePath = gameId => `${dir}/${gameId}.json`;

console.log("server started");

io.on("connect", function(socket){
    socket.on("join", data => {
        console.log("a user joined the game");
        const chess = new Chess();
        const { gameId } = data;
        socket.join(gameId);
        if (fs.existsSync(getGamePath(gameId))){
            // load game
            loadGame({gameId, chess});
        } else {
            // new game
            saveGame({ fen: chess.fen(), gamePath: getGamePath(gameId) });
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
            saveGame({ fen, gamePath: getGamePath(gameId) });
            socket.broadcast.to(gameId).emit("move",{from, to, fen});
        }
    });
});
