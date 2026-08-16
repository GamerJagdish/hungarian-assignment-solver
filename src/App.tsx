import { useMemo, useState, useEffect, useCallback } from "react";
import { solveHungarian, type Solution } from "@/lib/hungarian";

export default function App() {
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [matrix, setMatrix] = useState<string[][]>(() => makeEmpty(5, 5));
  const [solution, setSolution] = useState<Solution | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Dark mode ──────────────────────────────────────────────────────────────
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // ── Copy matrix ────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = matrix.map((row) => row.map((v) => (v === "" ? "0" : v)).join(" ")).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [matrix]);

  const rowLabels = useMemo(
    () => Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i)),
    [rows],
  );
  const colLabels = useMemo(() => Array.from({ length: cols }, (_, i) => toRoman(i + 1)), [cols]);

  const resize = (r: number, c: number) => {
    const next = makeEmpty(r, c);
    for (let i = 0; i < Math.min(r, matrix.length); i++) {
      for (let j = 0; j < Math.min(c, matrix[0]?.length ?? 0); j++) {
        next[i][j] = matrix[i][j];
      }
    }
    setRows(r);
    setCols(c);
    setMatrix(next);
    setSolution(null);
  };

  const setCell = (i: number, j: number, v: string) => {
    const next = matrix.map((row) => [...row]);
    next[i][j] = v;
    setMatrix(next);
  };

  // Parse a paste payload into numbers and fill the matrix starting at (startRow, startCol).
  const handlePaste = (startRow: number, startCol: number, e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    // Split on any whitespace (spaces, tabs, newlines) and filter empty strings.
    const tokens = text.trim().split(/\s+/).filter(Boolean);
    // Only proceed if there are multiple tokens - single token means normal paste into one cell.
    if (tokens.length <= 1) return;
    e.preventDefault();
    const next = matrix.map((row) => [...row]);
    let pos = startRow * cols + startCol;
    for (const token of tokens) {
      const r = Math.floor(pos / cols);
      const c = pos % cols;
      if (r >= rows) break;
      next[r][c] = token;
      pos++;
    }
    setMatrix(next);
    setSolution(null);
  };

  const handleSolve = () => {
    setError(null);
    const parsed: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        const v = matrix[i][j].trim();
        if (v === "") {
          setError(`Cell ${rowLabels[i]}-${colLabels[j]} is empty.`);
          setSolution(null);
          return;
        }
        const num = Number(v);
        if (!Number.isFinite(num) || num < 0) {
          setError(`Cell ${rowLabels[i]}-${colLabels[j]} must be a non-negative number.`);
          setSolution(null);
          return;
        }
        row.push(num);
      }
      parsed.push(row);
    }
    setSolution(solveHungarian(parsed));
    // Scroll to result
    requestAnimationFrame(() => {
      document.getElementById("solution")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleClear = () => {
    setMatrix(makeEmpty(rows, cols));
    setSolution(null);
    setError(null);
  };

  const handleExample = () => {
    const ex = [
      [10, 5, 13, 15, 16],
      [3, 9, 18, 13, 6],
      [10, 7, 2, 2, 2],
      [7, 11, 9, 7, 12],
      [7, 9, 10, 4, 12],
    ];
    setRows(5);
    setCols(5);
    setMatrix(ex.map((r) => r.map((v) => String(v))));
    setSolution(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Operations Research
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Hungarian Method Solver
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Enter your cost matrix for an assignment problem (minimization). The solver walks
                through each step of the Hungarian algorithm and gives the optimal assignment.
              </p>
            </div>
            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {dark ? (
                // Sun icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                // Moon icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <section aria-labelledby="setup-heading" className="mb-6">
          <h2 id="setup-heading" className="sr-only">
            Matrix setup
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="rows" className="block text-xs font-medium text-muted-foreground">
                Jobs (rows)
              </label>
              <input
                id="rows"
                type="number"
                min={2}
                max={10}
                value={rows}
                onChange={(e) => {
                  const v = Math.max(2, Math.min(10, Number(e.target.value) || 2));
                  resize(v, cols);
                }}
                className="mt-1 h-10 w-24 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="cols" className="block text-xs font-medium text-muted-foreground">
                Employees (cols)
              </label>
              <input
                id="cols"
                type="number"
                min={2}
                max={10}
                value={cols}
                onChange={(e) => {
                  const v = Math.max(2, Math.min(10, Number(e.target.value) || 2));
                  resize(rows, v);
                }}
                className="mt-1 h-10 w-24 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={handleExample}
              className="h-10 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Load example
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-10 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="h-10 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {copied ? "Copied!" : "Copy matrix"}
            </button>
          </div>
        </section>

        <section aria-labelledby="matrix-heading" className="mb-6">
          <h2 id="matrix-heading" className="mb-3 text-sm font-medium text-muted-foreground">
            Cost matrix
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Tip: paste space-separated numbers into any cell to auto-fill the matrix left-to-right,
            row by row.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-max border-collapse text-sm">
              <caption className="sr-only">
                Cost matrix where rows are jobs and columns are employees
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-r border-border bg-muted px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Jobs \ Emp.
                  </th>
                  {colLabels.map((c) => (
                    <th
                      key={c}
                      scope="col"
                      className="border-b border-border bg-muted px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                  <tr key={i}>
                    <th
                      scope="row"
                      className="border-r border-border bg-muted/50 px-3 py-2 text-left text-sm font-semibold"
                    >
                      {rowLabels[i]}
                    </th>
                    {Array.from({ length: cols }).map((_, j) => (
                      <td key={j} className="border-l border-t border-border p-0">
                        <input
                          type="number"
                          inputMode="numeric"
                          aria-label={`Cost for job ${rowLabels[i]} and employee ${colLabels[j]}`}
                          value={matrix[i]?.[j] ?? ""}
                          onChange={(e) => setCell(i, j, e.target.value)}
                          onPaste={(e) => handlePaste(i, j, e)}
                          className="h-11 w-full min-w-[4rem] bg-background px-2 text-center text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring sm:min-w-[5rem]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="mb-12">
          <button
            type="button"
            onClick={handleSolve}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Solve
          </button>
        </div>

        {solution && (
          <section id="solution" aria-labelledby="solution-heading" className="space-y-8">
            <div>
              <h2 id="solution-heading" className="text-xl font-semibold tracking-tight">
                Step-by-step solution
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Following the Hungarian method for minimization.
              </p>
            </div>

            <ol className="space-y-6">
              {solution.steps.map((s, idx) => (
                <li key={idx} className="rounded-lg border border-border p-4 sm:p-5">
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <MatrixView matrix={s.matrix} highlight={s.highlight} />
                  </div>
                </li>
              ))}
            </ol>

            <div className="rounded-lg border border-border bg-muted/40 p-5">
              <h3 className="text-base font-semibold">Optimal assignment</h3>
              <ul className="mt-3 space-y-1.5 text-sm">
                {solution.assignment.map((a) => {
                  const rowLabel = String.fromCharCode(65 + a.row);
                  const colLabel = toRoman(a.col + 1);
                  return (
                    <li key={a.row} className="tabular-nums">
                      <span className="font-medium">
                        {rowLabel} → {colLabel}
                      </span>
                      <span className="text-muted-foreground"> · cost {a.cost}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-sm">
                <span className="font-semibold">Total minimum cost: </span>
                <span className="tabular-nums">{solution.totalCost}</span>
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function MatrixView({
  matrix,
  highlight,
}: {
  matrix: number[][];
  highlight?: { rows?: number[]; cols?: number[]; cells?: [number, number][] };
}) {
  const isCell = (i: number, j: number) =>
    highlight?.cells?.some(([r, c]) => r === i && c === j) ?? false;
  const isRow = (i: number) => highlight?.rows?.includes(i) ?? false;
  const isCol = (j: number) => highlight?.cols?.includes(j) ?? false;

  return (
    <table className="border-collapse text-sm tabular-nums">
      <tbody>
        {matrix.map((row, i) => (
          <tr key={i}>
            {row.map((v, j) => {
              const cellHi = isCell(i, j);
              const lineHi = isRow(i) || isCol(j);
              return (
                <td
                  key={j}
                  className={[
                    "h-10 min-w-[2.5rem] border border-border px-3 text-center",
                    cellHi
                      ? "bg-primary font-semibold text-primary-foreground"
                      : lineHi
                        ? "bg-accent"
                        : v === 0
                          ? "font-semibold"
                          : "",
                  ].join(" ")}
                >
                  {v}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function makeEmpty(r: number, c: number): string[][] {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => ""));
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let s = "";
  for (const [val, sym] of map) {
    while (n >= val) {
      s += sym;
      n -= val;
    }
  }
  return s;
}
