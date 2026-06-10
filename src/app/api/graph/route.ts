import { NextResponse } from "next/server";

// CORS Headers configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

interface Edge {
  parent: string;
  child: string;
}

interface Hierarchy {
  root: string;
  tree: Record<string, any>;
  depth?: number;
  has_cycle?: boolean;
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { edges } = body;

    if (!edges || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: "Missing or invalid 'edges' array in request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const invalid_entries: string[] = [];
    const duplicate_edges: string[] = [];
    const seenEdges = new Set<string>();
    const uniqueEdges: Edge[] = [];

    // 1. Validation and Duplicate Filtering
    for (const rawEdge of edges) {
      if (typeof rawEdge !== "string") {
        invalid_entries.push(String(rawEdge));
        continue;
      }

      const trimmedEdge = rawEdge.trim();
      
      // Node validation format: X->Y where X and Y are uppercase A-Z
      const match = trimmedEdge.match(/^([A-Z])->([A-Z])$/);
      if (!match) {
        invalid_entries.push(rawEdge);
        continue;
      }

      const parent = match[1];
      const child = match[2];

      // Self-loops treated as invalid
      if (parent === child) {
        invalid_entries.push(rawEdge);
        continue;
      }

      // Duplicate detection
      const edgeKey = `${parent}->${child}`;
      if (seenEdges.has(edgeKey)) {
        if (!duplicate_edges.includes(edgeKey)) {
          duplicate_edges.push(edgeKey);
        }
      } else {
        seenEdges.add(edgeKey);
        uniqueEdges.push({ parent, child });
      }
    }

    // 2. Multi-Parent Resolution (First-encountered parent wins)
    const childToParent = new Map<string, string>();
    const activeEdges: Edge[] = [];

    for (const edge of uniqueEdges) {
      if (childToParent.has(edge.child)) {
        // Silently discard subsequent parent edges for this child
        continue;
      }
      childToParent.set(edge.child, edge.parent);
      activeEdges.push(edge);
    }

    // Get all unique nodes in active edges
    const allNodes = new Set<string>();
    for (const edge of activeEdges) {
      allNodes.add(edge.parent);
      allNodes.add(edge.child);
    }

    // Build undirected adjacency list for finding connected components
    const adj = new Map<string, string[]>();
    for (const node of allNodes) {
      adj.set(node, []);
    }
    for (const edge of activeEdges) {
      adj.get(edge.parent)!.push(edge.child);
      adj.get(edge.child)!.push(edge.parent);
    }

    // 3. Find Connected Components
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const node of allNodes) {
      if (!visited.has(node)) {
        const component: string[] = [];
        const queue = [node];
        visited.add(node);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          component.push(curr);
          for (const neighbor of adj.get(curr) || []) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
        components.push(component);
      }
    }

    // Sort components by first appearance of any node in the component in original edges
    const getNodeFirstIndex = (node: string): number => {
      for (let i = 0; i < edges.length; i++) {
        const edgeStr = edges[i];
        if (typeof edgeStr === "string") {
          const trimmed = edgeStr.trim();
          if (trimmed.includes(node)) {
            return i;
          }
        }
      }
      return Infinity;
    };

    components.sort((a, b) => {
      const minA = Math.min(...a.map(getNodeFirstIndex));
      const minB = Math.min(...b.map(getNodeFirstIndex));
      return minA - minB;
    });

    // 4. Process Each Component into hierarchies
    const hierarchies: Hierarchy[] = [];
    let total_trees = 0;
    let total_cycles = 0;
    let maxDepth = -1;
    let largestTreeRoot = "";

    // Helper: Recursively build the tree output
    const buildTreeObj = (node: string): Record<string, any> => {
      const tree: Record<string, any> = {};
      const children = activeEdges
        .filter((e) => e.parent === node)
        .map((e) => e.child)
        .sort();

      for (const child of children) {
        tree[child] = buildTreeObj(child);
      }
      return tree;
    };

    // Helper: Calculate tree depth
    const calculateDepth = (node: string): number => {
      const children = activeEdges
        .filter((e) => e.parent === node)
        .map((e) => e.child);

      if (children.length === 0) return 1;
      return 1 + Math.max(...children.map((c) => calculateDepth(c)));
    };

    for (const comp of components) {
      // Find root candidates (nodes in this component with no parent in the component/globally)
      const roots = comp.filter((node) => !childToParent.has(node));

      if (roots.length > 0) {
        // Unique root found for tree component
        const root = roots[0]; // (Since we resolved multi-parents, there is at most one root)
        const depth = calculateDepth(root);
        const treeStructure = buildTreeObj(root);

        hierarchies.push({
          root,
          tree: { [root]: treeStructure },
          depth,
        });

        total_trees++;

        // Update largest tree details (tiebreaker: lexicographically smaller root)
        if (depth > maxDepth) {
          maxDepth = depth;
          largestTreeRoot = root;
        } else if (depth === maxDepth) {
          if (!largestTreeRoot || root < largestTreeRoot) {
            largestTreeRoot = root;
          }
        }
      } else {
        // Cycle detected: all nodes have a parent
        // Use lexicographically smallest node in component as root
        const root = [...comp].sort()[0];
        hierarchies.push({
          root,
          tree: {},
          has_cycle: true,
        });
        total_cycles++;
      }
    }

    // 5. Build Final Response
    const responsePayload = {
      user_id: process.env.NEXT_PUBLIC_USER_ID || "yudhveer_20030101",
      email_id: process.env.NEXT_PUBLIC_EMAIL_ID || "yudhveer@university.edu",
      enrollment_number: process.env.NEXT_PUBLIC_ENROLLMENT_NUMBER || "22BCE1001",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root: largestTreeRoot || null,
      },
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
