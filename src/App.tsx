import React, { useState, useEffect } from "react";
import { GraphNode, GraphEdge } from "./types";
import { initialNodes, initialEdges } from "./utils/defaultData";
import { computeGlobalMetrics, getAdjacencyList } from "./utils/graphAlgorithms";
import NetworkGraph from "./components/NetworkGraph";
import GlobalMetrics from "./components/GlobalMetrics";
import CommunityView from "./components/CommunityView";
import SettingsPanel from "./components/SettingsPanel";
import DetailPanel from "./components/DetailPanel";

// Safe confirmation that doesn't block or crash inside sandboxed iframes
const safeConfirm = (msg: string): boolean => {
  try {
    const start = performance.now();
    const res = window.confirm(msg);
    const duration = performance.now() - start;
    if (!res && duration < 50) {
      console.warn("[DEBUG safeConfirm] window.confirm was blocked/dismissed by sandbox (returned false in <50ms). Automatically confirming.");
      return true;
    }
    return res;
  } catch (e) {
    return true;
  }
};

export default function App() {
  // Tab State
  const [currentTab, setCurrentTab] = useState<"graph" | "metrics" | "community" | "settings">("graph");

  // Graph Elements State
  const [nodes, setNodes] = useState<GraphNode[]>(() => {
    const saved = localStorage.getItem("social_nodes");
    return saved ? JSON.parse(saved) : initialNodes;
  });

  const [edges, setEdges] = useState<GraphEdge[]>(() => {
    const saved = localStorage.getItem("social_edges");
    return saved ? JSON.parse(saved) : initialEdges;
  });

  // Selected Node State - default to node-a to match startup mockup layout
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node-a");

  // Isolate Subgraph mode state
  const [isolateActive, setIsolateActive] = useState<boolean>(false);

  // Community filtering states
  const [activeFilterNodeIds, setActiveFilterNodeIds] = useState<string[] | null>(null);
  const [activeFilterLabel, setActiveFilterLabel] = useState<string | null>(null);

  // Save state to local storage on changes
  useEffect(() => {
    localStorage.setItem("social_nodes", JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem("social_edges", JSON.stringify(edges));
  }, [edges]);

  // Compute real-time global values for the left sidebar
  const sidebarMetrics = computeGlobalMetrics(nodes, edges);

  // Group counts for the left sidebar
  const getGroupCounts = () => {
    let researchCount = 0;
    let studentsCount = 0;
    nodes.forEach((n) => {
      if (n.group === "Grupo Investigación A") researchCount++;
      if (n.group === "Grupo Estudiantes B") studentsCount++;
    });
    return { researchCount, studentsCount };
  };

  const { researchCount, studentsCount } = getGroupCounts();

  // Handler to update node positions when dragged
  const handleUpdateNodePosition = (id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, x, y } : node))
    );
  };

  // Preset Graph Loaders
  const handleLoadPreset = (presetId: string) => {
    setIsolateActive(false);
    setActiveFilterNodeIds(null);
    setActiveFilterLabel(null);

    if (presetId === "mockup") {
      setNodes(initialNodes);
      setEdges(initialEdges);
      setSelectedNodeId("node-a");
      return;
    }

    // Mathematical Graph Presets
    const presetNodes: GraphNode[] = [];
    const presetEdges: GraphEdge[] = [];

    if (presetId === "star") {
      // Star Graph: 1 central node connected to 9 others
      presetNodes.push({
        id: "star-center",
        name: "Líder Central",
        x: 500,
        y: 400,
        group: "Grupo Investigación A",
      });

      for (let i = 1; i <= 9; i++) {
        const angle = (i * 2 * Math.PI) / 9;
        const radius = 220;
        const x = 500 + radius * Math.cos(angle);
        const y = 400 + radius * Math.sin(angle);
        const id = `star-node-${i}`;

        presetNodes.push({
          id,
          name: `Colaborador ${i}`,
          x: Math.round(x),
          y: Math.round(y),
          group: i % 2 === 0 ? "Grupo Investigación A" : "Grupo Estudiantes B",
        });

        presetEdges.push({
          id: `star-edge-${i}`,
          source: "star-center",
          target: id,
        });
      }
      setSelectedNodeId("star-center");
    } else if (presetId === "cycle") {
      // Cycle Graph: All nodes connected in a single loop (ring)
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count;
        const radius = 220;
        const x = 500 + radius * Math.cos(angle);
        const y = 400 + radius * Math.sin(angle);
        const id = `cycle-node-${i}`;

        presetNodes.push({
          id,
          name: `Miembro Circular ${String.fromCharCode(65 + i)}`,
          x: Math.round(x),
          y: Math.round(y),
          group: i < 4 ? "Grupo Investigación A" : "Grupo Estudiantes B",
        });
      }

      for (let i = 0; i < count; i++) {
        presetEdges.push({
          id: `cycle-edge-${i}`,
          source: `cycle-node-${i}`,
          target: `cycle-node-${(i + 1) % count}`,
        });
      }
      setSelectedNodeId("cycle-node-0");
    } else if (presetId === "complete") {
      // Complete Graph (clique): 6 nodes, all pairs connected
      const count = 6;
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count;
        const radius = 200;
        const x = 500 + radius * Math.cos(angle);
        const y = 400 + radius * Math.sin(angle);
        const id = `complete-node-${i}`;

        presetNodes.push({
          id,
          name: `Actor Clique ${String.fromCharCode(65 + i)}`,
          x: Math.round(x),
          y: Math.round(y),
          group: i % 2 === 0 ? "Grupo Investigación A" : "Grupo Estudiantes B",
        });
      }

      let edgeIdx = 0;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          presetEdges.push({
            id: `complete-edge-${edgeIdx++}`,
            source: `complete-node-${i}`,
            target: `complete-node-${j}`,
          });
        }
      }
      setSelectedNodeId("complete-node-0");
    } else if (presetId === "random") {
      // Erdős-Rényi style random graph: 12 nodes with edge probability p=0.35
      const count = 12;
      for (let i = 0; i < count; i++) {
        // Random layout coordinates that fit nicely in viewport
        const x = 150 + Math.random() * 700;
        const y = 100 + Math.random() * 550;
        const id = `random-node-${i}`;

        presetNodes.push({
          id,
          name: `Individuo ${i + 1}`,
          x: Math.round(x),
          y: Math.round(y),
          group: Math.random() > 0.4 ? "Grupo Estudiantes B" : "Grupo Investigación A",
        });
      }

      let edgeIdx = 0;
      const p = 0.28; // probability
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          if (Math.random() < p) {
            presetEdges.push({
              id: `random-edge-${edgeIdx++}`,
              source: `random-node-${i}`,
              target: `random-node-${j}`,
            });
          }
        }
      }
      setSelectedNodeId(presetNodes[0]?.id || null);
    }

    setNodes(presetNodes);
    setEdges(presetEdges);
  };

  // Node & Edge manipulation handlers
  const handleAddNode = (name: string, group: string) => {
    const id = `custom-node-${Date.now()}`;
    const newNode: GraphNode = {
      id,
      name,
      x: Math.round(200 + Math.random() * 600),
      y: Math.round(150 + Math.random() * 450),
      group,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const handleAddEdge = (sourceId: string, targetId: string) => {
    const id = `edge-${sourceId}-${targetId}`;
    const newEdge: GraphEdge = {
      id,
      source: sourceId,
      target: targetId,
    };
    setEdges((prev) => [...prev, newEdge]);
  };

  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  };

  const handleDeleteEdge = (id: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateNode = (id: string, name: string, group: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, name, group } : n))
    );
  };

  const handleClearGraph = () => {
    if (safeConfirm("¿Seguro que deseas borrar todos los nodos y enlaces del lienzo?")) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setIsolateActive(false);
    }
  };

  // Jitter layout positions for "Recalculate Graph" (animates rearrangement)
  const handleRecalculateGraph = () => {
    setNodes((prev) =>
      prev.map((node) => {
        // Add random displacement up to 40px
        const dx = (Math.random() - 0.5) * 80;
        const dy = (Math.random() - 0.5) * 80;
        return {
          ...node,
          x: Math.max(80, Math.min(920, Math.round(node.x + dx))),
          y: Math.max(80, Math.min(720, Math.round(node.y + dy))),
        };
      })
    );
  };

  // Handle focus on group filter (from left sidebar)
  const handleFilterGroup = (groupName: string) => {
    const filteredIds = nodes.filter((n) => n.group === groupName).map((n) => n.id);
    if (activeFilterLabel === groupName) {
      // Clear filter
      setActiveFilterNodeIds(null);
      setActiveFilterLabel(null);
    } else {
      setActiveFilterNodeIds(filteredIds);
      setActiveFilterLabel(groupName);
      setCurrentTab("graph");
    }
  };

  // Return nodes filtered if active filter is applied
  const getFilteredNodes = (): GraphNode[] => {
    if (!activeFilterNodeIds) return nodes;
    return nodes.filter((n) => activeFilterNodeIds.includes(n.id));
  };

  // Return edges filtered if active filter is applied
  const getFilteredEdges = (): GraphEdge[] => {
    if (!activeFilterNodeIds) return edges;
    return edges.filter(
      (e) => activeFilterNodeIds.includes(e.source) && activeFilterNodeIds.includes(e.target)
    );
  };

  return (
    <div className="bg-background text-on-background h-screen flex flex-col select-none overflow-hidden" id="app-root">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-lg py-md bg-surface border-b border-outline-variant h-16">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-primary text-3xl">hub</span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Analizador de redes sociales
          </h1>
        </div>
        
        {/* Active Filter Indicators */}
        {activeFilterLabel && (
          <div className="hidden lg:flex items-center gap-2 bg-primary-fixed text-on-primary-fixed text-xs px-3 py-1 rounded-full border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span>Enfocado en: <strong>{activeFilterLabel}</strong></span>
            <button
              onClick={() => {
                setActiveFilterNodeIds(null);
                setActiveFilterLabel(null);
              }}
              className="ml-1 font-bold hover:text-red-700 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-center gap-sm">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined text-on-surface-variant absolute left-2.5 top-2 text-sm">search</span>
            <input
              type="text"
              placeholder="Buscar persona..."
              onChange={(e) => {
                const term = e.target.value.toLowerCase();
                const matched = nodes.find((n) => n.name.toLowerCase().includes(term));
                if (matched) {
                  setSelectedNodeId(matched.id);
                  setCurrentTab("graph");
                }
              }}
              className="pl-8 pr-md py-1 bg-surface-container border border-outline-variant rounded font-body-sm text-xs text-on-surface focus:outline-none focus:border-primary w-48"
            />
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center border border-primary/10">
            <span className="text-on-primary-fixed font-bold text-xs">SC</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Left SideNavBar */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-panel-width bg-surface-container-low border-r border-outline-variant flex flex-col p-md gap-sm z-40 overflow-y-auto">
          <div className="mb-md px-2">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">Social Analytics</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Discrete Math Tool</p>
          </div>

          {/* Navigation Buttons */}
          <nav className="flex flex-col gap-xs">
            <button
              onClick={() => setCurrentTab("graph")}
              className={`flex items-center gap-md p-md rounded-lg transition-all duration-200 cursor-pointer text-left ${
                currentTab === "graph"
                  ? "bg-secondary-container text-on-secondary-container font-semibold border-l-4 border-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">hub</span>
              <span className="font-body-sm text-body-sm">Network Graph</span>
            </button>

            <button
              onClick={() => setCurrentTab("metrics")}
              className={`flex items-center gap-md p-md rounded-lg transition-all duration-200 cursor-pointer text-left ${
                currentTab === "metrics"
                  ? "bg-secondary-container text-on-secondary-container font-semibold border-l-4 border-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">analytics</span>
              <span className="font-body-sm text-body-sm">Global Metrics</span>
            </button>

            <button
              onClick={() => setCurrentTab("community")}
              className={`flex items-center gap-md p-md rounded-lg transition-all duration-200 cursor-pointer text-left ${
                currentTab === "community"
                  ? "bg-secondary-container text-on-secondary-container font-semibold border-l-4 border-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">groups</span>
              <span className="font-body-sm text-body-sm">Community View</span>
            </button>

            <button
              onClick={() => setCurrentTab("settings")}
              className={`flex items-center gap-md p-md rounded-lg transition-all duration-200 cursor-pointer text-left ${
                currentTab === "settings"
                  ? "bg-secondary-container text-on-secondary-container font-semibold border-l-4 border-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="font-body-sm text-body-sm">Settings</span>
            </button>
          </nav>

          {/* Bottom Sidebar metrics / indicators exactly mirroring mockup */}
          <div className="mt-auto border-t border-outline-variant pt-md px-2 space-y-md">
            <div>
              <h3 className="font-label-mono text-label-mono text-outline uppercase mb-sm tracking-wider">
                Métricas Globales
              </h3>
              <div className="flex flex-col gap-sm">
                <div className="flex justify-between items-center py-sm border-b border-outline-variant/30">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Densidad</span>
                  <span className="font-label-mono text-label-mono bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded font-bold">
                    {sidebarMetrics.density}
                  </span>
                </div>
                <div className="flex justify-between items-center py-sm border-b border-outline-variant/30">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Componentes</span>
                  <span className="font-label-mono text-label-mono bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded font-bold">
                    {sidebarMetrics.componentsCount}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRecalculateGraph}
              className="w-full py-md bg-primary text-on-primary hover:bg-primary-container rounded font-semibold text-body-sm transition-colors active:scale-95 duration-150 flex items-center justify-center gap-sm cursor-pointer shadow-sm"
              id="btn-recalculate-graph"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Recalculate Graph
            </button>
          </div>
        </aside>

        {/* Center Canvas area */}
        <main className="ml-[320px] mr-[320px] w-[calc(100vw-640px)] h-full bg-surface-container-lowest relative overflow-hidden">
          {currentTab === "graph" && (
            <NetworkGraph
              nodes={getFilteredNodes()}
              edges={getFilteredEdges()}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onUpdateNodePosition={handleUpdateNodePosition}
              isolateActive={isolateActive}
              onToggleIsolate={() => setIsolateActive((v) => !v)}
            />
          )}

          {currentTab === "metrics" && (
            <GlobalMetrics
              nodes={nodes}
              edges={edges}
              onSelectNode={setSelectedNodeId}
              onSwitchToGraphTab={() => setCurrentTab("graph")}
            />
          )}

          {currentTab === "community" && (
            <CommunityView
              nodes={nodes}
              edges={edges}
              onSelectNode={setSelectedNodeId}
              onSwitchToGraphTab={() => setCurrentTab("graph")}
              onFilterNodes={(nodeIds, label) => {
                setActiveFilterNodeIds(nodeIds);
                setActiveFilterLabel(label);
              }}
              activeFilterLabel={activeFilterLabel}
            />
          )}

          {currentTab === "settings" && (
            <SettingsPanel
              nodes={nodes}
              edges={edges}
              onLoadPreset={handleLoadPreset}
              onAddNode={handleAddNode}
              onAddEdge={handleAddEdge}
              onDeleteNode={handleDeleteNode}
              onDeleteEdge={handleDeleteEdge}
              onClearGraph={handleClearGraph}
            />
          )}
        </main>

        {/* Right Node Detail Panel */}
        <DetailPanel
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onDeleteNode={handleDeleteNode}
          onUpdateNode={handleUpdateNode}
          onDeleteEdge={handleDeleteEdge}
          isolateActive={isolateActive}
          onToggleIsolate={() => setIsolateActive((v) => !v)}
        />
      </div>
    </div>
  );
}
