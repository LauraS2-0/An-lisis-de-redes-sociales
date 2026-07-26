import { GraphNode, GraphEdge } from "../types";

export const initialNodes: GraphNode[] = [
  { id: "node-a", name: "Persona A", x: 500, y: 400, group: "Grupo Investigación A" },
  { id: "node-b", name: "Persona B", x: 300, y: 250, group: "Grupo Estudiantes B" },
  { id: "node-c", name: "Persona C", x: 700, y: 250, group: "Grupo Estudiantes B" },
  { id: "node-d", name: "Persona D", x: 500, y: 650, group: "Grupo Estudiantes B" },
  
  // Peripheral nodes connected to A
  { id: "node-i", name: "Persona I", x: 250, y: 500, group: "Grupo Estudiantes B" },
  { id: "node-j", name: "Persona J", x: 750, y: 550, group: "Grupo Investigación A" },
  
  // Peripheral nodes connected to B
  { id: "node-e", name: "Persona E", x: 150, y: 200, group: "Grupo Estudiantes B" },
  { id: "node-f", name: "Persona F", x: 400, y: 100, group: "Grupo Investigación A" },
  
  // Peripheral nodes connected to C
  { id: "node-g", name: "Persona G", x: 850, y: 300, group: "Grupo Estudiantes B" },
  { id: "node-h", name: "Persona H", x: 650, y: 100, group: "Grupo Investigación A" },
];

export const initialEdges: GraphEdge[] = [
  // Core connections from Persona A
  { id: "edge-a-b", source: "node-a", target: "node-b" },
  { id: "edge-a-c", source: "node-a", target: "node-c" },
  { id: "edge-a-d", source: "node-a", target: "node-d" },
  { id: "edge-a-i", source: "node-a", target: "node-i" },
  { id: "edge-a-j", source: "node-a", target: "node-j" },
  
  // Connections from Persona B
  { id: "edge-b-e", source: "node-b", target: "node-e" },
  { id: "edge-b-f", source: "node-b", target: "node-f" },
  
  // Connections from Persona C
  { id: "edge-c-g", source: "node-c", target: "node-g" },
  { id: "edge-c-h", source: "node-c", target: "node-h" },
];

export const PRESET_GRAPHS = [
  {
    name: "Red del Mockup",
    id: "mockup",
  },
  {
    name: "Estrella (Centralizado)",
    id: "star",
  },
  {
    name: "Anillo (Cycle)",
    id: "cycle",
  },
  {
    name: "Red Completa (Cliques)",
    id: "complete",
  },
  {
    name: "Red Aleatoria (Random)",
    id: "random",
  },
];
