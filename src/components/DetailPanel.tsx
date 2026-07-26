import React from "react";
import { GraphNode, GraphEdge } from "../types";
import { computeNodeMetrics, getAdjacencyList, getShortestPaths } from "../utils/graphAlgorithms";

// Safe confirmation that doesn't block or crash inside sandboxed iframes
const safeConfirm = (msg: string): boolean => {
  try {
    const start = performance.now();
    const res = window.confirm(msg);
    const duration = performance.now() - start;
    if (!res && duration < 50) {
      return true;
    }
    return res;
  } catch (e) {
    return true;
  }
};

interface DetailPanelProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onDeleteNode: (id: string) => void;
  onUpdateNode: (id: string, name: string, group: string) => void;
  onDeleteEdge: (id: string) => void;
  isolateActive: boolean;
  onToggleIsolate: () => void;
}

export default function DetailPanel({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onDeleteNode,
  onUpdateNode,
  onDeleteEdge,
  isolateActive,
  onToggleIsolate,
}: DetailPanelProps) {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const metrics = selectedNodeId ? computeNodeMetrics(selectedNodeId, nodes, edges) : null;

  const adj = getAdjacencyList(nodes, edges);
  const shortestPaths = selectedNode ? getShortestPaths(selectedNode.id, adj) : new Map<string, number>();
  const reachableNeighbors = Array.from(shortestPaths.entries())
    .filter(([nodeId]) => nodeId !== selectedNode?.id)
    .map(([nodeId, distance]) => {
      const nodeObj = nodes.find((n) => n.id === nodeId);
      return {
        id: nodeId,
        name: nodeObj ? nodeObj.name : nodeId,
        distance,
      };
    })
    .sort((a, b) => a.distance - b.distance);

  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState("");
  const [editedGroup, setEditedGroup] = React.useState("");

  React.useEffect(() => {
    if (selectedNode) {
      setEditedName(selectedNode.name);
      setEditedGroup(selectedNode.group);
      setIsEditing(false);
    }
  }, [selectedNodeId, selectedNode]);

  const handleExportNodeStats = () => {
    if (!selectedNode || !metrics) return;
    
    const dataStr = 
      `Métrica,Valor\n` +
      `Persona,${selectedNode.name}\n` +
      `Grado de Conectividad,${metrics.degree}\n` +
      `Nivel de Impacto,${metrics.impactLevel}\n` +
      `Nodo Puente,${metrics.isBridgeNode ? "Sí" : "No"}\n` +
      `Tipo de Componente,${metrics.componentType}\n` +
      `Excentricidad,${metrics.eccentricity}\n` +
      `Distancia Promedio,${metrics.averageDistance}\n` +
      `Vecinos,${metrics.neighbors.join("; ")}\n`;
      
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `metricas_${selectedNode.name.toLowerCase().replace(/\s+/g, "_")}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <aside
      className="fixed right-0 top-0 h-full w-panel-width pt-24 bg-surface border-l border-outline-variant flex flex-col p-md gap-sm z-30 overflow-y-auto"
      id="node-detail-panel"
    >
      {!selectedNode || !metrics ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-md space-y-md">
          <span className="material-symbols-outlined text-outline-variant text-5xl">person_search</span>
          <div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">Análisis de Actor</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">
              Haz clic en cualquier nodo o persona del grafo interactivo para inspeccionar sus propiedades discretas.
            </p>
          </div>
        </div>
      ) : isEditing ? (
        <>
          {/* MODO EDICION */}
          <div className="flex justify-between items-start mb-sm">
            <div>
              <span className="font-label-mono text-[10px] bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded uppercase font-semibold">
                Edición de Datos
              </span>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-primary mt-1 animate-fade-in">
                Editar Persona
              </h2>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              title="Cancelar"
              className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">close</span>
            </button>
          </div>

          <div className="bg-surface-container-low rounded-lg p-md border border-outline-variant mb-xs shadow-sm space-y-md">
            <div>
              <label className="font-label-mono text-xs text-outline uppercase block mb-xs font-bold">
                Nombre de la Persona
              </label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full p-2 bg-surface border border-outline rounded text-body-md text-on-surface focus:outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          <div className="mt-auto pt-md flex flex-col gap-sm">
            <button
              onClick={() => {
                if (!editedName.trim()) {
                  alert("El nombre no puede estar vacío.");
                  return;
                }
                onUpdateNode(selectedNode.id, editedName.trim(), editedGroup);
                setIsEditing(false);
              }}
              className="w-full py-md bg-primary text-on-primary hover:bg-primary/90 rounded font-semibold text-body-sm transition-all active:scale-95 duration-150 cursor-pointer flex items-center justify-center gap-xs"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Guardar Cambios
            </button>
            <button
              onClick={() => {
                setEditedName(selectedNode.name);
                setEditedGroup(selectedNode.group);
                setIsEditing(false);
              }}
              className="w-full py-md bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant rounded font-semibold text-body-sm transition-all active:scale-95 duration-150 cursor-pointer flex items-center justify-center gap-xs"
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-start mb-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-primary mt-1">
                Selected Person
              </h2>
              <p className="font-body-md text-body-md font-bold text-on-surface">
                {selectedNode.name}
              </p>
            </div>
            <button
              onClick={() => onSelectNode(null)}
              title="Cerrar Panel"
              className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer flex items-center justify-center"
              id="btn-close-detail"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">close</span>
            </button>
          </div>

          {/* Grado de Conectividad Card */}
          <div className="bg-surface-container-low rounded-lg p-md border border-outline-variant mb-xs shadow-sm">
            <div className="flex flex-col gap-md">
              <div>
                <span className="font-label-mono text-label-mono text-outline uppercase block mb-xs">
                  Grado de Conectividad
                </span>
                <div className="flex items-center gap-sm">
                  <span className="font-headline-md text-headline-md font-bold text-primary">
                    {metrics.degree}
                  </span>
                  <span className={`font-body-sm text-body-sm font-semibold ${
                    metrics.impactLevel === "Alto impacto" 
                      ? "text-rose-700" 
                      : metrics.impactLevel === "Impacto medio"
                      ? "text-secondary"
                      : "text-on-surface-variant"
                  }`}>
                    ({metrics.impactLevel})
                  </span>
                </div>
              </div>

              <div>
                <span className="font-label-mono text-label-mono text-outline uppercase block mb-sm">
                  Vecinos y Distancias (BFS)
                </span>
                {reachableNeighbors.length === 0 ? (
                  <p className="text-xs italic text-on-surface-variant">Esta persona no tiene conexiones registradas.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {reachableNeighbors.map((nbr) => {
                      const nbrNode = nodes.find((n) => n.id === nbr.id);
                      if (!nbrNode) return null;
                      const edgeId = edges.find(
                        (e) =>
                          (e.source === selectedNode.id && e.target === nbr.id) ||
                          (e.source === nbr.id && e.target === selectedNode.id)
                      )?.id;

                      return (
                        <div
                          key={nbr.id}
                          className="flex items-center justify-between bg-primary-fixed text-on-primary-fixed rounded p-2 shadow-sm border border-outline-variant/30 font-body-sm text-body-sm transition-all"
                        >
                          <div className="flex flex-col">
                            <button
                              onClick={() => onSelectNode(nbr.id)}
                              className="font-semibold hover:underline text-left text-primary text-xs"
                              title={`Ir a ${nbr.name}`}
                            >
                              👤 {nbr.name}
                            </button>
                            <span className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                              Distancia: {nbr.distance}
                            </span>
                          </div>
                          {nbr.distance === 1 && edgeId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEdge(edgeId);
                              }}
                              className="px-1.5 py-1 text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors rounded flex items-center justify-center cursor-pointer"
                              title="Eliminar conexión"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">link_off</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table list of Discrete Properties */}
          <div className="space-y-md my-sm">
            <h3 className="font-label-mono text-label-mono text-outline uppercase tracking-wider">
              Propiedades Discretas
            </h3>
            <table className="w-full zebra-table border-separate border-spacing-0 border border-outline-variant/50 rounded overflow-hidden">
              <tbody className="text-body-sm font-body-sm">
                <tr className="border-b border-outline-variant/30">
                  <td className="py-md px-sm text-on-surface-variant">Distancia promedio</td>
                  <td className="py-md px-sm text-right font-semibold font-mono text-xs">
                    {metrics.averageDistance}
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/30">
                  <td className="py-md px-sm text-on-surface-variant">Nodo puente</td>
                  <td className={`py-md px-sm text-right font-semibold ${
                    metrics.isBridgeNode ? "text-error" : ""
                  }`}>
                    {metrics.isBridgeNode ? "Sí (Nodo corte)" : "No"}
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/30">
                  <td className="py-md px-sm text-on-surface-variant">Componentes</td>
                  <td className="py-md px-sm text-right font-semibold text-primary">
                    {metrics.componentType}
                  </td>
                </tr>
                <tr>
                  <td className="py-md px-sm text-on-surface-variant flex items-center gap-1 select-none">
                    Excentricidad
                    <span 
                      className="material-symbols-outlined text-xs text-outline cursor-help"
                      title="Representa la mayor distancia o el número máximo de pasos (conexiones) que separan a esta persona de cualquier otra en su grupo de contactos. Una excentricidad baja significa que la persona está muy cerca de todos los demás."
                    >
                      info
                    </span>
                  </td>
                  <td className="py-md px-sm text-right font-semibold font-mono text-xs">
                    {metrics.eccentricity}
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div className="space-y-sm text-[10px] leading-relaxed text-on-surface-variant/70 italic">
              <p>
                * El <strong>Nodo puente (Cut vertex)</strong> es crítico: si se remueve, desconectará la red en múltiples partes.
              </p>
              <p>
                * La <strong>Excentricidad</strong> representa la mayor distancia o el número máximo de pasos (conexiones) que separan a esta persona de cualquier otra en su grupo de contactos. Una excentricidad baja significa que la persona está muy cerca de todos los demás.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-auto pt-md flex flex-col gap-sm">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-md bg-primary-fixed text-on-primary-fixed hover:bg-primary hover:text-on-primary rounded font-semibold text-body-sm transition-all active:scale-95 duration-150 cursor-pointer flex items-center justify-center gap-xs"
              id="btn-edit-node"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Editar Datos
            </button>

            <button
              onClick={handleExportNodeStats}
              className="w-full py-md border border-primary text-primary hover:bg-primary/5 rounded font-semibold text-body-sm transition-all active:scale-95 duration-150 cursor-pointer flex items-center justify-center gap-xs"
              id="btn-export-stats"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export Statistics
            </button>
            <button
              onClick={onToggleIsolate}
              className={`w-full py-md rounded font-semibold text-body-sm transition-all active:scale-95 duration-150 cursor-pointer flex items-center justify-center gap-xs ${
                isolateActive 
                  ? "bg-tertiary text-on-tertiary hover:opacity-90" 
                  : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant"
              }`}
              id="btn-isolate-subgraph"
            >
              <span className="material-symbols-outlined text-sm">
                {isolateActive ? "visibility" : "visibility_off"}
              </span>
              {isolateActive ? "Show All Nodes" : "Isolate Subgraph"}
            </button>
            
            <button
              onClick={() => {
                if (safeConfirm(`¿Seguro que deseas eliminar a ${selectedNode.name} de la red?`)) {
                  onDeleteNode(selectedNode.id);
                }
              }}
              className="w-full py-md border border-red-300 text-red-600 hover:bg-red-50 rounded font-semibold text-body-sm transition-all active:scale-95 duration-150 cursor-pointer flex items-center justify-center gap-xs mt-2"
              id="btn-delete-node"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Delete from Network
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
