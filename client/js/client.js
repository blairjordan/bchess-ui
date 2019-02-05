const gameTypeElem = $("#gametype");

$("#start").on("click", () => {
    $("#setup").hide();
    $("#game").show();
    $("#game-id").html($("#game-id-input").val());
    init({gameType: gameTypeElem.val(), gameId: $("#game-id-input").val(), color: $("#color").val()});
});

gameTypeElem.on("change", function (e) {
    const gameType = $("option:selected", this).val();
    if (gameType === "network") {
        $("#gametype-network").show();
    } else {
        $("#gametype-network").hide();
    }
});

const init = (opts = {}) => {
    const { gameType, gameId, color } = opts;
    const socket = (gameType === "network") ? io.connect(location.origin) : null;
    const chess = new Chess({color});

    const myTurn = () => {
        return chess.turn() === color;
    };

    const onDrop = function(from, to) {
        setSquare({isHighlighted: false});
        if (gameType === "network") {
            // my turn?
            if (!myTurn()) return "snapback";
            
            // moving my piece?
            if (chess.get({square: from}).piece.color !== chess.myColor) return "snapback";
        }

        // attempt to make move
        const move = chess.move({from,to,promotion: "Q"}); // NOTE: always promote to a queen for example simplicity

        // illegal move?
        if (move === Action.INVALID_ACTION) return "snapback";
        
        if (gameType === "network") {
            socket.emit("move", {gameId, move: {from, to}, color: chess.myColor});
            updateTurnUI();
        }
        updateFENUI();
    };

    const setSquare = function(opts) {
        const { square, isHighlighted } = opts;
        if (!isHighlighted) {
            $('#board .square-55d63').css('background', '');
            return;
        }
        const squareEl = $('#board .square-' + square);
        let background = '#ff9849';
        if (squareEl.hasClass('black-3c85d') === true) {
          background = '#ea7115';
        }
        squareEl.css('background', background);
    };

    const onMouseoverSquare = function(square, piece) {
        // get list of possible moves for this square
        var moves = chess.available({
          square: square
        }).map(a => `${a.file}${a.rank}`);

        // exit if there are no moves available for this square
        if (moves.length === 0) return;

        // highlight the square they moused over
        setSquare({square, isHighlighted: true});

        // highlight the possible squares for this piece
        moves.forEach(m => {
            setSquare({square: m, isHighlighted: true});
        });
    };

    const onMouseoutSquare = function(square, piece) {
        setSquare({isHighlighted: false});
    };

    // update the board position after the piece snap 
    // for castling, en passant, pawn promotion
    const onSnapEnd = function() {
        board.position(chess.fen({turn:true}));
    };

    const updateTurnUI = (opts = {}) => {
        $("#turn").html(`${myTurn() ? "Your turn" : "Waiting for opponent"} to move.`);
    };

    const updateFENUI = (opts = {}) => {
        $("#fen").html(chess.fen({turn:true}));
    };

    const cfg = {
        draggable: true,
        position: chess.fen(),
        onDrop,
        onSnapEnd,
        onMouseoverSquare,
        onMouseoutSquare,
        orientation: chess.myColor
    };

    const board = ChessBoard("board", cfg);
    
    if (gameType === "network") {
        socket.on("connect", function() {
            socket.emit("join", { gameId });
            socket.on("move", function (data) {
                const { fen } = data;
                chess.input({fen});
                board.position(fen);
                updateTurnUI();
                updateFENUI();
            });
        });
    }
};
