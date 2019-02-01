const io = require("socket.io")(3001);
const { Chess, Piece, Action } = require("bchess");
const chess = new Chess();

io.on("connect", function(socket){
    console.log("a user connected");
    socket.emit("move", {fen: chess.fen(), turn: chess.turn()});
    socket.on("move", function(data){
        const {id, move, color} = data;
        const {from, to} = move;
        if (color === chess.turn()) {
            const action = chess.move({from, to});

            if (action !== Action.INVALID_ACTION)
                socket.broadcast.emit("move",{id, from, to, fen: chess.fen(), turn: chess.turn()});
        }
    });
});