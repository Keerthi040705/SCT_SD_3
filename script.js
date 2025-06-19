const table = document.getElementById('sudoku-grid');
const messageEl = document.getElementById('message');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

const undoStack = [];
const redoStack = [];

for (let r = 0; r < 9; r++) {
  const row = document.createElement('tr');
  for (let c = 0; c < 9; c++) {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.setAttribute('data-row', r);
    input.setAttribute('data-col', c);
    input.addEventListener('input', onInputChange);
    input.addEventListener('change', onInputChange);
    input.addEventListener('keydown', onKeyDown);
    cell.appendChild(input);
    row.appendChild(cell);
  }
  table.appendChild(row);
}

function getGrid() {
  const grid = [];
  for (let r = 0; r < 9; r++) {
    grid[r] = [];
    for (let c = 0; c < 9; c++) {
      const val = table.rows[r].cells[c].firstChild.value;
      grid[r][c] = val === '' ? 0 : parseInt(val);
    }
  }
  return grid;
}

function setGrid(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      table.rows[r].cells[c].firstChild.value = grid[r][c] === 0 ? '' : grid[r][c];
    }
  }
}

function isValid(grid, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (i !== col && grid[row][i] === num) return false;
    if (i !== row && grid[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === num) return false;
    }
  }
  return true;
}

function highlightErrors() {
  const grid = getGrid();
  clearErrorHighlights();

  let anyError = false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      const input = table.rows[r].cells[c].firstChild;
      if (val !== 0 && !isValid(grid, r, c, val)) {
        input.classList.add('error');
        anyError = true;
      } else {
        input.classList.remove('error');
      }
    }
  }
  messageEl.textContent = anyError ? "There are conflicting cells! Please fix errors." : "";
  return !anyError;
}

function clearErrorHighlights() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      table.rows[r].cells[c].firstChild.classList.remove('error');
    }
  }
}

function solveSudoku(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function onInputChange(e) {
  const input = e.target;
  let val = input.value;

  if (val === '') {
    val = '';
  } else if (!/^[1-9]$/.test(val)) {
    input.value = '';
    return;
  } else {
    val = parseInt(val);
  }

  pushUndo();
  redoStack.length = 0;
  updateUndoRedoButtons();
  highlightErrors();
}

function updateUndoRedoButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

function pushUndo() {
  const currentGrid = getGrid();
  const last = undoStack[undoStack.length - 1];
  if (!last || !gridsEqual(last, currentGrid)) {
    undoStack.push(currentGrid.map(row => [...row]));
    if (undoStack.length > 100) undoStack.shift();
  }
}

function gridsEqual(g1, g2) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (g1[r][c] !== g2[r][c]) return false;
    }
  }
  return true;
}

undoBtn.addEventListener('click', () => {
  if (undoStack.length === 0) return;
  redoStack.push(getGrid());
  const prevGrid = undoStack.pop();
  setGrid(prevGrid);
  highlightErrors();
  updateUndoRedoButtons();
});

redoBtn.addEventListener('click', () => {
  if (redoStack.length === 0) return;
  undoStack.push(getGrid());
  const nextGrid = redoStack.pop();
  setGrid(nextGrid);
  highlightErrors();
  updateUndoRedoButtons();
});

document.getElementById('solve-btn').addEventListener('click', () => {
  messageEl.textContent = '';
  if (!highlightErrors()) return;
  const grid = getGrid();
  if (solveSudoku(grid)) {
    setGrid(grid);
    messageEl.textContent = "Sudoku solved!";
    clearErrorHighlights();
    table.classList.add('solved');
    setTimeout(() => table.classList.remove('solved'), 1600);
  } else {
    messageEl.textContent = "No solution found for the given Sudoku.";
  }
});

document.getElementById('clear-btn').addEventListener('click', () => {
  messageEl.textContent = '';
  redoStack.length = 0;
  undoStack.length = 0;
  updateUndoRedoButtons();
  setGrid(Array(9).fill(0).map(() => Array(9).fill(0)));
  clearErrorHighlights();
});

function onKeyDown(e) {
  const input = e.target;
  const row = +input.getAttribute('data-row');
  const col = +input.getAttribute('data-col');
  let nextRow = row;
  let nextCol = col;

  switch (e.key) {
    case 'ArrowUp': nextRow = (row + 8) % 9; break;
    case 'ArrowDown': nextRow = (row + 1) % 9; break;
    case 'ArrowLeft': nextCol = (col + 8) % 9; break;
    case 'ArrowRight': nextCol = (col + 1) % 9; break;
    default: return;
  }

  e.preventDefault();
  table.rows[nextRow].cells[nextCol].firstChild.focus();
}

pushUndo();
updateUndoRedoButtons();
