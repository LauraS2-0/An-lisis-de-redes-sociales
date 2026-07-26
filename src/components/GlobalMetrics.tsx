import React from "react";
import { GraphNode, GraphEdge, GlobalMetricsType } from "../types";
import {
  computeGlobalMetrics,
  getAdjacencyList,
  getConnectedComponents,
  getBridgeEdges,
  checkIsBridgeNode,
} from "../utils/graphAlgorithms";

interface GlobalMetricsProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (nodeId: string) => void;
  onSwitchToGraphTab: () => void;
}

export default function GlobalMetrics({
  nodes,
  edges,
  onSelectNode,
  onSwitchToGraphTab,
}: GlobalMetricsProps) {
  const metrics = computeGlobalMetrics(nodes, edges);
  const adj = getAdjacencyList(nodes, edges);
  const components = getConnectedComponents(nodes, adj);


  const bridgeNodes = nodes.filter((n) =>
    checkIsBridgeNode(n.id, nodes, edges, components.length)
  );



  const bridgeEdges = getBridgeEdges(nodes, edges);


  const sortedNodesByDegree = [...nodes]
    .map((node) => ({
      ...node,
      degree: adj.get(node.id)?.length || 0,
    }))
    .sort((a, b) => b.degree - a.degree);

  const handleExportConsolidatedReport = (format: "txt" | "json") => {
    if (nodes.length === 0) {
      alert("No hay datos en la red para exportar.");
      return;
    }

    
    const nodeDetails = nodes.map((node) => {
      const neighbors = adj.get(node.id) || [];
      const neighborNames = neighbors.map(id => nodes.find(n => n.id === id)?.name || id);
      
      
      const distances: Record<string, number> = { [node.id]: 0 };
      const queue = [node.id];
      let maxDist = 0;
      
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const currDist = distances[curr];
        const currNeighbors = adj.get(curr) || [];
        for (const nbrId of currNeighbors) {
          if (distances[nbrId] === undefined) {
            distances[nbrId] = currDist + 1;
            maxDist = Math.max(maxDist, currDist + 1);
            queue.push(nbrId);
          }
        }
      }
      
      const isConnectedToAll = nodes.every(n => distances[n.id] !== undefined);

      return {
        id: node.id,
        name: node.name,
        group: node.group,
        degree: neighbors.length,
        eccentricity: isConnectedToAll ? maxDist : `${maxDist} (Subgrupo)`,
        neighbors: neighborNames,
      };
    });

    if (format === "json") {
      const report = {
        metadata: {
          title: "Informe Consolidado de la Red Social",
          generatedAt: new Date().toLocaleString(),
          summary: {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            density: metrics.density,
            componentsCount: metrics.componentsCount,
            averageDegree: metrics.averageDegree,
            diameter: metrics.diameter === Infinity ? "Infinito (Red Disconexa)" : metrics.diameter,
            radius: metrics.radius === Infinity ? "Infinito" : metrics.radius,
            bridgeNodesCount: bridgeNodes.length,
            bridgeEdgesCount: bridgeEdges.length,
          }
        },
        nodes: nodeDetails,
        edges: edges.map(e => ({
          id: e.id,
          source: nodes.find(n => n.id === e.source)?.name || e.source,
          target: nodes.find(n => n.id === e.target)?.name || e.target,
        })),
        components: components.map((comp, idx) => ({
          componentId: idx + 1,
          nodesCount: comp.length,
          nodes: comp.map(id => nodes.find(n => n.id === id)?.name || id),
        })),
        criticalElements: {
          bridgeNodes: bridgeNodes.map(n => n.name),
          bridgeEdges: bridgeEdges.map(e => ({
            source: nodes.find(n => n.id === e.source)?.name || e.source,
            target: nodes.find(n => n.id === e.target)?.name || e.target,
          })),
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `informe_red_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      // Formato Ejecutivo de Texto / Markdown
      let md = `========================================================================
INFORME CONSOLIDADO DE LA RED SOCIAL DE COMUNICACIÓN
========================================================================
Generado el: ${new Date().toLocaleString()}
Autor/Email de Consulta: lcastroam@unal.edu.co

------------------------------------------------------------------------
1. METRICAS ESTRUCTURALES GLOBALES
------------------------------------------------------------------------
* Total de Personas (Nodos, |V|): ${nodes.length}
* Total de Conexiones (Enlaces, |E|): ${edges.length}
* Densidad de la Red: ${metrics.density} (Proporción de enlaces reales / posibles)
* Componentes Conexas: ${metrics.componentsCount} subgrupo(s) aislado(s)
* Grado Promedio: ${metrics.averageDegree} (Promedio de contactos directos por persona)
* Diámetro de la Red: ${metrics.diameter === Infinity ? "Infinito (La red es disconexa y tiene grupos aislados)" : `${metrics.diameter} saltos`}
* Radio de la Red: ${metrics.radius === Infinity ? "Infinito" : `${metrics.radius} saltos`}

------------------------------------------------------------------------
2. ELEMENTOS CRÍTICOS Y VULNERABILIDADES (PUENTES)
------------------------------------------------------------------------
Los elementos puente son fundamentales para la cohesión del sistema de comunicación.
Su eliminación rompe o fragmenta la red en subgrupos incomunicados.

* Nodos de Articulación (Nodos Puente) [Cantidad: ${bridgeNodes.length}]:
${bridgeNodes.length === 0 ? "  - Ninguno detectado." : bridgeNodes.map(n => `  • ${n.name} (${n.group})`).join("\n")}

* Enlaces Críticos (Bridges / Puentes) [Cantidad: ${bridgeEdges.length}]:
${bridgeEdges.length === 0 ? "  - Ninguno detectado." : bridgeEdges.map(e => {
        const s = nodes.find(n => n.id === e.source)?.name;
        const t = nodes.find(n => n.id === e.target)?.name;
        return `  • Conexión: ${s} ↔ ${t}`;
      }).join("\n")}

------------------------------------------------------------------------
3. ANÁLISIS POR COMPONENTE CONEXA
------------------------------------------------------------------------
La red se subdivide en ${components.length} subgrafo(s) aislado(s) de comunicación:

${components.map((comp, idx) => {
        const names = comp.map(id => nodes.find(n => n.id === id)?.name || id);
        return `Subgrupo #${idx + 1} (${comp.length} personas):
  Integrantes: ${names.join(", ")}`;
      }).join("\n\n")}

------------------------------------------------------------------------
4. RANKING DE GRADO Y EXCENTRICIDAD INDIVIDUAL
------------------------------------------------------------------------
Detalle completo de cada persona en la red social de comunicación,
ordenados por conectividad (Grado descendente):

${nodeDetails.map((node, idx) => {
        return `${idx + 1}. ${node.name.toUpperCase()}
   - Grupo: ${node.group}
   - Contactos Directos (Grado): ${node.degree}
   - Excentricidad: ${node.eccentricity}
   - Vecinos Directos: ${node.neighbors.length === 0 ? "Ninguno" : node.neighbors.join(", ")}`;
      }).join("\n\n")}

========================================================================
Fin del Informe Consolidado de la Red.
========================================================================
`;

      const blob = new Blob([md], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `informe_consolidado_red_${Date.now()}.txt`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-lg overflow-y-auto h-full max-w-5xl mx-auto space-y-lg" id="global-metrics-tab">
      {/* Header card with statistics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-outline-variant pb-md gap-md">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-primary">Análisis de Estructura Global</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Métricas de teoría de grafos discretos calculadas en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm mt-sm md:mt-0">
          <span className="font-label-mono text-label-mono bg-secondary-container text-on-secondary-container px-3 py-1 rounded">
            {nodes.length} Nodos (V)
          </span>
          <span className="font-label-mono text-label-mono bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded">
            {edges.length} Enlaces (E)
          </span>
          <button
            onClick={() => handleExportConsolidatedReport("txt")}
            className="flex items-center gap-xs px-3 py-1.5 bg-primary text-on-primary hover:bg-primary/90 rounded text-xs font-semibold shadow-sm transition-all active:scale-95 duration-100 cursor-pointer"
            title="Exportar informe en formato de texto legible"
            id="btn-export-report-txt"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar Informe TXT
          </button>
          <button
            onClick={() => handleExportConsolidatedReport("json")}
            className="flex items-center gap-xs px-3 py-1.5 border border-primary text-primary hover:bg-primary/5 rounded text-xs font-semibold shadow-sm transition-all active:scale-95 duration-100 cursor-pointer"
            id="btn-export-report-json"
          >
            <span className="material-symbols-outlined text-sm">code</span>
            Exportar JSON
          </button>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Metric 1 */}
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <span className="font-label-mono text-label-mono text-outline uppercase block mb-xs">Densidad de la Red</span>
          <div className="flex items-baseline gap-sm mb-xs">
            <span className="font-display-lg text-headline-md font-bold text-primary">{metrics.density}</span>
            <span className="text-xs text-on-surface-variant">/ 1.00 max</span>
          </div>
          <p className="text-xs text-on-surface-variant font-body-sm">
            Fórmula: <code className="font-mono text-primary">2|E| / (|V|(|V|-1))</code>. Mide la proporción de conexiones reales contra las posibles.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <span className="font-label-mono text-label-mono text-outline uppercase block mb-xs">Componentes Conexas</span>
          <div className="flex items-baseline gap-sm mb-xs">
            <span className="font-display-lg text-headline-md font-bold text-primary">{metrics.componentsCount}</span>
            <span className="text-xs text-on-surface-variant">grupo(s)</span>
          </div>
          <p className="text-xs text-on-surface-variant font-body-sm">
            Subgrafos en los que cualquier par de nodos está conectado por un camino. Indica la fragmentación de la red.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <span className="font-label-mono text-label-mono text-outline uppercase block mb-xs">Grado Promedio</span>
          <div className="flex items-baseline gap-sm mb-xs">
            <span className="font-display-lg text-headline-md font-bold text-primary">{metrics.averageDegree}</span>
            <span className="text-xs text-on-surface-variant">vecinos</span>
          </div>
          <p className="text-xs text-on-surface-variant font-body-sm">
            Fórmula: <code className="font-mono text-primary">2|E| / |V|</code>. El número promedio de conexiones directas que tiene un nodo.
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <span className="font-label-mono text-label-mono text-outline uppercase block mb-xs">Diámetro de la Red</span>
          <div className="flex items-baseline gap-sm mb-xs">
            <span className="font-display-lg text-headline-md font-bold text-primary">
              {metrics.diameter === Infinity || metrics.diameter === 0 ? "N/A" : metrics.diameter}
            </span>
            <span className="text-xs text-on-surface-variant">saltos</span>
          </div>
          <p className="text-xs text-on-surface-variant font-body-sm">
            La mayor distancia de camino mínimo entre cualquier par de nodos conectados en la red.
          </p>
        </div>

        {/* Metric 5 */}
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <span className="font-label-mono text-label-mono text-outline uppercase block mb-xs">Radio (Cesta Central)</span>
          <div className="flex items-baseline gap-sm mb-xs">
            <span className="font-display-lg text-headline-md font-bold text-primary">
              {metrics.radius === Infinity || metrics.radius === 0 ? "N/A" : metrics.radius}
            </span>
            <span className="text-xs text-on-surface-variant">saltos</span>
          </div>
          <p className="text-xs text-on-surface-variant font-body-sm">
            La excentricidad mínima de los nodos en la red.
          </p>
        </div>

        {/* Metric 6 */}
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <span className="font-label-mono text-label-mono text-outline uppercase block mb-xs">Puntos Críticos de Enlace</span>
          <div className="flex items-baseline gap-sm mb-xs">
            <span className="font-display-lg text-headline-md font-bold text-tertiary">
              {bridgeNodes.length + bridgeEdges.length}
            </span>
            <span className="text-xs text-on-surface-variant">puntos vulnerables</span>
          </div>
          <p className="text-xs text-on-surface-variant font-body-sm">
            Nodos corte y enlaces puente cuya eliminación desconecta o fragmenta el grafo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {/* Bridge elements detail card */}
        <div className="bg-surface p-md rounded-lg border border-outline-variant space-y-md">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">Elementos Puente Críticos</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Puntos débiles de la red de comunicación. Su fallo rompe la cohesión del grupo:
          </p>

          <div className="space-y-sm">
            <h4 className="font-label-mono text-label-mono text-outline uppercase">Nodos Puente (Puntos de Articulación)</h4>
            {bridgeNodes.length === 0 ? (
              <p className="text-xs italic text-on-surface-variant">Ningún nodo actúa como puente exclusivo en este grafo.</p>
            ) : (
              <div className="flex flex-wrap gap-xs">
                {bridgeNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onSelectNode(n.id);
                      onSwitchToGraphTab();
                    }}
                    className="px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary/10 rounded font-body-sm text-body-sm hover:brightness-95 transition-all text-left"
                  >
                    ⚠️ {n.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-sm pt-sm">
            <h4 className="font-label-mono text-label-mono text-outline uppercase">Enlaces Puente (Bridges)</h4>
            {bridgeEdges.length === 0 ? (
              <p className="text-xs italic text-on-surface-variant">Ningún enlace actúa como puente crítico en este grafo.</p>
            ) : (
              <div className="grid grid-cols-2 gap-xs">
                {bridgeEdges.map((e) => {
                  const sNode = nodes.find((n) => n.id === e.source);
                  const tNode = nodes.find((n) => n.id === e.target);
                  return (
                    <div
                      key={e.id}
                      className="p-sm bg-surface-container rounded border border-outline-variant font-mono text-xs flex items-center justify-between"
                    >
                      <span>{sNode?.name} ↔️ {tNode?.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Degree distribution rank */}
        <div className="bg-surface p-md rounded-lg border border-outline-variant space-y-md">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">Ranking de Grado (Conectividad)</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Nodos ordenados por cantidad de conexiones directas (Grado):
          </p>

          <div className="space-y-sm max-h-[250px] overflow-y-auto pr-sm">
            {sortedNodesByDegree.map((node, idx) => {
              const maxDegree = nodes.length - 1;
              const percent = maxDegree > 0 ? (node.degree / maxDegree) * 100 : 0;

              return (
                <div
                  key={node.id}
                  onClick={() => {
                    onSelectNode(node.id);
                    onSwitchToGraphTab();
                  }}
                  className="flex items-center gap-md hover:bg-surface-container p-sm rounded cursor-pointer transition-colors"
                >
                  <span className="font-mono text-xs text-outline w-6 text-right">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">{node.name}</span>
                      <span className="font-mono text-xs text-primary font-bold">{node.degree} conex.</span>
                    </div>
                    {/* Visual Bar representation */}
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
