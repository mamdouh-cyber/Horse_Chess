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

        // AI features
        this.vsAI = false;
        this.isAIThinking = false;

        // Timer features (Elapsed Time)
        this.timeWhite = 0;
        this.timeBlack = 0;
        this.lastTime = null;
        this.timerInterval = null;

        this.initBoard();
        this.renderBoard();
        this.setupEventListeners();
        this.renderTimers();
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
                this.board[row][col] = { type: pieces[7 - row][col], color: 'white' };
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
        let touchStartSquare = null;
        let isDragging = false;

        // Click handler (works on both desktop and mobile)
        board.addEventListener('click', (e) => {
            // Prevent click if it was part of a drag operation
            if (isDragging) {
                isDragging = false;
                return;
            }

            const square = e.target.closest('.square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.handleSquareClick(row, col);
        });

        // Touch event handlers for mobile
        board.addEventListener('touchstart', (e) => {
            const square = e.target.closest('.square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const piece = this.board[row][col];

            if (piece && piece.color === this.currentPlayer && !this.gameOver) {
                touchStartSquare = { row, col };
                const pieceElement = square.querySelector('.piece');
                if (pieceElement) {
                    pieceElement.classList.add('dragging');
                }
                this.selectedSquare = { row, col };
                this.highlightPossibleMoves(row, col);
                e.preventDefault(); // Prevent scrolling
            }
        }, { passive: false });

        board.addEventListener('touchmove', (e) => {
            if (touchStartSquare) {
                isDragging = true;
                e.preventDefault(); // Prevent scrolling while dragging
            }
        }, { passive: false });

        board.addEventListener('touchend', (e) => {
            if (!touchStartSquare) return;

            const touch = e.changedTouches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const square = element ? element.closest('.square') : null;

            if (square) {
                const row = parseInt(square.dataset.row);
                const col = parseInt(square.dataset.col);

                if (this.selectedSquare) {
                    this.handleMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
                    this.selectedSquare = null;
                }
            }

            // Clean up
            document.querySelectorAll('.piece.dragging').forEach(p => p.classList.remove('dragging'));
            this.clearHighlights();
            touchStartSquare = null;
            isDragging = false;
            e.preventDefault();
        }, { passive: false });

        // Drag and drop (for desktop)
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
        
        const aiToggleBtn = document.getElementById('ai-toggle-btn');
        if (aiToggleBtn) {
            aiToggleBtn.addEventListener('click', () => {
                this.vsAI = !this.vsAI;
                aiToggleBtn.textContent = `Play vs AI: ${this.vsAI ? 'On' : 'Off'}`;
                aiToggleBtn.classList.toggle('active-ai', this.vsAI);
                
                // If toggled on and it's currently Black's turn, make AI move
                if (this.vsAI && this.currentPlayer === 'black' && !this.gameOver && !this.isAIThinking) {
                    this.makeAIMove();
                }
            });
        }
        
        document.getElementById('start-timer-btn').addEventListener('click', () => {
            if (this.moveHistory.length === 0 && !this.gameOver) {
                this.startTimer();
            }
        });
    }

    handleSquareClick(row, col) {
        if (this.isAIThinking) return;
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
                    if (this.capturedPieces[this.board[toRow][toCol].color].length > 0) {
                        if (this.vsAI && this.board[toRow][toCol].color === 'black') {
                            this.handleAIPromotion(toRow, toCol, 'black');
                            return;
                        } else {
                            this.showPromotionDialog(toRow, toCol, this.board[toRow][toCol].color);
                            return; // Don't switch player yet, wait for promotion selection
                        }
                    }
                }
            }

            // Switch player
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

            // Check for check and checkmate
            this.updateCheckStatus();

            // Render board with animation
            this.renderBoard();
            this.animateMove(fromRow, fromCol, toRow, toCol);

            // Timer management
            this.startTimer();

            // Trigger AI Move
            if (this.vsAI && this.currentPlayer === 'black' && !this.gameOver) {
                this.makeAIMove();
            }
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
        const newBoard = Array(8);
        for (let r = 0; r < 8; r++) {
            newBoard[r] = Array(8);
            for (let c = 0; c < 8; c++) {
                const cell = this.board[r][c];
                newBoard[r][c] = cell ? { type: cell.type, color: cell.color } : null;
            }
        }
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

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.gameOver) return;

        const startBtn = document.getElementById('start-timer-btn');
        if (startBtn) startBtn.style.display = 'none';

        this.lastTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (this.gameOver) {
                clearInterval(this.timerInterval);
                return;
            }

            const now = Date.now();
            const delta = now - this.lastTime;
            this.lastTime = now;

            if (this.currentPlayer === 'white') {
                this.timeWhite += delta;
            } else {
                this.timeBlack += delta;
            }
            this.renderTimers();
        }, 30); // update every 30ms for smooth millisecond display
    }

    formatTime(ms) {
        const totalSides = Math.max(0, ms);
        const minutes = Math.floor(totalSides / 60000);
        const seconds = Math.floor((totalSides % 60000) / 1000);
        const milliseconds = Math.floor(totalSides % 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }

    renderTimers() {
        const whiteDisplay = document.querySelector('#timer-white .time-display');
        const blackDisplay = document.querySelector('#timer-black .time-display');

        if (whiteDisplay) whiteDisplay.textContent = this.formatTime(this.timeWhite);
        if (blackDisplay) blackDisplay.textContent = this.formatTime(this.timeBlack);

        const whiteTimer = document.getElementById('timer-white');
        const blackTimer = document.getElementById('timer-black');

        if (whiteTimer && blackTimer) {
            if (this.currentPlayer === 'white') {
                whiteTimer.classList.add('active');
                blackTimer.classList.remove('active');
            } else {
                blackTimer.classList.add('active');
                whiteTimer.classList.remove('active');
            }
        }
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
        if (!this.gameOver && this.moveHistory.length > 0) {
            this.startTimer();
        } else {
            clearInterval(this.timerInterval);
        }

        // If playing against AI and undo brought it to AI's turn, instantly undo again
        if (this.vsAI && this.currentPlayer === 'black' && this.moveHistory.length > 0) {
            setTimeout(() => this.undoMove(), 10);
        }
    }

    resetGame() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.inCheck = { white: false, black: false };
        this.gameOver = false;
        this.isAIThinking = false;

        this.timeWhite = 0;
        this.timeBlack = 0;
        this.lastTime = null;

        this.initBoard();
        this.renderBoard();
        this.updateCapturedPieces(); // Clear captured pieces display
        this.renderTimers();

        const startBtn = document.getElementById('start-timer-btn');
        if (startBtn) startBtn.style.display = 'inline-block';
    }

    // Show promotion dialog when pawn reaches last rank
    showPromotionDialog(row, col, color) {
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.id = 'promotion-dialog';
        dialog.className = 'promotion-dialog';

        // Dialog header
        const header = document.createElement('div');
        header.className = 'promotion-header';
        header.textContent = `Promote Pawn to (${color})`;
        dialog.appendChild(header);

        // Available pieces container
        const piecesContainer = document.createElement('div');
        piecesContainer.className = 'promotion-pieces';

        // Get captured pieces of the same color
        const capturedPieces = this.capturedPieces[color];

        // Add captured pieces as options
        if (capturedPieces.length > 0) {
            capturedPieces.forEach((piece, index) => {
                const pieceOption = document.createElement('div');
                pieceOption.className = `promotion-piece ${piece.color}`;
                pieceOption.innerHTML = this.getPieceSymbol(piece);
                pieceOption.dataset.type = piece.type;
                pieceOption.dataset.index = index;
                pieceOption.addEventListener('click', () => {
                    this.completePromotion(row, col, piece.type, piece.color, index);
                    document.body.removeChild(dialog);
                });
                piecesContainer.appendChild(pieceOption);
            });

            dialog.appendChild(piecesContainer);
            document.body.appendChild(dialog);
        }
    }

    // Complete the promotion process
    completePromotion(row, col, pieceType, color, capturedIndex = null) {
        // Update the pawn to the selected piece type
        this.board[row][col].type = pieceType;

        // If we used a captured piece, remove it from captured pieces
        if (capturedIndex !== null) {
            this.capturedPieces[color].splice(capturedIndex, 1);
            this.updateCapturedPieces();
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

        // Check for check and checkmate
        this.updateCheckStatus();

        // Render board with animation
        this.renderBoard();

        // Start timer after promotion move is concluded
        this.startTimer();

        // Animate the promoted piece
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (square) {
            square.classList.add('highlight');
            setTimeout(() => {
                square.classList.remove('highlight');
            }, 500);
        }

        // Trigger AI Move if its turn
        if (this.vsAI && this.currentPlayer === 'black' && !this.gameOver) {
            this.makeAIMove();
        }
    }

    // --- AI LOGIC ---

    makeAIMove() {
        if (this.gameOver || this.currentPlayer !== 'black') return;
        
        this.isAIThinking = true;
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.className = 'status-message ai-thinking';
            statusElement.textContent = 'AI is thinking...';
        }

        setTimeout(() => {
            const bestMove = this.getBestMove();
            this.isAIThinking = false;

            if (bestMove) {
                this.handleMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
            } else {
                this.updateStatus(); // re-verify checkmate status
            }
        }, 50); // let UI update
    }

    getBestMove() {
        const originalPlayer = this.currentPlayer;
        this.currentPlayer = 'black';
        const possibleMoves = this.getAllValidMoves('black');
        this.orderMoves(possibleMoves);
        
        // Depth 3 search means: Max(Black) -> Min(White) -> Max(Black)
        let bestScore = -Infinity;
        let bestMove = possibleMoves.length > 0 ? possibleMoves[0] : null;

        for (const move of possibleMoves) {
            const originalBoard = this.board;
            this.board = this.simulateMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
            
            const score = this.minimax(2, -Infinity, Infinity, false, 'white');
            
            this.board = originalBoard;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        this.currentPlayer = originalPlayer;
        return bestMove;
    }

    minimax(depth, alpha, beta, isMaximizingPlayer, currentPlayerColor) {
        if (depth === 0) {
            return this.evaluateBoard(this.board);
        }

        const originalPlayer = this.currentPlayer;
        this.currentPlayer = currentPlayerColor;
        const moves = this.getAllValidMoves(currentPlayerColor);
        this.currentPlayer = originalPlayer;

        if (moves.length === 0) {
            if (this.isKingInCheck(this.board, currentPlayerColor)) {
                return isMaximizingPlayer ? -99999 : 99999;
            }
            return 0; // stalemate
        }

        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const originalBoard = this.board;
                this.board = this.simulateMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
                const ev = this.minimax(depth - 1, alpha, beta, false, 'white');
                this.board = originalBoard;
                
                maxEval = Math.max(maxEval, ev);
                alpha = Math.max(alpha, ev);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const originalBoard = this.board;
                this.board = this.simulateMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
                const ev = this.minimax(depth - 1, alpha, beta, true, 'black');
                this.board = originalBoard;
                
                minEval = Math.min(minEval, ev);
                beta = Math.min(beta, ev);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    evaluateBoard(board) {
        let score = 0;
        const pieceValues = { pawn: 10, knight: 30, bishop: 30, rook: 50, queen: 90, king: 900 };
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    let value = pieceValues[piece.type] || 0;

                    // Positional basics: encourage center control
                    if (piece.type !== 'king' && piece.type !== 'rook') {
                        if (row >= 3 && row <= 4) value += 1;
                        if (col >= 3 && col <= 4) value += 1;
                    }

                    if (piece.color === 'black') {
                        score += value;
                    } else {
                        score -= value;
                    }
                }
            }
        }
        return score;
    }

    getAllValidMoves(color) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const validMoves = this.getValidMoves(row, col);
                    validMoves.forEach(m => {
                        moves.push({
                            fromRow: row, fromCol: col,
                            toRow: m.row, toCol: m.col,
                            captured: this.board[m.row][m.col]
                        });
                    });
                }
            }
        }
        return moves;
    }

    orderMoves(moves) {
        const pieceValues = { queen: 90, rook: 50, bishop: 30, knight: 30, pawn: 10, king: 900 };
        moves.sort((a, b) => {
            let scoreA = a.captured ? pieceValues[a.captured.type] : 0;
            let scoreB = b.captured ? pieceValues[b.captured.type] : 0;
            return scoreB - scoreA;
        });
    }

    handleAIPromotion(row, col, color) {
        const pieces = this.capturedPieces[color];
        if (pieces.length === 0) return;
        
        const pieceValues = { queen: 90, rook: 50, bishop: 30, knight: 30, pawn: 10 };
        let bestIndex = 0;
        let bestValue = -1;
        
        pieces.forEach((p, idx) => {
            const val = pieceValues[p.type] || 0;
            if (val > bestValue) {
                bestValue = val;
                bestIndex = idx;
            }
        });
        
        const bestPiece = pieces[bestIndex];
        this.completePromotion(row, col, bestPiece.type, color, bestIndex);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});

