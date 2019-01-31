const io = require("socket.io")(3001);
const { Chess, Piece, Action } = require("bchess");
const chess = new Chess();

io.on("connect", function(socket){
    console.log("a user connected");
    socket.on("move", function(data){
        console.log(data);
        const {id, move} = data;
        const {from, to} = move;
        const action = chess.move({from, to}); // read response .. if valid etc.
        socket.broadcast.emit("move",{id, from, to, fen: chess.fen()});
    });
});