# Bajaj Finserv Health Graph Resolver & Loop Detector

This project is a fully-featured, production-ready implementation for **Round 1 of the Bajaj Finserv Health Dev Challenge**. It compiles a list of directional edges (`Parent->Child`), classifies them into disjoint components, resolves multi-parent relationships, determines path depths, detects cycles, and generates nested tree schemas. 

It contains both a hosted **REST API** (`POST /api/graph`) and an interactive **React Dashboard** built with Next.js (App Router), TypeScript, and Vanilla CSS.

---

## Features

- **Robust REST API (`POST /api/graph`)**:
  - Full CORS configuration enabled.
  - Performance optimized to compile inputs under 3 seconds.
  - Multi-Parent Conflict Resolution (first-encountered parent wins, others silently discarded).
  - Cycle detection using connected component and path traversal analysis.
  - Exact nested output object representation.
  - Live summaries (total tree counts, cycle counts, depth, and lexicographical tiebreaking for the largest tree root).
- **Glassmorphic Frontend**:
  - Dual-panel interface with a modern radial dark gradient theme.
  - Custom font loading (Outfit, Inter) and custom vector icons.
  - One-click testing templates (PDF Sample, Diamond shapes, Cycle shapes, Disjoint trees).
  - Stat counters tracking trees, cycles, and largest root.
  - Live interactive rendering of the tree hierarchies showing connections.
  - Diagnostic summaries displaying exact invalid lines and duplicate entries.
  - Raw JSON accordion view allowing one-click copying of the server payload.

---

## Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (no TailwindCSS, built for speed and custom responsiveness)

---

## Environment Variables

To protect your credentials and avoid hardcoding university identities into a public GitHub repository, we use environment variables. 

Create a `.env.local` file in the root of your project:

```env
NEXT_PUBLIC_USER_ID=yourname_ddmmyyyy
NEXT_PUBLIC_EMAIL_ID=your.name@university.edu
NEXT_PUBLIC_ENROLLMENT_NUMBER=YOUR_ENROLLMENT_NO
```

*If not provided, the application defaults to placeholder values.*

---

## Getting Started

### 1. Installation
Clone the repository, navigate to the folder, and install dependencies:
```bash
npm install
```

### 2. Run Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the dashboard.

---

## API Specification

### Endpoint
`POST /api/graph`

### Content-Type
`application/json`

### Example Request Body
```json
{
  "edges": [
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->"
  ]
}
```

### Example Response Body
```json
{
  "user_id": "yudhveer_20030101",
  "email_id": "yudhveer@university.edu",
  "enrollment_number": "22BCE1001",
  "hierarchies": [
    {
      "root": "A",
      "tree": {
        "A": {
          "B": { "D": {} },
          "C": { "E": { "F": {} } }
        }
      },
      "depth": 4
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    },
    {
      "root": "P",
      "tree": {
        "P": {
          "Q": { "R": {} }
        }
      },
      "depth": 3
    },
    {
      "root": "G",
      "tree": {
        "G": {
          "H": {},
          "I": {}
        }
      },
      "depth": 2
    }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 3,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```
