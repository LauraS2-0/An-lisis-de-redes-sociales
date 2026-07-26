import React, { useState, useRef, useEffect } from "react";
import { GraphNode, GraphEdge } from "../types";

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  isolateActive: boolean;
  onToggleIsolate: () => void;
}

export default function NetworkGraph({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
  isolateActive,
  onToggleIsolate,
}: NetworkGraphProps) {
  // Pan and Zoom State
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Dragging states
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  
  const dragStartNodePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Filter nodes & edges if isolateActive is true -> now always return all of them to show coexistence, but we will visually fade them out
  const getVisibleElements = () => {
    return { visibleNodes: nodes, visibleEdges: edges };
  };

  const { visibleNodes, visibleEdges } = getVisibleElements();

    // Color functions based on brand identity and mockup
  const getNodeStyles = (node: GraphNode, isSelected: boolean) => {
    const isNeighbor =
      selectedNodeId &&
      !isSelected &&
      edges.some(
        (e) =>
          (e.source === selectedNodeId && e.target === node.id) ||
          (e.target === selectedNodeId && e.source === node.id)
      );

    let fillColor = "fill-tertiary-container/40";
    let strokeColor = "#ffdada";
    let textStyle = "fill-on-surface-variant";

    // Calcular el grado del nodo
    const degree = edges.filter((e) => e.source === node.id || e.target === node.id).length;
    // El radio base escala proporcionalmente con el grado de 14px a un máximo de 32px
    let radius = 14 + degree * 3.5;
    if (radius > 32) radius = 32;

    if (node.group === "Grupo Investigación A") {
      fillColor = "fill-primary";
      strokeColor = "#aecdc6";
    } else if (node.group === "Grupo Estudiantes B") {
      fillColor = "fill-secondary";
      strokeColor = "#b7c6ee";
    }

    if (isSelected) {
      fillColor = "fill-primary";
      strokeColor = "#aecdc6";
      radius = radius + 8;
      if (radius < 28) radius = 28;
      if (radius > 38) radius = 38;
      textStyle = "fill-on-background font-bold";
    } else if (isNeighbor) {
      // highlighted as active neighbor
      radius = radius + 2;
    }

    return { fillColor, strokeColor, radius, textStyle };
  };

  // Zoom actions
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const handleZoomFit = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Drag node event handlers
  const handleNodePointerDown = (e: React.PointerEvent, node: GraphNode) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingNodeId(node.id);
    dragStartNodePos.current = { x: node.x, y: node.y };
    dragStartPointer.current = { x: e.clientX, y: e.clientY };
    onSelectNode(node.id);
  };

  const handleNodePointerMove = (e: React.PointerEvent) => {
    if (!draggingNodeId) return;
    e.stopPropagation();

    const dx = (e.clientX - dragStartPointer.current.x) / zoom;
    const dy = (e.clientY - dragStartPointer.current.y) / zoom;

    const newX = Math.max(50, Math.min(950, dragStartNodePos.current.x + dx));
    const newY = Math.max(50, Math.min(750, dragStartNodePos.current.y + dy));

    onUpdateNodePosition(draggingNodeId, newX, newY);
  };

  const handleNodePointerUp = (e: React.PointerEvent) => {
    if (!draggingNodeId) return;
    e.stopPropagation();
    (e.target as Element).releasePointerCapture(e.pointerId);
    setDraggingNodeId(null);
  };

  // Pan background handlers
  const handleBgPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // only left click panning
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleBgPointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - panStart.current.x;
    const newY = e.clientY - panStart.current.y;
    setPan({ x: newX, y: newY });
  };

  const handleBgPointerUp = (e: React.PointerEvent) => {
    if (!isPanning) return;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    setIsPanning(false);
  };

  return (
    <div className="w-full h-full relative select-none" id="graph-stage">
      {/* Dynamic Overlay labels/info */}
      <div className="absolute top-md left-md bg-surface-container/80 backdrop-blur-md px-md py-sm rounded border border-outline-variant text-xs flex flex-col gap-1 shadow-sm z-10 pointer-events-none">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>Modo Interactivo</span>
        </div>
        <p className="text-on-surface-variant font-medium">Arrastra nodos para reorganizar la red</p>
        <p className="text-on-surface-variant/70 font-mono text-[10px]">Arrástrame para panear, rueda para hacer zoom</p>
      </div>

      {isolateActive && (
        <div className="absolute top-md right-md bg-tertiary-container/90 text-on-tertiary-container px-md py-sm rounded border border-tertiary/30 text-xs flex items-center gap-sm shadow-sm z-10">
          <span className="material-symbols-outlined text-sm">visibility_off</span>
          <span className="font-semibold">Subgrafo Aislado</span>
          <button
            onClick={onToggleIsolate}
            className="ml-sm font-bold underline hover:text-white transition-colors cursor-pointer"
          >
            Mostrar Todo
          </button>
        </div>
      )}

      {/* Main SVG workspace */}
      <svg
        ref={svgRef}
        className="w-full h-full bg-surface-container-lowest cursor-grab active:cursor-grabbing"
        onPointerDown={handleBgPointerDown}
        onPointerMove={handleBgPointerMove}
        onPointerUp={handleBgPointerUp}
        xmlns="http://www.w3.org/2000/svg"
        id="graph-canvas"
      >
        <defs>
          <filter height="140%" id="glow" width="140%" x="-20%" y="-20%">
            <feGaussianBlur result="blur" stdDeviation="3"></feGaussianBlur>
            <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Grid background inside translation */}
          <g className="opacity-10 pointer-events-none">
            {Array.from({ length: 21 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 50}
                y1={0}
                x2={i * 50}
                y2={800}
                stroke="#414846"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}
            {Array.from({ length: 17 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * 50}
                x2={1000}
                y2={i * 50}
                stroke="#414846"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}
          </g>

          {/* Edges */}
          <g className="edges stroke-outline-variant/50" strokeWidth="1.5">
            {visibleEdges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);

              if (!sourceNode || !targetNode) return null;

              // Highlight connections of the selected node
              const isHighlighted =
                selectedNodeId === edge.source || selectedNodeId === edge.target;

              const isFadedEdge = isolateActive && selectedNodeId &&
                edge.source !== selectedNodeId && edge.target !== selectedNodeId;

              return (
                <line
                  key={edge.id}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  className={`transition-all duration-150 ${
                    isHighlighted
                      ? "stroke-primary stroke-2"
                      : "stroke-outline-variant/60"
                  }`}
                  style={{ opacity: isFadedEdge ? 0.15 : 1 }}
                  id={`edge-${edge.id}`}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {visibleNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const { fillColor, strokeColor, radius, textStyle } = getNodeStyles(
                node,
                isSelected
              );

              const isNeighbor = selectedNodeId &&
                edges.some(e => (e.source === selectedNodeId && e.target === node.id) || (e.target === selectedNodeId && e.source === node.id));
              const isFadedNode = isolateActive && selectedNodeId &&
                node.id !== selectedNodeId && !isNeighbor;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`graph-node transition-all group select-none ${
                    isSelected ? "active" : ""
                  }`}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerMove={handleNodePointerMove}
                  onPointerUp={handleNodePointerUp}
                  style={{ touchAction: "none", opacity: isFadedNode ? 0.2 : 1 }}
                  id={`node-group-${node.id}`}
                >
                  {/* Outer selection halo for active node */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      className="fill-none stroke-inverse-primary/40"
                      strokeWidth="3"
                    />
                  )}

                  {/* Core node circle */}
                  <circle
                    className={`${fillColor} transition-all duration-200 cursor-pointer stroke-2 hover:stroke-3`}
                    r={radius}
                    stroke={strokeColor}
                  />

                  {/* Interactive subtle ring */}
                  <circle
                    r={radius}
                    className="fill-transparent stroke-none hover:stroke-white/30"
                    strokeWidth="2"
                  />

                  {/* Node Label */}
                  <text
                    className={`font-label-mono font-semibold select-none text-xs ${textStyle}`}
                    dy={radius + 18}
                    textAnchor="middle"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Floating Graph Controls */}
      <div className="absolute bottom-md left-md flex gap-xs" id="graph-controls-overlay">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="bg-surface border border-outline-variant p-2 rounded hover:bg-surface-container transition-colors shadow-sm cursor-pointer flex items-center justify-center"
          id="btn-zoom-in"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-lg">zoom_in</span>
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="bg-surface border border-outline-variant p-2 rounded hover:bg-surface-container transition-colors shadow-sm cursor-pointer flex items-center justify-center"
          id="btn-zoom-out"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-lg">zoom_out</span>
        </button>
        <button
          onClick={handleZoomFit}
          title="Recenter & Fit View"
          className="bg-surface border border-outline-variant p-2 rounded hover:bg-surface-container transition-colors shadow-sm cursor-pointer flex items-center justify-center"
          id="btn-zoom-fit"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-lg">fit_screen</span>
        </button>
      </div>
    </div>
  );
}
