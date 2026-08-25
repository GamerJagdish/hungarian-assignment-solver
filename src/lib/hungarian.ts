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

const EPS = 1e-9;
const isZero = (v: number) => Math.abs(v) < EPS;
const cleanNum = (v: number) => (Math.abs(v) < EPS ? 0 : Math.round(v * 1e9) / 1e9);
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
      if (i < originalRows && j < originalCols) row.push(cleanNum(input[i][j]));
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
    if (min > 0) {
      for (let j = 0; j < n; j++) m[i][j] = cleanNum(m[i][j] - min);
    }
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
    if (min > 0) {
      for (let i = 0; i < n; i++) m[i][j] = cleanNum(m[i][j] - min);
    }
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
      description: `Cover all zeros using ${lines} line${lines === 1 ? "" : "s"} (rows: ${rowCover.length ? rowCover.map((r) => r + 1).join(", ") : "none"}; cols: ${colCover.length ? colCover.map((c) => c + 1).join(", ") : "none"}). Lines < ${n}, so adjust: subtract ${minUncovered} from uncovered elements and add it to doubly-covered elements.`,
      matrix: clone(m),
      highlight: { rows: rowCover, cols: colCover },
    });
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const rc = rowCover.includes(i);
        const cc = colCover.includes(j);
        if (!rc && !cc) m[i][j] = cleanNum(m[i][j] - minUncovered);
        else if (rc && cc) m[i][j] = cleanNum(m[i][j] + minUncovered);
      }
    }
  }

  // Final assignment via augmenting paths on zero entries
  const assignment = findAssignment(m);
  const result: { row: number; col: number; cost: number; isDummy: boolean }[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const j = assignment[i];
    const isDummy = i >= originalRows || j >= originalCols;
    const cost = isDummy ? 0 : input[i][j];
    if (!isDummy) total = cleanNum(total + cost);
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

// Cover all zeros with minimum number of horizontal/vertical lines using König's theorem.
function coverZeros(m: number[][]): { rowCover: number[]; colCover: number[]; lines: number } {
  const n = m.length;
  // Maximum bipartite matching on zero entries
  const rowAssign = findAssignment(m);
  const colAssign = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    if (rowAssign[i] !== -1) {
      colAssign[rowAssign[i]] = i;
    }
  }

  // Mark unassigned rows; from there mark cols having zeros in marked rows; from those cols mark assigned rows.
  const markedRows = new Set<number>();
  const markedCols = new Set<number>();
  for (let i = 0; i < n; i++) {
    if (rowAssign[i] === -1) markedRows.add(i);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const i of markedRows) {
      for (let j = 0; j < n; j++) {
        if (isZero(m[i][j]) && !markedCols.has(j)) {
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
  for (let i = 0; i < n; i++) {
    if (!markedRows.has(i)) rowCover.push(i);
  }
  const colCover: number[] = Array.from(markedCols).sort((a, b) => a - b);
  return { rowCover, colCover, lines: rowCover.length + colCover.length };
}

// Find a maximum bipartite matching in a matrix where zeros indicate allowed edges (Kuhn's algorithm).
function findAssignment(m: number[][]): number[] {
  const n = m.length;
  const result = new Array(n).fill(-1);

  const tryAssign = (i: number, visited: boolean[]): boolean => {
    for (let j = 0; j < n; j++) {
      if (isZero(m[i][j]) && !visited[j]) {
        visited[j] = true;
        const owner = result.indexOf(j);
        if (owner === -1 || tryAssign(owner, visited)) {
          result[i] = j;
          return true;
        }
      }
    }
    return false;
  };

  for (let i = 0; i < n; i++) {
    tryAssign(i, new Array(n).fill(false));
  }
  return result;
}
