$("#start").on("click", () => {
    $("#setup").hide();
    $("#game").show();
    init($("#game-id").val(), $("#color").val());
});

const init = (gameId, color) => {
    const socket = io.connect(location.origin);

    const chess = new Chess({color});
    const onDrop = function(from, to) {

        // my turn?
        //if (!playerTurn) return 'snapback';
        
        // moving my piece?
        if (chess.get({square: from}).piece.color !== chess.myColor) return 'snapback';

        // attempt to make move
        const move = chess.move({from,to,promotion: 'Q'}); // NOTE: always promote to a queen for example simplicity

        // illegal move?
        if (move === Action.INVALID_ACTION) return 'snapback';
        
        socket.emit("move", {gameId, move: {from, to}, color: chess.myColor});
        
        console.log(chess.fen());

        updateUI();
    };

    // update the board position after the piece snap 
    // for castling, en passant, pawn promotion
    const onSnapEnd = function() {
        board.position(chess.fen());
    };

    const updateUI = (from, to) => {
        $('#fen').html(chess.fen());
        //$('#turn').html(`${(playerTurn) ? 'Your turn' : "Waiting for opponent"} to move.`);
    }

    var cfg = {
        draggable: true,
        position: 'start',
        onDrop,
        onSnapEnd,
        orientation: chess.myColor
    };

    const board = ChessBoard('board', cfg);
    
    socket.on("connect", function() {
        socket.emit("join", { gameId });
        socket.on("move", function (data) {
            console.log("got move");
            const { fen } = data;
            chess.input({fen});
            board.position(fen);
            updateUI();
        });
    });
};
