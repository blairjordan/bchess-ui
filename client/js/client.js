$("#start").on("click", () => {
    $("#setup").hide();
    $("#game").show();
    init($("#game-id").val(), $("#color").val());
});

const init = (gameId, color) => {
    const socket = io.connect("http://localhost:3001");

    let playerTurn = false;
    const chess = new Chess({color});
    const onDrop = function(from, to) {

        // my turn?
        if (!playerTurn) return 'snapback';
        
        // moving my piece?
        if (chess.get({square: from}).piece.color !== chess.myColor) return 'snapback';

        // attempt to make move
        const move = chess.move({from,to,promotion: 'Q'}); // NOTE: always promote to a queen for example simplicity

        // illegal move?
        if (move === Action.INVALID_ACTION) return 'snapback';
        
        console.log(gameId);
        socket.emit("move", {gameId, move: {from, to}, color: chess.myColor});
        playerTurn = false;

        updateUI();
    };

    const updateUI = (from, to) => {
        $('#fen').html(chess.fen());
        $('#turn').html(`${(playerTurn) ? 'Your turn' : "Waiting for opponent"} to move.`);
    }

    var cfg = {
        draggable: true,
        position: 'start',
        onDrop: onDrop,
        orientation: chess.myColor
    };

    const board = ChessBoard('board', cfg);
    
    socket.on("connect", function() {
        socket.emit("join", { gameId });
        socket.on("move", function (data) {
            console.log("got move");
            
            const { fen, turn } = data;
            playerTurn = (turn === chess.myColor);
            chess.input({fen});
            board.position(fen);
            updateUI();
        });
    });
};
