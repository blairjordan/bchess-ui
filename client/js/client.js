const id = Math.floor(100000 + Math.random() * 900000);
const socket = io.connect("http://localhost:3001");

socket.on("connect", function() {
    socket.on("move", function (data) {
        const { fen } = data;
        chess.input({fen});
        board.position(fen);
    });
});