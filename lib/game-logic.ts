export function initializeBoard(): number[][] {
  const board = Array(4)
    .fill(null)
    .map(() => Array(4).fill(0))

  // Add two random tiles
  addRandomTile(board)
  addRandomTile(board)

  return board
}

function addRandomTile(board: number[][]): void {
  const empty: [number, number][] = []
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] === 0) {
        empty.push([i, j])
      }
    }
  }

  if (empty.length === 0) return

  const [row, col] = empty[Math.floor(Math.random() * empty.length)]
  board[row][col] = Math.random() < 0.9 ? 2 : 4
}

/**
 * Moves the board in the given direction and returns:
 * - updated board
 * - whether anything moved
 * - scoreDelta: the points gained from merges this move
 */
export function move(
  board: number[][],
  direction: "up" | "down" | "left" | "right",
): { board: number[][]; moved: boolean; scoreDelta: number } {
  const newBoard = board.map((row) => [...row])
  let moved = false
  let scoreDelta = 0

  if (direction === "left" || direction === "right") {
    for (let i = 0; i < 4; i++) {
      const result = moveLine(newBoard[i], direction === "left")
      newBoard[i] = result.line
      moved = moved || result.moved
      scoreDelta += result.scoreDelta
    }
  } else {
    for (let j = 0; j < 4; j++) {
      const column = [newBoard[0][j], newBoard[1][j], newBoard[2][j], newBoard[3][j]]
      const result = moveLine(column, direction === "up")
      for (let i = 0; i < 4; i++) {
        newBoard[i][j] = result.line[i]
      }
      moved = moved || result.moved
      scoreDelta += result.scoreDelta
    }
  }

  if (moved) {
    addRandomTile(newBoard)
  }

  return { board: newBoard, moved, scoreDelta }
}

/**
 * Handles moving and merging a single row or column.
 * Returns the new line, whether it moved, and the score gained from merges.
 */
function moveLine(line: number[], left: boolean): { line: number[]; moved: boolean; scoreDelta: number } {
  let newLine = [...line]
  let scoreDelta = 0

  // Remove zeros
  newLine = newLine.filter((val) => val !== 0)

  // Merge adjacent equal tiles
  for (let i = 0; i < newLine.length - 1; i++) {
    if (newLine[i] === newLine[i + 1]) {
      newLine[i] *= 2
      scoreDelta += newLine[i] // add the merged tile’s value to the score
      newLine.splice(i + 1, 1)
    }
  }

  // Add zeros to fill back
  while (newLine.length < 4) {
    if (left) {
      newLine.push(0)
    } else {
      newLine.unshift(0)
    }
  }

  const moved = newLine.join(",") !== line.join(",")
  return { line: newLine, moved, scoreDelta }
}

export function canMove(board: number[][]): boolean {
  // Check for empty cells
  if (board.flat().some((val) => val === 0)) return true

  // Check for possible merges
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const current = board[i][j]
      if ((i < 3 && current === board[i + 1][j]) || (j < 3 && current === board[i][j + 1])) {
        return true
      }
    }
  }

  return false
}
