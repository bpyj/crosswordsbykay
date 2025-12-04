document.addEventListener('DOMContentLoaded', () => {
    
    // --- Configuration ---
    // The gridData as requested by the user.
    const gridData = [
        // 0  1  2  3  4  5  6  7  8  9
        ['A', 'M', 'B', 'U', 'L', 'A', 'N', 'C', 'E', 'D'], // R0: AMBULANCE HORIZONTAL
        ['J', 'E', 'E', 'P', 'R', 'N', 'I', 'O', 'R', 'S'], // R1: JEEP HORIZONTAL
        ['T', 'O', 'L', 'T', 'S', 'I', 'N', 'T', 'U', 'T'], // R2: TRUCK DOWN, LORRY DOWN
        ['R', 'E', 'O', 'I', 'L', 'A', 'I', 'R', 'Y', 'A'], // R3: 
        ['U', 'I', 'R', 'P', 'L', 'R', 'A', 'E', 'V', 'O'], // R4: 
        ['C', 'O', 'R', 'C', 'Y', 'T', 'R', 'T', 'H', 'B'], // R5: TRAIN UP, BOATS UP
        ['K', 'D', 'Y', 'E', 'K', 'T', 'T', 'U', 'C', 'K'], // R6: 
        ['G', 'H', 'E', 'N', 'A', 'L', 'P', 'R', 'I', 'A'], // R7: AIRPLANE REVERSE
    ];

    // The words to find
    const wordsToFind = ['AMBULANCE', 'BOATS', 'TRAIN', 'AIRPLANE', 'LORRY', 'TRUCK', 'JEEP'];
    
    // --- Solved Paths Storage ---
    // Paths derived from the new grid structure:
    const solvedPaths = [
        // 1. AMBULANCE (Horizontal: R0, L-to-R)
        { word: 'AMBULANCE', path: [[0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8]] }, 
        
        // 2. JEEP (Horizontal: R1, L-to-R)
        { word: 'JEEP', path: [[1,0], [1,1], [1,2], [1,3]] }, 
        
        // 3. TRUCK (Vertical: C0, R2 to R6 - DOWN)
        { word: 'TRUCK', path: [[2,0], [3,0], [4,0], [5,0], [6,0]] }, // T R U C K
        
        // 4. LORRY (Vertical: C2, R2 to R6 - DOWN)
        { word: 'LORRY', path: [[2,2], [3,2], [4,2], [5,2], [6,2]] }, // L O R R Y
        
        // 5. TRAIN (Vertical: C5, R5 to R2 - UP)
        { word: 'TRAIN', path: [[5,5], [4,5], [3,5], [2,5], [1,5] ] }, // T R A I N
        
        // 6. BOATS (Vertical: C9, R5 to R2 - UP)
        { word: 'BOATS', path: [[5,9], [4,9], [3,9], [2,9]] }, // B O A T
        
        // 7. AIRPLANE (Horizontal: R7, R-to-L - REVERSE)
        { word: 'AIRPLANE', path: [[7,9], [7,8], [7,7], [7,6], [7,5], [7,4], [7,3], [7,2]] }, // A I R P L A N E
    ];


    const puzzleGrid = document.getElementById('puzzle-grid');
    const wordListElement = document.getElementById('word-list');
    const statusElement = document.getElementById('grid-status');
    const revealButton = document.getElementById('reveal-button');

    let firstSelection = null;
    let foundWords = new Set();
    let foundCount = 0;
    
    // --- Grid & List Initialization (Unchanged) ---

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

    // --- Core Game Logic (Full Search Capability: H, V, D - Unchanged) ---

    function getLettersInPath(startCell, endCell) {
        const r1 = parseInt(startCell.dataset.row);
        const c1 = parseInt(startCell.dataset.col);
        const r2 = parseInt(endCell.dataset.row);
        const c2 = parseInt(endCell.dataset.col);

        const dr = Math.sign(r2 - r1);
        const dc = Math.sign(c2 - c1);

        // Allow horizontal (dr=0), vertical (dc=0), or diagonal (abs(dr) = abs(dc))
        const isHorizontal = dr === 0 && dc !== 0;
        const isVertical = dr !== 0 && dc === 0;
        const isDiagonal = Math.abs(r2 - r1) === Math.abs(c2 - c1) && dr !== 0 && dc !== 0;

        if (!isHorizontal && !isVertical && !isDiagonal) {
            return null; // Invalid path
        }
        
        if (dr === 0 && dc === 0) {
            return null; // Same cell selected
        }

        let word = '';
        let path = [];
        let r = r1;
        let c = c1;

        // Cap to grid dimensions to prevent infinite loop/out-of-bounds errors 
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
            
            if (i === maxLen - 1) break; // Should not happen if path is valid
        }

        return { word, path };
    }

    function checkWord(startCell, endCell) {
        const result = getLettersInPath(startCell, endCell);
        if (!result) return null;

        const forwardWord = result.word;
        // Check for words spelled in reverse direction
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
            cell.removeEventListener('click', handleCellClick);
        });
    }

    function handleCellClick(event) {
        const cell = event.target;
        
        if (cell.classList.contains('highlighted')) {
            return;
        }

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
                statusElement.textContent = "That's not a word, try again (Must be straight H, V, or D)";
            }
            
            firstSelection = null;
        }
    }
    
    function updateProgress() {
        document.getElementById('progress-panel').textContent = `Found ${foundCount} of ${wordsToFind.length}`;
        if (foundCount === wordsToFind.length) {
            document.getElementById('complete-modal').style.display = 'flex';
        }
    }

    // --- Reveal Answers Functionality (Unchanged) ---

    function revealAnswers() {
        revealButton.disabled = true;
        statusElement.textContent = "Answers revealed!";

        solvedPaths.forEach(solved => {
            const alreadyFound = foundWords.has(solved.word);
            
            solved.path.forEach(coords => {
                const [r, c] = coords;
                const cell = document.getElementById(`cell-${r}-${c}`);
                
                if (cell) {
                    if (alreadyFound) {
                         cell.removeEventListener('click', handleCellClick);
                    } else {
                        // Highlight only words not yet found, in case of overlap
                        if (!foundWords.has(solved.word)) {
                            cell.classList.add('reveal-answer');
                        }
                        cell.removeEventListener('click', handleCellClick);
                    }
                }
            });

            const listItem = document.getElementById(`word-${solved.word}`);
            if (listItem) {
                listItem.classList.add('found');
            }
        });
    }

    // --- Initialization ---
    revealButton.addEventListener('click', revealAnswers);
    renderGrid();
    renderWordList();
    updateProgress();
});