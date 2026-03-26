# Chess Game - Checkmate Edition

A fully functional chess game with checkmate detection, beautiful animations, and modern UI.

## Features

- ✅ **Complete Chess Rules**: All standard chess rules implemented
- ✅ **Check Detection**: Automatically detects when a king is in check
- ✅ **Checkmate Detection**: Full checkmate algorithm that detects game-ending scenarios
- ✅ **Stalemate Detection**: Detects draw situations
- ✅ **Drag & Drop**: Intuitive piece movement with drag and drop
- ✅ **Click to Move**: Alternative click-based movement
- ✅ **Visual Feedback**: 
  - Highlights possible moves
  - Shows captured pieces
  - Animates piece movements
  - Highlights king in check
- ✅ **Move History**: Undo functionality to revert moves
- ✅ **Modern UI**: Beautiful gradient design with smooth animations

## How to Play

1. **Opening**: Open `index.html` in your web browser
2. **Moving Pieces**: 
   - Click on a piece to select it, then click on a valid square to move
   - Or drag and drop pieces to their destination
3. **Turn Indicator**: The header shows whose turn it is
4. **Check/Checkmate**: The status message will alert you when a king is in check or checkmated
5. **Controls**:
   - **New Game**: Resets the board to starting position
   - **Undo Move**: Reverts the last move

## Game Rules

- **Pawns**: Move forward one square (two on first move), capture diagonally
- **Rooks**: Move horizontally or vertically any number of squares
- **Knights**: Move in L-shape (2 squares in one direction, 1 square perpendicular)
- **Bishops**: Move diagonally any number of squares
- **Queens**: Move horizontally, vertically, or diagonally any number of squares
- **Kings**: Move one square in any direction
- **Pawn Promotion**: Automatically promotes to Queen when reaching the opposite end
- **Check**: King is under attack
- **Checkmate**: King is in check with no legal moves available
- **Stalemate**: No legal moves available but king is not in check (draw)

## Technical Details

- Pure HTML, CSS, and JavaScript (no dependencies)
- Responsive design that works on desktop and mobile
- Efficient checkmate algorithm that validates all possible moves
- Prevents moves that would put your own king in check

Enjoy playing chess!

