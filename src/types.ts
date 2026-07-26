export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  group: string; // e.g., "Grupo Investigación A", "Grupo Estudiantes B"
  isFixed?: boolean;
}

export interface GraphEdge {
  id: string; // unique identifier "source-target"
  source: string;
  target: string;
}

export interface GlobalMetricsType {
  density: number;
  componentsCount: number;
  diameter: number;
  radius: number;
  averageDegree: number;
  bridgeEdgesCount: number;
}

export interface NodeMetrics {
  degree: number;
  impactLevel: "Alto impacto" | "Impacto medio" | "Impacto bajo";
  neighbors: string[]; // names or ids of neighbors
  averageDistance: string; // "1 (directo)" or other values
  isBridgeNode: boolean; // Yes/No
  componentType: "Principal" | "Secundario" | "Aislado";
  eccentricity: number;
}
