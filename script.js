document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    const wordsToFind = ['AMBULANCE', 'BOATS', 'TRAIN', 'AIRPLANE', 'LORRY', 'TRUCK', 'JEEP'];

    const ROWS = 10;
    const COLS = 10;

    // Grid & solution storage
    let gridData = [];
    let solvedPaths = [];

    // Mode: "easy" = only → and ↓, "hard" = all directions
    let currentMode = 'hard';

    const puzzleGrid = document.getElementById('puzzle-grid');
    const wordListElement = document.getElementById('word-list');
    const statusElement = document.getElementById('grid-status');
    const revealButton = document.getElementById('reveal-button');
    const modeInputs = document.querySelectorAll('input[name="mode"]');

    let firstSelection = null;
    let foundWords = new Set();
    let foundCount = 0;

    // Reveal toggle state
    let answersShown = false;

    // ---------- GRID GENERATION FROM WORDS ----------

    function createEmptyGrid() {
        gridData = [];
        for (let r = 0; r < ROWS; r++) {
            const row = new Array(COLS).fill(null);
            gridData.push(row);
        }
    }

    // Direction sets
    const DIRECTIONS_HARD = [
        [0, 1],   // right
        [0, -1],  // left
        [1, 0],   // down
        [-1, 0],  // up
        [1, 1],   // down-right
        [1, -1],  // down-left
        [-1, 1],  // up-right
        [-1, -1]  // up-left
    ];

    const DIRECTIONS_EASY = [
        [0, 1],   // right (left -> right)
        [1, 0],   // down (top -> bottom)
    ];

    function getDirectionsForMode() {
        return currentMode === 'easy' ? DIRECTIONS_EASY : DIRECTIONS_HARD;
    }

    function placeWord(word) {
        const upperWord = word.toUpperCase();
        const len = upperWord.length;
        const maxAttempts = 200;

        const directions = getDirectionsForMode();

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];

            // Compute valid start ranges so the word fits
            let minRow = 0, maxRow = ROWS - 1;
            let minCol = 0, maxCol = COLS - 1;

            if (dr === 1) maxRow = ROWS - len;
            if (dr === -1) minRow = len - 1;
            if (dc === 1) maxCol = COLS - len;
            if (dc === -1) minCol = len - 1;

            if (minRow > maxRow || minCol > maxCol) continue;

            const startRow = randomInt(minRow, maxRow);
            const startCol = randomInt(minCol, maxCol);

            let canPlace = true;
            let pathCoords = [];

            for (let i = 0; i < len; i++) {
                const r = startRow + dr * i;
                const c = startCol + dc * i;

                const existing = gridData[r][c];
                const ch = upperWord[i];

                if (existing !== null && existing !== ch) {
                    canPlace = false;
                    break;
                }
                pathCoords.push([r, c]);
            }

            if (!canPlace) continue;

            // Place the word
            for (let i = 0; i < len; i++) {
                const r = startRow + dr * i;
                const c = startCol + dc * i;
                gridData[r][c] = upperWord[i];
            }

            // Store solution path
            solvedPaths.push({
                word: upperWord,
                path: pathCoords
            });

            return true;
        }

        console.warn(`Could not place word: ${word}`);
        return false;
    }

    function fillRandomLetters() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (gridData[r][c] === null) {
                    const randChar = alphabet[Math.floor(Math.random() * alphabet.length)];
                    gridData[r][c] = randChar;
                }
            }
        }
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateGridFromWords() {
        createEmptyGrid();
        solvedPaths = [];

        const wordsCopy = [...wordsToFind].sort((a, b) => b.length - a.length);

        wordsCopy.forEach(word => {
            placeWord(word);
        });

        fillRandomLetters();
    }

    // ---------- RENDERING ----------

    function renderGrid() {
        puzzleGrid.innerHTML = '';
        const numCols = gridData[0].length;

        gridData.forEach((row, rowIndex) => {
            row.forEach((letter, colIndex) => {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.textContent = letter;
                cell.dataset.row = rowIndex;
                cell.dataset.col = colIndex;
                cell.id = `cell-${rowIndex}-${colIndex}`;
                cell.addEventListener('click', handleCellClick);
                puzzleGrid.appendChild(cell);
            });
        });

        puzzleGrid.style.gridTemplateColumns = `repeat(${numCols}, var(--grid-cell-size))`;
    }

    function renderWordList() {
        wordListElement.innerHTML = '';
        wordsToFind.forEach(word => {
            const listItem = document.createElement('li');
            listItem.classList.add('word-item');
            listItem.textContent = word;
            listItem.id = `word-${word}`;
            wordListElement.appendChild(listItem);
        });
    }

    // ---------- PATH VALIDATION (depends on mode) ----------

    function isValidDirection(r1, c1, r2, c2, dr, dc) {
        if (currentMode === 'easy') {
            // Easy: only left->right and top->down
            const isHorizontalLtoR = (r1 === r2) && (c2 > c1) && dr === 0 && dc === 1;
            const isVerticalTopDown = (c1 === c2) && (r2 > r1) && dr === 1 && dc === 0;
            return isHorizontalLtoR || isVerticalTopDown;
        } else {
            // Hard: any straight H, V, or diagonal
            const isHorizontal = dr === 0 && dc !== 0;
            const isVertical = dr !== 0 && dc === 0;
            const isDiagonal = Math.abs(r2 - r1) === Math.abs(c2 - c1) && dr !== 0 && dc !== 0;
            return isHorizontal || isVertical || isDiagonal;
        }
    }

    function getLettersInPath(startCell, endCell) {
        const r1 = parseInt(startCell.dataset.row);
        const c1 = parseInt(startCell.dataset.col);
        const r2 = parseInt(endCell.dataset.row);
        const c2 = parseInt(endCell.dataset.col);

        const dr = Math.sign(r2 - r1);
        const dc = Math.sign(c2 - c1);

        if (dr === 0 && dc === 0) {
            return null; // Same cell
        }

        if (!isValidDirection(r1, c1, r2, c2, dr, dc)) {
            return null;
        }

        let word = '';
        let path = [];
        let r = r1;
        let c = c1;

        const maxLen = Math.max(gridData.length, gridData[0].length);

        for (let i = 0; i < maxLen; i++) {
            const cellId = `cell-${r}-${c}`;
            const cell = document.getElementById(cellId);
            if (!cell) break;

            word += cell.textContent;
            path.push(cell);

            if (r === r2 && c === c2) break;

            r += dr;
            c += dc;
        }

        return { word, path };
    }

    function checkWord(startCell, endCell) {
        const result = getLettersInPath(startCell, endCell);
        if (!result) return null;

        const forwardWord = result.word;
        const reversedWord = result.word.split('').reverse().join('');

        for (const targetWord of wordsToFind) {
            if (targetWord === forwardWord && !foundWords.has(targetWord)) {
                highlightWord(result.path);
                return targetWord;
            }
            if (targetWord === reversedWord && !foundWords.has(targetWord)) {
                highlightWord(result.path);
                return targetWord;
            }
        }
        return null;
    }

    function markWordAsFound(word) {
        foundWords.add(word);
        foundCount = foundWords.size;

        const listItem = document.getElementById(`word-${word}`);
        if (listItem) {
            listItem.classList.add('found');
        }

        updateProgress();
    }

    function highlightWord(path) {
        path.forEach(cell => {
            cell.classList.add('highlighted');
            // Keep click listeners so letters can be reused by overlapping words
        });
    }

    // ---------- CLICK HANDLING ----------

    function handleCellClick(event) {
        const cell = event.target;

        if (!firstSelection) {
            firstSelection = cell;
            cell.classList.add('selected');
            statusElement.textContent = 'Now click the ending letter';
        } else {
            const foundWord = checkWord(firstSelection, cell);

            firstSelection.classList.remove('selected');

            if (foundWord) {
                markWordAsFound(foundWord);
                statusElement.textContent = `Found: ${foundWord}!`;
            } else {
                statusElement.textContent =
                    currentMode === 'easy'
                        ? "That's not a word, try again (Must be straight → or ↓)"
                        : "That's not a word, try again (Must be straight H, V, or D)";
            }

            firstSelection = null;
        }
    }

    function updateProgress() {
        document.getElementById('progress-panel').textContent =
            `Found ${foundCount} of ${wordsToFind.length}`;
        if (foundCount === wordsToFind.length) {
            document.getElementById('complete-modal').style.display = 'flex';
        }
    }

    // ---------- REVEAL ANSWERS TOGGLE ----------

    function toggleRevealAnswers() {
        if (!answersShown) {
            revealAnswers();
            answersShown = true;
            revealButton.textContent = "Hide Answers";
        } else {
            hideAnswers();
            answersShown = false;
            revealButton.textContent = "Reveal Answers";
        }
    }

    function revealAnswers() {
        statusElement.textContent = "Answers revealed!";

        solvedPaths.forEach(solved => {
            const alreadyFound = foundWords.has(solved.word);

            solved.path.forEach(([r, c]) => {
                const cell = document.getElementById(`cell-${r}-${c}`);
                if (!cell) return;

                if (!alreadyFound) {
                    cell.classList.add("reveal-answer");
                }
            });

            const listItem = document.getElementById(`word-${solved.word}`);
            if (listItem) listItem.classList.add("found");
        });
    }

    function hideAnswers() {
        statusElement.textContent = "Answers hidden";

        solvedPaths.forEach(solved => {
            const alreadyFound = foundWords.has(solved.word);

            solved.path.forEach(([r, c]) => {
                const cell = document.getElementById(`cell-${r}-${c}`);
                if (!cell) return;

                if (!alreadyFound) {
                    cell.classList.remove("reveal-answer");
                }
            });

            const listItem = document.getElementById(`word-${solved.word}`);
            if (listItem && !foundWords.has(solved.word)) {
                listItem.classList.remove("found");
            }
        });
    }

    // ---------- MODE SWITCH & GAME RESET ----------

    function resetGame() {
        firstSelection = null;
        foundWords = new Set();
        foundCount = 0;
        answersShown = false;
        revealButton.textContent = "Reveal Answers";
        statusElement.textContent = "Click a starting letter";

        generateGridFromWords();
        renderGrid();
        renderWordList();
        updateProgress();
    }

    modeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentMode = e.target.value; // "easy" or "hard"
                resetGame();
            }
        });
    });

        // ---------- INITIALIZATION ----------

        const resetButton = document.getElementById('reset-button');

        revealButton.addEventListener("click", toggleRevealAnswers);

        resetButton.addEventListener("click", () => {
            // Reset reveal state + regenerate puzzle
            answersShown = false;
            revealButton.textContent = "Reveal Answers";
            resetGame();
        });

        resetGame();
    });

