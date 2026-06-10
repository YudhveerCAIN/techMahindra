"use client";

import { useState } from "react";

// Templates definitions
const TEMPLATES = [
  {
    name: "Sample from PDF",
    description: "Includes trees, a cycle, duplicates, and invalid lines.",
    edges: [
      "A->B", "A->C", "B->D", "C->E", "E->F",
      "X->Y", "Y->Z", "Z->X",
      "P->Q", "Q->R",
      "G->H", "G->H", "G->I",
      "hello", "1->2", "A->"
    ].join("\n")
  },
  {
    name: "Pure Directed Cycle",
    description: "No root available (nodes point back in a loop).",
    edges: ["X->Y", "Y->Z", "Z->X"].join("\n")
  },
  {
    name: "Diamond (Multi-parent)",
    description: "First parent wins, others silently discarded.",
    edges: ["A->B", "A->C", "B->D", "C->D"].join("\n")
  },
  {
    name: "Multiple Disjoint Trees",
    description: "Separate trees processed into different hierarchies.",
    edges: ["A->B", "B->C", "P->Q", "R->S", "S->T"].join("\n")
  }
];

// Recursive component to render tree nodes
function RenderTreeNode({ treeObj }: { treeObj: Record<string, any> }) {
  const childrenKeys = Object.keys(treeObj);
  if (childrenKeys.length === 0) return null;

  return (
    <div className="tree-node-children">
      {childrenKeys.map((childKey) => (
        <div className="tree-node-wrapper" key={childKey}>
          <div className="tree-node-label">
            <svg
              className="w-4 h-4 text-cyan-400"
              style={{ width: "14px", height: "14px", color: "#06b6d4" }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span>{childKey}</span>
          </div>
          {Object.keys(treeObj[childKey]).length > 0 && (
            <RenderTreeNode treeObj={treeObj[childKey]} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [inputText, setInputText] = useState(TEMPLATES[0].edges);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleProcessGraph = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    // Split inputs by newlines, filter empty spaces
    const edges = inputText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    try {
      const response = await fetch("/bfhl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ edges }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setApiResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to contact the API server.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!apiResponse) return;
    navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header Banner */}
      <header
        className="glass"
        style={{
          borderBottom: "1px solid var(--glass-border)",
          padding: "24px 5vw",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #fff 30%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            Bajaj Finserv Health Graph Resolver
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Identify independent trees, detect loops, and build nested schemas from list edges.
          </p>
        </div>
        <div
          className="glass"
          style={{
            padding: "8px 16px",
            borderRadius: "999px",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(139, 92, 246, 0.05)",
            borderColor: "rgba(139, 92, 246, 0.2)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              background: "#10b981",
              borderRadius: "50%",
              display: "inline-block",
            }}
          ></span>
          <span>API: /bfhl</span>
        </div>
      </header>

      {/* Main Panel Content */}
      <section
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "24px",
          padding: "32px 5vw",
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Left Side: Input Form & Templates */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>1. Enter Graph Edges</h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Format: <code style={{ color: "var(--secondary)" }}>Parent-&gt;Child</code>
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="A->B&#10;A->C&#10;B->D..."
              style={{
                width: "100%",
                height: "240px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--glass-border)",
                borderRadius: "12px",
                padding: "16px",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: "0.9rem",
                outline: "none",
                resize: "vertical",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
            />

            <button
              onClick={handleProcessGraph}
              disabled={isLoading}
              className="glow-btn pulse-glow"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    style={{
                      animation: "spin 1s linear infinite",
                      width: "20px",
                      height: "20px",
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      style={{ opacity: 0.25 }}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      style={{ opacity: 0.75 }}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg
                    style={{ width: "20px", height: "20px" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Analyze Graph</span>
                </>
              )}
            </button>
            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>

          {/* Templates Selector */}
          <div
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Test Scenarios / Templates</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(tmpl.edges)}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    textAlign: "left",
                    color: "var(--text-color)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--secondary)";
                    e.currentTarget.style.background = "rgba(6, 182, 212, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--glass-border)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#fff" }}>
                    {tmpl.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {tmpl.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Analysis Results Dashboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {error && (
            <div
              className="glass animate-fade-in"
              style={{
                borderRadius: "12px",
                borderLeft: "4px solid var(--accent)",
                padding: "16px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: "#fff" }}>API Analysis Failed</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {error}
                </div>
              </div>
            </div>
          )}

          {!apiResponse && !isLoading && !error && (
            <div
              className="glass"
              style={{
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                height: "100%",
                borderStyle: "dashed",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                <svg
                  style={{ width: "32px", height: "32px" }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                  Awaiting Input
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    maxWidth: "280px",
                    margin: "8px auto 0",
                  }}
                >
                  Paste your edge list and click "Analyze Graph" to run the hierarchy compiler.
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div
              className="glass"
              style={{
                borderRadius: "16px",
                padding: "40px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                height: "100%",
              }}
            >
              {/* Shimmer skeleton */}
              <div style={{ display: "flex", gap: "16px" }}>
                <div
                  style={{
                    flex: 1,
                    height: "60px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "10px",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: "60px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "10px",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: "60px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "10px",
                    animation: "pulse 1.5s infinite",
                  }}
                />
              </div>
              <div
                style={{
                  height: "220px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "12px",
                  animation: "pulse 1.5s infinite",
                }}
              />
              <style jsx>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 0.3; }
                }
              `}</style>
            </div>
          )}

          {apiResponse && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Stats Counters */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    borderBottom: "3px solid var(--success)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    VALID TREES
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>
                    {apiResponse.summary.total_trees}
                  </div>
                </div>

                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    borderBottom: "3px solid " + (apiResponse.summary.total_cycles > 0 ? "var(--accent)" : "var(--glass-border)"),
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    CYCLE GROUPS
                  </div>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      color: apiResponse.summary.total_cycles > 0 ? varColor("accent") : "#fff",
                      marginTop: "4px",
                    }}
                  >
                    {apiResponse.summary.total_cycles}
                  </div>
                </div>

                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    borderBottom: "3px solid var(--secondary)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    LARGEST ROOT
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>
                    {apiResponse.summary.largest_tree_root || "—"}
                  </div>
                </div>
              </div>

              {/* Hierarchies visual list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>2. Compile Output ({apiResponse.hierarchies.length})</h3>

                {apiResponse.hierarchies.length === 0 ? (
                  <div
                    className="glass"
                    style={{
                      borderRadius: "12px",
                      padding: "24px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    No components found. Add valid edges to generate hierarchies.
                  </div>
                ) : (
                  apiResponse.hierarchies.map((hier: any, index: number) => {
                    const isCycle = !!hier.has_cycle;
                    const rootKey = hier.root;

                    return (
                      <div
                        key={index}
                        className="glass"
                        style={{
                          borderRadius: "12px",
                          overflow: "hidden",
                          borderLeft: `4px solid ${isCycle ? "var(--accent)" : "var(--primary)"}`,
                        }}
                      >
                        {/* Hierarchy Header */}
                        <div
                          style={{
                            padding: "14px 18px",
                            background: "rgba(255, 255, 255, 0.01)",
                            borderBottom: "1px solid var(--glass-border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "4px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                background: isCycle
                                  ? "rgba(244, 63, 94, 0.15)"
                                  : "rgba(139, 92, 246, 0.15)",
                                color: isCycle ? "var(--accent)" : "var(--primary)",
                              }}
                            >
                              {index + 1}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                              {isCycle ? `Cyclic Group (Root: ${rootKey})` : `Hierarchy Tree: ${rootKey}`}
                            </span>
                          </div>

                          {isCycle ? (
                            <span
                              style={{
                                padding: "4px 10px",
                                background: "rgba(244, 63, 94, 0.1)",
                                border: "1px solid rgba(244, 63, 94, 0.2)",
                                borderRadius: "999px",
                                color: "var(--accent)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            >
                              Cycle Detected
                            </span>
                          ) : (
                            <span
                              style={{
                                padding: "4px 10px",
                                background: "rgba(6, 182, 212, 0.1)",
                                border: "1px solid rgba(6, 182, 212, 0.2)",
                                borderRadius: "999px",
                                color: "var(--secondary)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            >
                              Depth: {hier.depth}
                            </span>
                          )}
                        </div>

                        {/* Hierarchy Content */}
                        <div style={{ padding: "20px" }}>
                          {isCycle ? (
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                alignItems: "center",
                                color: "var(--text-muted)",
                                fontSize: "0.85rem",
                                background: "rgba(244, 63, 94, 0.02)",
                                border: "1px solid rgba(244, 63, 94, 0.05)",
                                padding: "12px",
                                borderRadius: "8px",
                              }}
                            >
                              <span style={{ fontSize: "1.2rem" }}>🔁</span>
                              <span>
                                This subgroup forms a loop. Directional root is unavailable. Returning root <strong>{rootKey}</strong> as the lexicographical minimum.
                              </span>
                            </div>
                          ) : (
                            <div className="tree-container">
                              <div className="tree-root-wrapper">
                                <div className="tree-node-wrapper">
                                  <div className="tree-node-label is-root">
                                    <svg
                                      style={{ width: "14px", height: "14px", color: "var(--warning)" }}
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M11.48 3.499c.174-.61 1.04-.61 1.214 0l2.122 7.426h7.79c.636 0 .902.812.389 1.182L16.7 17.228l2.122 7.425c.174.61-.726 1.264-1.214.882l-6.108-4.444-6.108 4.444c-.488.382-1.388-.272-1.214-.882l2.122-7.425-6.289-4.521c-.513-.37-.247-1.182.389-1.182h7.79l2.122-7.426z"
                                      />
                                    </svg>
                                    <span>{rootKey} (Root)</span>
                                  </div>
                                  {Object.keys(hier.tree[rootKey]).length > 0 && (
                                    <RenderTreeNode treeObj={hier.tree[rootKey]} />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Edge analysis stats (Duplicates / Invalid Entries) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                {/* Duplicate Edges */}
                <div className="glass" style={{ borderRadius: "12px", padding: "18px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Duplicate Edges</span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        background:
                          apiResponse.duplicate_edges.length > 0
                            ? "rgba(6, 182, 212, 0.15)"
                            : "rgba(16, 185, 129, 0.15)",
                        color:
                          apiResponse.duplicate_edges.length > 0
                            ? "var(--secondary)"
                            : "var(--success)",
                      }}
                    >
                      {apiResponse.duplicate_edges.length} detected
                    </span>
                  </div>

                  {apiResponse.duplicate_edges.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", gap: "6px" }}>
                      <span>✅</span> No duplicate edges detected.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {apiResponse.duplicate_edges.map((edge: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: "4px 8px",
                            background: "rgba(6, 182, 212, 0.06)",
                            border: "1px solid rgba(6, 182, 212, 0.15)",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {edge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invalid Entries */}
                <div className="glass" style={{ borderRadius: "12px", padding: "18px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Invalid Entries</span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        background:
                          apiResponse.invalid_entries.length > 0
                            ? "rgba(244, 63, 94, 0.15)"
                            : "rgba(16, 185, 129, 0.15)",
                        color:
                          apiResponse.invalid_entries.length > 0
                            ? "var(--accent)"
                            : "var(--success)",
                      }}
                    >
                      {apiResponse.invalid_entries.length} filtered
                    </span>
                  </div>

                  {apiResponse.invalid_entries.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", gap: "6px" }}>
                      <span>✅</span> All input edges are valid.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {apiResponse.invalid_entries.map((ent: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: "4px 8px",
                            background: "rgba(244, 63, 94, 0.06)",
                            border: "1px solid rgba(244, 63, 94, 0.15)",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {ent}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Raw JSON Accordion */}
              <div
                className="glass"
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    background: "rgba(255, 255, 255, 0.01)",
                    border: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  <span>3. Expose Raw API Response Payload</span>
                  <span>{showRawJson ? "▲ Collapse" : "▼ Expand"}</span>
                </button>

                {showRawJson && (
                  <div
                    style={{
                      padding: "18px",
                      background: "rgba(0, 0, 0, 0.4)",
                      borderTop: "1px solid var(--glass-border)",
                      position: "relative",
                    }}
                  >
                    <button
                      onClick={copyToClipboard}
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        padding: "6px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "6px",
                        color: "#fff",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {copySuccess ? "Copied! ✓" : "Copy Payload"}
                    </button>
                    <pre
                      style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        margin: 0,
                      }}
                    >
                      <code>{JSON.stringify(apiResponse, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </section>

      {/* Footer Credentials */}
      <footer
        className="glass"
        style={{
          borderTop: "1px solid var(--glass-border)",
          padding: "20px 5vw",
          marginTop: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
        }}
      >
        <div>
          <span>© 2026 Bajaj Finserv Health Challenge</span>
        </div>
      </footer>
    </main>
  );
}

// Helpers for CSS colors
function varColor(name: string) {
  if (name === "accent") return "#f43f5e";
  return "#fff";
}
