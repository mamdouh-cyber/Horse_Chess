// Chess Game Logic
class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.inCheck = { white: false, black: false };
        this.gameOver = false;
        this.initBoard();
        this.renderBoard();
        this.setupEventListeners();
    }

    initBoard() {
        // Initialize empty board
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Place pieces in starting positions
        const pieces = [
            ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
            ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn']
        ];
        
        // Black pieces (top)
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 8; col++) {
                this.board[row][col] = { type: pieces[row][col], color: 'black' };
            }
        }
        
        // White pieces (bottom)
        for (let row = 6; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                this.board[row][col] = { type: pieces[7-row][col], color: 'white' };
            }
        }
    }

    getPieceSymbol(piece) {
        const symbols = {
            white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
            black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
        };
        return symbols[piece.color][piece.type];
    }

    renderBoard() {
        const boardElement = document.getElementById('chessboard');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.textContent = this.getPieceSymbol(piece);
                    pieceElement.draggable = piece.color === this.currentPlayer && !this.gameOver;
                    square.appendChild(pieceElement);
                }
                
                boardElement.appendChild(square);
            }
        }
        
        this.updateStatus();
    }

    setupEventListeners() {
        const board = document.getElementById('chessboard');
        
        // Click handler
        board.addEventListener('click', (e) => {
            const square = e.target.closest('.square');
            if (!square) return;
            
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.handleSquareClick(row, col);
        });
        
        // Drag and drop
        board.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('piece')) {
                const square = e.target.closest('.square');
                const row = parseInt(square.dataset.row);
                const col = parseInt(square.dataset.col);
                const piece = this.board[row][col];
                
                if (piece && piece.color === this.currentPlayer && !this.gameOver) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.target.classList.add('dragging');
                    this.selectedSquare = { row, col };
                    this.highlightPossibleMoves(row, col);
                } else {
                    e.preventDefault();
                }
            }
        });
        
        board.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            this.clearHighlights();
        });
        
        board.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        board.addEventListener('drop', (e) => {
            e.preventDefault();
            const square = e.target.closest('.square');
            if (!square) return;
            
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            
            if (this.selectedSquare) {
                this.handleMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
                this.selectedSquare = null;
            }
        });
        
        // Control buttons
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('undo-btn').addEventListener('click', () => this.undoMove());
    }

    handleSquareClick(row, col) {
        const piece = this.board[row][col];
        
        if (this.selectedSquare) {
            const selectedRow = this.selectedSquare.row;
            const selectedCol = this.selectedSquare.col;
            
            if (selectedRow === row && selectedCol === col) {
                // Deselect
                this.selectedSquare = null;
                this.clearHighlights();
            } else {
                // Try to move
                this.handleMove(selectedRow, selectedCol, row, col);
                this.selectedSquare = null;
            }
        } else if (piece && piece.color === this.currentPlayer && !this.gameOver) {
            // Select piece
            this.selectedSquare = { row, col };
            this.highlightPossibleMoves(row, col);
        }
    }

    highlightPossibleMoves(row, col) {
        const moves = this.getValidMoves(row, col);
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (square) square.classList.add('selected');
        
        moves.forEach(move => {
            const targetSquare = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (targetSquare) {
                if (this.board[move.row][move.col]) {
                    targetSquare.classList.add('possible-capture');
                } else {
                    targetSquare.classList.add('possible-move');
                }
            }
        });
    }

    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'possible-move', 'possible-capture', 'highlight');
        });
    }

    handleMove(fromRow, fromCol, toRow, toCol) {
        if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
            const capturedPiece = this.board[toRow][toCol];
            
            // Save move for undo
            this.moveHistory.push({
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol },
                piece: JSON.parse(JSON.stringify(this.board[fromRow][fromCol])),
                captured: capturedPiece ? JSON.parse(JSON.stringify(capturedPiece)) : null
            });
            
            // Handle captured piece
            if (capturedPiece) {
                this.capturedPieces[capturedPiece.color].push(capturedPiece);
                this.updateCapturedPieces();
            }
            
            // Move piece
            this.board[toRow][toCol] = this.board[fromRow][fromCol];
            this.board[fromRow][fromCol] = null;
            
            // Handle pawn promotion
            if (this.board[toRow][toCol].type === 'pawn') {
                if ((this.board[toRow][toCol].color === 'white' && toRow === 0) ||
                    (this.board[toRow][toCol].color === 'black' && toRow === 7)) {
                    this.board[toRow][toCol].type = 'queen';
                }
            }
            
            // Switch player
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            
            // Check for check and checkmate
            this.updateCheckStatus();
            
            // Render board with animation
            this.renderBoard();
            this.animateMove(fromRow, fromCol, toRow, toCol);
        } else {
            this.clearHighlights();
        }
    }

    animateMove(fromRow, fromCol, toRow, toCol) {
        const fromSquare = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
        const toSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
        
        if (fromSquare && toSquare) {
            toSquare.classList.add('highlight');
            setTimeout(() => {
                toSquare.classList.remove('highlight');
            }, 500);
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        if (piece.color !== this.currentPlayer) return false;
        if (fromRow === toRow && fromCol === toCol) return false;
        
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        // Check if move is valid for piece type
        if (!this.isValidPieceMove(piece, fromRow, fromCol, toRow, toCol)) {
            return false;
        }
        
        // Check if move would put own king in check (or leave it in check)
        // This also correctly handles moves that BLOCK a check - if the move blocks
        // the check, the simulated board will show the king is no longer in check,
        // making the move valid. Similarly, capturing the attacking piece will
        // also be detected as a valid move.
        const testBoard = this.simulateMove(fromRow, fromCol, toRow, toCol);
        if (this.isKingInCheck(testBoard, piece.color)) {
            return false;
        }
        
        return true;
    }

    simulateMove(fromRow, fromCol, toRow, toCol) {
        const newBoard = this.board.map(row => row.map(cell => cell ? JSON.parse(JSON.stringify(cell)) : null));
        newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
        newBoard[fromRow][fromCol] = null;
        return newBoard;
    }

    isValidPieceMove(piece, fromRow, fromCol, toRow, toCol) {
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        
        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
                       (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
            case 'bishop':
                return Math.abs(rowDiff) === Math.abs(colDiff) &&
                       this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff)) &&
                       this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'king':
                return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
            default:
                return false;
        }
    }

    isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const rowDiff = toRow - fromRow;
        const colDiff = Math.abs(toCol - fromCol);
        const targetPiece = this.board[toRow][toCol];
        
        // Forward move
        if (colDiff === 0 && !targetPiece) {
            if (rowDiff === direction) return true;
            if (fromRow === startRow && rowDiff === 2 * direction) {
                return !this.board[fromRow + direction][fromCol];
            }
        }
        
        // Diagonal capture
        if (colDiff === 1 && rowDiff === direction && targetPiece && targetPiece.color !== piece.color) {
            return true;
        }
        
        return false;
    }

    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        return (fromRow === toRow || fromCol === toCol) &&
               this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        return this.isPathClearOnBoard(this.board, fromRow, fromCol, toRow, toCol);
    }

    getValidMoves(row, col) {
        const moves = [];
        const piece = this.board[row][col];
        if (!piece || piece.color !== this.currentPlayer) return moves;
        
        for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
                if (this.isValidMove(row, col, toRow, toCol)) {
                    moves.push({ row: toRow, col: toCol });
                }
            }
        }
        
        return moves;
    }

    findKing(board, color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isKingInCheck(board, color) {
        const kingPos = this.findKing(board, color);
        if (!kingPos) return false;
        
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // Check if any opponent piece can attack the king
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.canPieceAttackSquare(board, row, col, kingPos.row, kingPos.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    canPieceAttackSquare(board, fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        if (!piece) return false;
        
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        
        // Check pawn attacks (diagonal only)
        if (piece.type === 'pawn') {
            const direction = piece.color === 'white' ? -1 : 1;
            return Math.abs(colDiff) === 1 && rowDiff === direction;
        }
        
        // Check knight attacks
        if (piece.type === 'knight') {
            return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
                   (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
        }
        
        // Check rook/queen horizontal/vertical attacks
        if (piece.type === 'rook' || piece.type === 'queen') {
            if (rowDiff === 0 || colDiff === 0) {
                return this.isPathClearOnBoard(board, fromRow, fromCol, toRow, toCol);
            }
        }
        
        // Check bishop/queen diagonal attacks
        if (piece.type === 'bishop' || piece.type === 'queen') {
            if (Math.abs(rowDiff) === Math.abs(colDiff)) {
                return this.isPathClearOnBoard(board, fromRow, fromCol, toRow, toCol);
            }
        }
        
        // Check king attacks (adjacent squares)
        if (piece.type === 'king') {
            return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
        }
        
        return false;
    }

    isPathClearOnBoard(board, fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }

    updateCheckStatus() {
        this.inCheck.white = this.isKingInCheck(this.board, 'white');
        this.inCheck.black = this.isKingInCheck(this.board, 'black');
        
        // Highlight king in check
        this.clearHighlights();
        if (this.inCheck.white) {
            const whiteKing = this.findKing(this.board, 'white');
            if (whiteKing) {
                const square = document.querySelector(`[data-row="${whiteKing.row}"][data-col="${whiteKing.col}"]`);
                if (square) square.classList.add('in-check');
            }
        }
        if (this.inCheck.black) {
            const blackKing = this.findKing(this.board, 'black');
            if (blackKing) {
                const square = document.querySelector(`[data-row="${blackKing.row}"][data-col="${blackKing.col}"]`);
                if (square) square.classList.add('in-check');
            }
        }
    }

    hasValidMoves(color) {
        // Check all pieces of the given color for any valid moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    // Try all possible moves for this piece
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(row, col, toRow, toCol)) {
                                // Found at least one valid move that:
                                // - Moves king out of check, OR
                                // - Blocks the check, OR
                                // - Captures the attacking piece
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    isCheckmate(color) {
        // Only checkmate if king is in check AND no valid moves exist
        // Valid moves include: moving king, blocking check, or capturing attacker
        if (!this.inCheck[color]) {
            return false;
        }
        
        // Double-check that there are truly no valid moves
        // This includes moves that block the check or capture the attacking piece
        return !this.hasValidMoves(color);
    }

    isStalemate(color) {
        return !this.inCheck[color] && !this.hasValidMoves(color);
    }

    updateStatus() {
        const statusElement = document.getElementById('status-message');
        const turnElement = document.getElementById('current-turn');
        
        statusElement.className = 'status-message';
        statusElement.textContent = '';
        
        if (this.gameOver) {
            return;
        }
        
        turnElement.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
        
        if (this.isCheckmate('white')) {
            statusElement.textContent = 'Checkmate! Black Wins!';
            statusElement.className = 'status-message checkmate';
            this.gameOver = true;
        } else if (this.isCheckmate('black')) {
            statusElement.textContent = 'Checkmate! White Wins!';
            statusElement.className = 'status-message checkmate';
            this.gameOver = true;
        } else if (this.isStalemate(this.currentPlayer)) {
            statusElement.textContent = 'Stalemate! Game Draw!';
            statusElement.className = 'status-message stalemate';
            this.gameOver = true;
        } else if (this.inCheck[this.currentPlayer]) {
            statusElement.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} is in Check!`;
            statusElement.className = 'status-message check';
        }
    }

    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('captured-white');
        const blackCaptured = document.getElementById('captured-black');
        
        whiteCaptured.innerHTML = '';
        blackCaptured.innerHTML = '';
        
        this.capturedPieces.white.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
            span.textContent = this.getPieceSymbol(piece);
            whiteCaptured.appendChild(span);
        });
        
        this.capturedPieces.black.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
            span.textContent = this.getPieceSymbol(piece);
            blackCaptured.appendChild(span);
        });
    }

    undoMove() {
        if (this.moveHistory.length === 0 || this.gameOver) return;
        
        const lastMove = this.moveHistory.pop();
        
        // Restore piece to original position
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        
        // Restore captured piece if any
        if (lastMove.captured) {
            this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
            this.capturedPieces[lastMove.captured.color].pop();
        } else {
            this.board[lastMove.to.row][lastMove.to.col] = null;
        }
        
        // Switch player back
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Update status
        this.updateCheckStatus();
        this.updateCapturedPieces();
        this.renderBoard();
    }

    resetGame() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.inCheck = { white: false, black: false };
        this.gameOver = false;
        this.initBoard();
        this.renderBoard();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});

