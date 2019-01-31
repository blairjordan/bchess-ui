const io = require("socket.io")(3001);
const { Chess, Piece, Action } = require("bchess");
const chess = new Chess();

io.on("connect", function(socket){
    console.log("a user connected");
    socket.on("move", function(data){
        const {id, move} = data;
        const {from, to} = move;
        socket.broadcast.emit("move",{id, move: {from, to}});
    });
});