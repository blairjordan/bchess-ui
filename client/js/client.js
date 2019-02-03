$("#start").on("click", () => {
    $("#setup").hide();
    $("#game").show();
    $("#game-id").html($("#game-id-input").val());
    init($("#game-id-input").val(), $("#color").val());
});

const init = (gameId, color) => {
    const socket = io.connect(location.origin);

    const chess = new Chess({color});

    const myTurn = () => {
        return chess.turn() === color;
    };

    const onDrop = function(from, to) {

        // my turn?
        if (!myTurn()) return "snapback";
        
        // moving my piece?
        if (chess.get({square: from}).piece.color !== chess.myColor) return "snapback";

        // attempt to make move
        const move = chess.move({from,to,promotion: "Q"}); // NOTE: always promote to a queen for example simplicity

        // illegal move?
        if (move === Action.INVALID_ACTION) return "snapback";
        
        socket.emit("move", {gameId, move: {from, to}, color: chess.myColor});

        updateUI();
    };

    // update the board position after the piece snap 
    // for castling, en passant, pawn promotion
    const onSnapEnd = function() {
        board.position(chess.fen({turn:true}));
    };

    const updateUI = (from, to) => {
        $("#fen").html(chess.fen({turn:true}));
        $("#turn").html(`${myTurn() ? "Your turn" : "Waiting for opponent"} to move.`);
    }

    var cfg = {
        draggable: true,
        position: "start",
        onDrop,
        onSnapEnd,
        orientation: chess.myColor
    };

    const board = ChessBoard("board", cfg);
    
    socket.on("connect", function() {
        socket.emit("join", { gameId });
        socket.on("move", function (data) {
            const { fen } = data;
            chess.input({fen});
            board.position(fen);
            updateUI();
        });
    });
};
