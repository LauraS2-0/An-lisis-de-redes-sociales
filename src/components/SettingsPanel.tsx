import React, { useState } from "react";
import { GraphNode, GraphEdge } from "../types";
import { PRESET_GRAPHS } from "../utils/defaultData";

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

interface SettingsPanelProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onLoadPreset: (presetId: string) => void;
  onAddNode: (name: string, group: string) => void;
  onAddEdge: (sourceId: string, targetId: string) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onClearGraph: () => void;
}

export default function SettingsPanel({
  nodes,
  edges,
  onLoadPreset,
  onAddNode,
  onAddEdge,
  onDeleteNode,
  onDeleteEdge,
  onClearGraph,
}: SettingsPanelProps) {
  // Add node form state
  const [nodeName, setNodeName] = useState("");

  // Add edge form state
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");

  // Validation messages
  const [nodeError, setNodeError] = useState("");
  const [edgeError, setEdgeError] = useState("");
  const [edgeSuccess, setEdgeSuccess] = useState("");

  const handleAddNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNodeError("");

    if (!nodeName.trim()) {
      setNodeError("El nombre no puede estar vacío.");
      return;
    }

    if (nodes.some((n) => n.name.toLowerCase() === nodeName.trim().toLowerCase())) {
      setNodeError("Ya existe una persona con ese nombre.");
      return;
    }

    // Auto-assign group to balance colors internally without user visibility
    const autoGroup = nodes.length % 2 === 0 ? "Grupo Investigación A" : "Grupo Estudiantes B";
    onAddNode(nodeName.trim(), autoGroup);
    setNodeName("");
    setNodeError("");
  };

  const handleAddEdgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEdgeError("");
    setEdgeSuccess("");

    if (!edgeSource || !edgeTarget) {
      setEdgeError("Debes seleccionar dos personas para conectarlas.");
      return;
    }

    if (edgeSource === edgeTarget) {
      setEdgeError("No se pueden crear auto-bucles (conectar a sí mismo).");
      return;
    }

    // Check if edge already exists
    const exists = edges.some(
      (edge) =>
        (edge.source === edgeSource && edge.target === edgeTarget) ||
        (edge.source === edgeTarget && edge.target === edgeSource)
    );

    if (exists) {
      setEdgeError("Ya existe una conexión directa entre estas personas.");
      return;
    }

    onAddEdge(edgeSource, edgeTarget);
    setEdgeSuccess("¡Conexión agregada exitosamente!");
    setEdgeSource("");
    setEdgeTarget("");

    // Clear success message after 3 seconds
    setTimeout(() => setEdgeSuccess(""), 3000);
  };

  return (
    <div className="p-lg overflow-y-auto h-full max-w-4xl mx-auto space-y-lg" id="settings-tab">
      <div className="border-b border-outline-variant pb-md">
        <h2 className="font-headline-md text-headline-md font-bold text-primary">Configuración y Generador de Grafos</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Genera redes estándar o personaliza completamente el grafo agregando nodos y enlaces.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {/* Preset Generator Card */}
        <div className="bg-surface p-md rounded-lg border border-outline-variant space-y-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">Generador de Estructuras Matemáticas</h3>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Reemplaza el grafo actual por una topología típica de teoría de grafos:
          </p>

          <div className="grid grid-cols-1 gap-sm">
            {PRESET_GRAPHS.map((p) => (
              <button
                key={p.id}
                onClick={() => onLoadPreset(p.id)}
                className="w-full py-md px-md bg-surface-container-low border border-outline-variant/60 rounded text-left font-body-sm text-body-sm text-on-surface hover:bg-secondary-container/30 hover:border-secondary transition-all flex items-center justify-between cursor-pointer group"
              >
                <span>{p.name}</span>
                <span className="material-symbols-outlined text-outline group-hover:text-secondary transition-colors text-sm">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>

          <div className="pt-sm">
            <button
              onClick={onClearGraph}
              className="w-full py-md border border-error text-error hover:bg-error/5 rounded font-semibold text-body-sm transition-all cursor-pointer"
            >
              Borrar Todo el Grafo (Limpiar Lienzo)
            </button>
          </div>
        </div>

        {/* Dynamic Editor Space */}
        <div className="space-y-lg">
          {/* Add Node form */}
          <div className="bg-surface p-md rounded-lg border border-outline-variant space-y-sm">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">
              Agregar Nueva Persona (Nodo)
            </h3>
            <form onSubmit={handleAddNodeSubmit} className="space-y-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-mono text-label-mono text-outline uppercase">Nombre de la Persona</label>
                <input
                  type="text"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder="Ej. Persona K"
                  className="px-md py-sm bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary w-full"
                />
              </div>

              {nodeError && <p className="text-error text-xs font-semibold">{nodeError}</p>}

              <button
                type="submit"
                className="w-full py-md bg-primary text-on-primary rounded font-semibold text-body-sm hover:bg-primary-container transition-all cursor-pointer flex items-center justify-center gap-xs"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Registrar Persona
              </button>
            </form>
          </div>

          {/* Add Edge form */}
          <div className="bg-surface p-md rounded-lg border border-outline-variant space-y-sm">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">
              Crear Enlace Social (Arista)
            </h3>
            <form onSubmit={handleAddEdgeSubmit} className="space-y-md">
              <div className="grid grid-cols-2 gap-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-mono text-label-mono text-outline uppercase">Origen</label>
                  <select
                    value={edgeSource}
                    onChange={(e) => setEdgeSource(e.target.value)}
                    className="px-md py-sm bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary w-full"
                  >
                    <option value="">Seleccionar...</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-mono text-label-mono text-outline uppercase">Destino</label>
                  <select
                    value={edgeTarget}
                    onChange={(e) => setEdgeTarget(e.target.value)}
                    className="px-md py-sm bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary w-full"
                  >
                    <option value="">Seleccionar...</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {edgeError && <p className="text-error text-xs font-semibold">{edgeError}</p>}
              {edgeSuccess && <p className="text-emerald-600 text-xs font-semibold">{edgeSuccess}</p>}

              <button
                type="submit"
                className="w-full py-md bg-secondary text-on-secondary rounded font-semibold text-body-sm hover:brightness-95 transition-all cursor-pointer flex items-center justify-center gap-xs"
              >
                <span className="material-symbols-outlined text-sm">link</span>
                Conectar Actores
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sección global de administración de enlaces */}
      <div className="bg-surface p-md rounded-lg border border-outline-variant space-y-md">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">link_off</span>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-primary">Gestión de Enlaces de la Red ({edges.length})</h3>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Audita y remueve conexiones individuales directas de toda la red de forma unificada:
        </p>

        {edges.length === 0 ? (
          <p className="text-xs italic text-on-surface-variant">No existen conexiones o enlaces en la red actualmente.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-sm max-h-60 overflow-y-auto pr-2 border border-outline-variant/30 rounded p-sm bg-surface-container-low">
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              const label = sourceNode && targetNode 
                ? `${sourceNode.name} ↔ ${targetNode.name}`
                : `Conexión incompleta (${edge.source} - ${edge.target})`;

              return (
                <div
                  key={edge.id}
                  className="flex items-center justify-between p-sm bg-surface rounded border border-outline-variant/40 hover:border-outline hover:shadow-sm transition-all"
                >
                  <span className="font-body-xs text-xs text-on-surface font-medium truncate" title={label}>
                    {label}
                  </span>
                  <button
                    onClick={() => {
                      onDeleteEdge(edge.id);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 hover:text-red-800 rounded transition-colors cursor-pointer flex items-center justify-center"
                    title="Remover enlace"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
