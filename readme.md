# Hungarian Method Solver - Assignment Problem

An interactive, step-by-step solver for linear assignment problems (minimization) using the **Hungarian Algorithm** (Kuhn–Munkres algorithm). Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**, powered by **Bun**.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.4-FBF0DF?logo=bun&logoColor=black)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)


## Why?

My friend was doing Hungarian problems and needed a method to quickly double check his answers the AI assistants failed to do it mainly because of their ability to think deeper so they would hallucinate a lot. So I used AI to instead write the algorithm which it does better than solving math issues. It's a vibe coded app made with [Lovable](https://lovable.dev/) and a bit of my personal touch nothing more.

## Features

- **Step-by-Step Visualization** - Detailed walkthrough of each step of the Hungarian algorithm with colored matrix highlighting:
  - Row Reduction (subtract row minimums)
  - Column Reduction (subtract column minimums)
  - Minimum Covering Lines (lines covering all zeros)
  - Matrix Shift / Adjustments (for sub-optimal states)
  - Final Optimal Assignment & Minimum Cost
- **Dynamic Matrix Sizing** - Configure rectangular and square matrices from $2 \times 2$ up to $10 \times 10$ (Jobs $\times$ Employees).
- **Batch Paste Support** - Copy tabular data from Excel, Google Sheets, or space/tab-delimited text and paste into any cell to auto-fill the matrix.
- **Pure Client-Side Math** - Fast execution running entirely in the browser with zero backend requirements.
- **Dark & Light Mode** - Theme toggle with automatic system preference detection and localStorage persistence.
- **One-Click Actions** - Load preset example matrices, clear all inputs, or copy formatted matrix data to the clipboard.
- **Responsive & Accessible** - Clean, modern interface designed with semantic HTML and accessible controls.


## How It Works

The **Hungarian Method** (also known as the Munkres algorithm or Kuhn–Munkres algorithm) is a combinatorial optimization algorithm that solves the assignment problem in polynomial time:

1. **Row Reduction**: Subtract the minimum value of each row from all elements in that row.
2. **Column Reduction**: Subtract the minimum value of each column from all elements in that column.
3. **Covering Zeros**: Find the minimum number of horizontal and vertical lines needed to cover all zeros in the matrix.
4. **Optimality Check**:
   - If the number of lines equals $N$ (the size of the matrix), an optimal assignment is possible.
   - If fewer lines are needed, find the smallest uncovered element, subtract it from all uncovered elements, and add it to elements at line intersections. Repeat Step 3.
5. **Optimal Assignment**: Assign jobs to employees uniquely such that the sum of costs is minimized.


## Getting Started

### Prerequisites

- [**Bun**](https://bun.sh) (v1.0 or higher recommended)

```bash
# Verify Bun installation
bun --version
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/GamerJagdish/hungarian-assignment-solver.git
   cd hungarian-assignment-solver
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Start the local development server:

   ```bash
   bun run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.


## Available Scripts

| Command           | Description                                                               |
| :---------------- | :------------------------------------------------------------------------ |
| `bun run dev`     | Starts the Vite development server with Hot Module Replacement (HMR)      |
| `bun run build`   | Compiles TypeScript and creates an optimized production bundle in `dist/` |
| `bun run preview` | Locally previews the production build                                     |
| `bun run lint`    | Runs ESLint to check code quality and rules                               |
| `bun run format`  | Formats all code files using Prettier                                     |


## Project Structure

```text
assignment-solver/
├── public/               # Static assets & Open Graph images
│   ├── og-image.png
│   └── robots.txt
├── src/
│   ├── lib/
│   │   ├── hungarian.ts  # Hungarian algorithm implementation (pure TypeScript)
│   │   └── utils.ts      # Class merging & utility functions
│   ├── App.tsx           # Main application UI & state management
│   ├── main.tsx          # React 19 application entry point
│   └── styles.css        # Tailwind CSS v4 tokens & theme definitions
├── index.html            # Vite HTML entry with SEO & meta tags
├── package.json          # Project dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration with Tailwind & React plugins
└── LICENSE               # MIT License
```


## Contributing

Contributions, issues, and feature requests are welcome:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.


## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
