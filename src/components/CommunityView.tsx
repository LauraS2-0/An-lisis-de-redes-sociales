import React, { useState } from "react";
import { GraphNode, GraphEdge } from "../types";
import { getAdjacencyList, getConnectedComponents } from "../utils/graphAlgorithms";

interface CommunityViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (nodeId: string) => void;
  onSwitchToGraphTab: () => void;
  onFilterNodes: (nodeIds: string[] | null, label: string | null) => void;
  activeFilterLabel: string | null;
}

export default function CommunityView({
  nodes,
  edges,
  onSelectNode,
  onSwitchToGraphTab,
  onFilterNodes,
  activeFilterLabel,
}: CommunityViewProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<"components" | "cliques">("components");

  const adj = getAdjacencyList(nodes, edges);

  // Group by Connected Components
  const componentsList = getConnectedComponents(nodes, adj).map((compNodeIds, index) => ({
    name: `Componente Conexa #${index + 1}`,
    nodeIds: compNodeIds,
  }));

  // Detect Cliques (fully connected subgraphs of size >= 3)
  // Simple recursive Bron-Kerbosch algorithm
  const detectCliques = (): string[][] => {
    const cliques: string[][] = [];
    const nList = nodes.map((n) => n.id);

    function bronKerbosch(r: string[], p: string[], x: string[]) {
      if (p.length === 0 && x.length === 0) {
        if (r.length >= 3) {
          cliques.push([...r]);
        }
        return;
      }

      // Choose pivot to speed up
      const pivot = [...p, ...x][0];
      const pivotNeighbors = new Set(adj.get(pivot) || []);

      const candidates = p.filter((v) => !pivotNeighbors.has(v));
      for (const v of candidates) {
        const vNeighbors = new Set(adj.get(v) || []);
        bronKerbosch(
          [...r, v],
          p.filter((u) => vNeighbors.has(u)),
          x.filter((u) => vNeighbors.has(u))
        );
        p = p.filter((u) => u !== v);
        x = [...x, v];
      }
    }

    bronKerbosch([], nList, []);
    // Sort by size descending
    return cliques.sort((a, b) => b.length - a.length);
  };

  const cliquesList = detectCliques().map((cliqueIds, index) => ({
    name: `K${cliqueIds.length} - Clique Cohesivo #${index + 1}`,
    nodeIds: cliqueIds,
  }));

  // Determine active item list
  const currentItems =
    selectedAnalysis === "components"
      ? componentsList
      : cliquesList;

  return (
    <div className="p-lg overflow-y-auto h-full max-w-5xl mx-auto space-y-lg" id="community-tab">
      {/* Sub-header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-outline-variant pb-md">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-primary">Detección de Comunidades y Subgrupos</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Algoritmos discretos para agrupar actores por componentes y subgrafos completos (Cliques).
          </p>
        </div>
        {activeFilterLabel && (
          <button
            onClick={() => onFilterNodes(null, null)}
            className="mt-sm md:mt-0 text-xs px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/10 rounded hover:brightness-95 flex items-center gap-xs cursor-pointer"
          >
            <span>Quitar Filtro: {activeFilterLabel}</span>
            <span className="material-symbols-outlined text-sm font-bold">close</span>
          </button>
        )}
      </div>

      {/* Selector buttons */}
      <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant max-w-md">
        <button
          onClick={() => {
            setSelectedAnalysis("components");
            onFilterNodes(null, null);
          }}
          className={`flex-1 py-2 text-center text-body-sm font-semibold rounded-md transition-all cursor-pointer ${
            selectedAnalysis === "components"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Componentes Conexas
        </button>
        <button
          onClick={() => {
            setSelectedAnalysis("cliques");
            onFilterNodes(null, null);
          }}
          className={`flex-1 py-2 text-center text-body-sm font-semibold rounded-md transition-all cursor-pointer ${
            selectedAnalysis === "cliques"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Análisis de Cliques (K-Cliques)
        </button>
      </div>

      {/* Description of current selection */}
      <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
        {selectedAnalysis === "components" && (
          <p className="text-xs text-on-surface-variant font-body-sm leading-relaxed">
            💡 <strong>Componentes Conexas:</strong> Determina las islas de comunicación del grafo. Si hay más de una componente conexa, significa que existen miembros o agrupaciones completamente aislados entre sí, lo que indica barreras insalvables de flujo de información.
          </p>
        )}
        {selectedAnalysis === "cliques" && (
          <p className="text-xs text-on-surface-variant font-body-sm leading-relaxed">
            💡 <strong>Análisis de Cliques Cohesivos:</strong> En teoría de grafos, un <em>clique</em> es un conjunto de vértices donde todos están conectados mutuamente (un subgrafo completo). Encontrar cliques de tamaño $\ge 3$ destaca burbujas de confianza absoluta y núcleos sociales altamente integrados.
          </p>
        )}
      </div>

      {/* Community Grid */}
      {currentItems.length === 0 ? (
        <div className="p-xl text-center border border-dashed border-outline-variant rounded-lg">
          <p className="text-sm italic text-on-surface-variant">No se encontraron estructuras para este análisis en el grafo actual.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {currentItems.map((item) => {
            const isFilterActive = activeFilterLabel === item.name;

            return (
              <div
                key={item.name}
                className={`p-md rounded-lg border flex flex-col justify-between transition-all ${
                  isFilterActive
                    ? "bg-primary-fixed border-primary shadow-sm"
                    : "bg-surface border-outline-variant hover:border-outline"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-sm">
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">
                      {item.name}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 bg-surface-container text-on-surface font-semibold rounded">
                      {item.nodeIds.length} miembros
                    </span>
                  </div>

                  {/* Nodes listing */}
                  <div className="flex flex-wrap gap-xs mb-md">
                    {item.nodeIds.map((id) => {
                      const node = nodes.find((n) => n.id === id);
                      if (!node) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            onSelectNode(id);
                            onSwitchToGraphTab();
                          }}
                          className="px-2 py-1 bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:border-primary rounded text-xs font-body-sm transition-all"
                        >
                          👤 {node.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-sm mt-auto border-t border-outline-variant/30 pt-sm">
                  <button
                    onClick={() => {
                      if (isFilterActive) {
                        onFilterNodes(null, null);
                      } else {
                        onFilterNodes(item.nodeIds, item.name);
                        onSwitchToGraphTab();
                      }
                    }}
                    className={`text-xs px-3 py-1.5 font-semibold rounded cursor-pointer transition-all ${
                      isFilterActive
                        ? "bg-primary text-on-primary hover:bg-primary-container"
                        : "bg-secondary text-on-secondary hover:brightness-95"
                    }`}
                  >
                    {isFilterActive ? "Quitar Enfoque" : "Ver en el Grafo"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
