// Hungarian algorithm for minimization with step-by-step trace.
// Handles non-square matrices by padding with zeros (dummy rows/cols represent
// "no assignment" and carry zero cost, which is the standard convention).

export type Step = {
  title: string;
  description: string;
  matrix: number[][];
  highlight?: { rows?: number[]; cols?: number[]; cells?: [number, number][] };
};

export type Solution = {
  steps: Step[];
  assignment: { row: number; col: number; cost: number; isDummy: boolean }[];
  totalCost: number;
  size: number;
  originalRows: number;
  originalCols: number;
};

const clone = (m: number[][]) => m.map((r) => [...r]);

export function solveHungarian(input: number[][]): Solution {
  const originalRows = input.length;
  const originalCols = input[0]?.length ?? 0;
  const n = Math.max(originalRows, originalCols);
  const steps: Step[] = [];

  // Pad to square with 0 - dummy rows/cols represent unassigned slots and
  // carry no real cost. This is the standard convention for the Hungarian method.
  const PAD = 0;

  const m: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i < originalRows && j < originalCols) row.push(input[i][j]);
      else row.push(PAD);
    }
    m.push(row);
  }

  if (originalRows !== originalCols) {
    steps.push({
      title: "Balance the matrix",
      description: `Matrix is ${originalRows}×${originalCols}. Padded to ${n}×${n} with dummy values (0) so it becomes square. Dummy rows/columns represent unassigned slots and carry zero cost.`,
      matrix: clone(m),
    });
  } else {
    steps.push({
      title: "Initial cost matrix",
      description: `Starting with the given ${n}×${n} cost matrix.`,
      matrix: clone(m),
    });
  }

  // Step 1: Row reduction
  for (let i = 0; i < n; i++) {
    const min = Math.min(...m[i]);
    if (min > 0) for (let j = 0; j < n; j++) m[i][j] -= min;
  }
  steps.push({
    title: "Step 1 - Row reduction",
    description:
      "Subtract the smallest element of each row from every element in that row. Each row now contains at least one zero.",
    matrix: clone(m),
  });

  // Step 2: Column reduction
  for (let j = 0; j < n; j++) {
    let min = Infinity;
    for (let i = 0; i < n; i++) if (m[i][j] < min) min = m[i][j];
    if (min > 0) for (let i = 0; i < n; i++) m[i][j] -= min;
  }
  steps.push({
    title: "Step 2 - Column reduction",
    description:
      "Subtract the smallest element of each column from every element in that column. Each column now also contains at least one zero.",
    matrix: clone(m),
  });

  // Step 3+: cover zeros with minimum lines; if lines == n, assignment found.
  let iter = 0;
  while (iter++ < 100) {
    const { rowCover, colCover, lines } = coverZeros(m);
    if (lines >= n) {
      steps.push({
        title: `Step ${2 + iter} - Optimal assignment reachable`,
        description: `Minimum number of lines to cover all zeros = ${lines}, which equals matrix size ${n}. An optimal assignment exists.`,
        matrix: clone(m),
        highlight: { rows: rowCover, cols: colCover },
      });
      break;
    }
    // Find min uncovered
    let minUncovered = Infinity;
    for (let i = 0; i < n; i++) {
      if (rowCover.includes(i)) continue;
      for (let j = 0; j < n; j++) {
        if (colCover.includes(j)) continue;
        if (m[i][j] < minUncovered) minUncovered = m[i][j];
      }
    }
    steps.push({
      title: `Step ${2 + iter} - Cover zeros`,
      description: `Cover all zeros using ${lines} lines (rows: ${rowCover.length ? rowCover.map((r) => r + 1).join(", ") : "none"}; cols: ${colCover.length ? colCover.map((c) => c + 1).join(", ") : "none"}). Lines < ${n}, so adjust: subtract ${minUncovered} from uncovered elements and add it to doubly-covered elements.`,
      matrix: clone(m),
      highlight: { rows: rowCover, cols: colCover },
    });
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const rc = rowCover.includes(i);
        const cc = colCover.includes(j);
        if (!rc && !cc) m[i][j] -= minUncovered;
        else if (rc && cc) m[i][j] += minUncovered;
      }
    }
  }

  // Final assignment via Hungarian augmenting on the reduced 0/non-0 matrix.
  const assignment = findAssignment(m);
  const result: { row: number; col: number; cost: number; isDummy: boolean }[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const j = assignment[i];
    const isDummy = i >= originalRows || j >= originalCols;
    const cost = isDummy ? 0 : input[i][j];
    if (!isDummy) total += cost;
    result.push({ row: i, col: j, cost, isDummy });
  }

  steps.push({
    title: "Final assignment",
    description: `Make assignments at zero positions of the final reduced matrix. Total minimum cost = ${total}.`,
    matrix: clone(m),
    highlight: { cells: assignment.map((j, i) => [i, j] as [number, number]) },
  });

  return {
    steps,
    assignment: result,
    totalCost: total,
    size: n,
    originalRows,
    originalCols,
  };
}

// Cover all zeros with minimum number of horizontal/vertical lines.
function coverZeros(m: number[][]): { rowCover: number[]; colCover: number[]; lines: number } {
  const n = m.length;
  // Greedy assignment of zeros
  const rowAssign = new Array(n).fill(-1);
  const colAssign = new Array(n).fill(-1);
  const zerosInRow = m.map((row) => row.reduce((a, v) => a + (v === 0 ? 1 : 0), 0));
  // Try rows with fewest zeros first for better marking
  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => zerosInRow[a] - zerosInRow[b],
  );
  for (const i of order) {
    for (let j = 0; j < n; j++) {
      if (m[i][j] === 0 && colAssign[j] === -1) {
        rowAssign[i] = j;
        colAssign[j] = i;
        break;
      }
    }
  }

  // Mark unassigned rows; from there mark cols having zeros in marked rows; from those cols mark assigned rows.
  const markedRows = new Set<number>();
  const markedCols = new Set<number>();
  for (let i = 0; i < n; i++) if (rowAssign[i] === -1) markedRows.add(i);
  let changed = true;
  while (changed) {
    changed = false;
    for (const i of markedRows) {
      for (let j = 0; j < n; j++) {
        if (m[i][j] === 0 && !markedCols.has(j)) {
          markedCols.add(j);
          changed = true;
        }
      }
    }
    for (const j of markedCols) {
      const i = colAssign[j];
      if (i !== -1 && !markedRows.has(i)) {
        markedRows.add(i);
        changed = true;
      }
    }
  }
  // Lines: unmarked rows + marked cols
  const rowCover: number[] = [];
  for (let i = 0; i < n; i++) if (!markedRows.has(i)) rowCover.push(i);
  const colCover: number[] = Array.from(markedCols).sort((a, b) => a - b);
  return { rowCover, colCover, lines: rowCover.length + colCover.length };
}

// Find a perfect assignment in a matrix where zeros indicate allowed pairs.
function findAssignment(m: number[][]): number[] {
  const n = m.length;
  const result = new Array(n).fill(-1);
  const colUsed = new Array(n).fill(false);

  const tryAssign = (i: number, visited: boolean[]): boolean => {
    for (let j = 0; j < n; j++) {
      if (m[i][j] === 0 && !visited[j]) {
        visited[j] = true;
        if (result.indexOf(j) === -1 || tryAssign(result.indexOf(j), visited)) {
          result[i] = j;
          colUsed[j] = true;
          return true;
        }
      }
    }
    return false;
  };

  // First pass: rows with single zero
  for (let i = 0; i < n; i++) tryAssign(i, new Array(n).fill(false));
  return result;
}
