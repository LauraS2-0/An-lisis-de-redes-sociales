import { GraphNode, GraphEdge, NodeMetrics, GlobalMetricsType } from "../types";

// Helper to build adjacency list
export function getAdjacencyList(nodes: GraphNode[], edges: GraphEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  });
  return adj;
}

// Compute connected components using BFS
export function getConnectedComponents(nodes: GraphNode[], adj: Map<string, string[]>): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const comp: string[] = [];
      const queue: string[] = [node.id];
      visited.add(node.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);

        const neighbors = adj.get(curr) || [];
        neighbors.forEach((nbr) => {
          if (!visited.has(nbr)) {
            visited.add(nbr);
            queue.push(nbr);
          }
        });
      }
      components.push(comp);
    }
  });

  return components;
}

// Compute shortest paths from a source node to all other nodes in its component using BFS
export function getShortestPaths(sourceId: string, adj: Map<string, string[]>): Map<string, number> {
  const distances = new Map<string, number>();
  const queue: string[] = [sourceId];
  distances.set(sourceId, 0);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currDist = distances.get(curr)!;

    const neighbors = adj.get(curr) || [];
    neighbors.forEach((nbr) => {
      if (!distances.has(nbr)) {
        distances.set(nbr, currDist + 1);
        queue.push(nbr);
      }
    });
  }

  return distances;
}

// Check if a node is a cut vertex (bridge node)
// A node is a cut vertex if its removal increases the number of connected components
export function checkIsBridgeNode(
  nodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  originalComponentCount: number
): boolean {
  if (nodes.length <= 2) return false;

  const remainingNodes = nodes.filter((n) => n.id !== nodeId);
  const remainingEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

  const adj = getAdjacencyList(remainingNodes, remainingEdges);
  const compCount = getConnectedComponents(remainingNodes, adj).length;

  // Since we removed 1 node, if the component count is greater than (originalComponentCount - 1)
  // or if the graph splits further, then it's a cut vertex.
  // Wait, if we remove an isolated node, originalComponentCount decreases by 1, so compCount will be originalComponentCount - 1.
  // If we remove a node that connects others, compCount will be strictly greater than originalComponentCount - 1 (or originalComponentCount if it was a single component).
  // So the rule is: is compCount > (originalComponentCount - 1) when the node had some neighbors?
  // Let's check: if it has 0 or 1 neighbors in its component, removing it can never disconnect other nodes. So it cannot be a cut vertex.
  const nodeNeighbors = edges.filter((e) => e.source === nodeId || e.target === nodeId).length;
  if (nodeNeighbors <= 1) return false;

  return compCount > originalComponentCount - 1;
}

// Calculate bridge edges (puentes)
export function getBridgeEdges(nodes: GraphNode[], edges: GraphEdge[]): GraphEdge[] {
  const adj = getAdjacencyList(nodes, edges);
  const baseComponents = getConnectedComponents(nodes, adj).length;
  const bridges: GraphEdge[] = [];

  edges.forEach((edge) => {
    const testEdges = edges.filter((e) => e.id !== edge.id);
    const testAdj = getAdjacencyList(nodes, testEdges);
    const testComponents = getConnectedComponents(nodes, testAdj).length;

    if (testComponents > baseComponents) {
      bridges.push(edge);
    }
  });

  return bridges;
}

// Calculate complete metrics for a selected node
export function computeNodeMetrics(
  selectedNodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): NodeMetrics | null {
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const adj = getAdjacencyList(nodes, edges);
  const components = getConnectedComponents(nodes, adj);
  const baseCompCount = components.length;

  // 1. Degree
  const neighborsIds = adj.get(selectedNodeId) || [];
  const degree = neighborsIds.length;

  // 2. Impact level based on degree
  // Low: <= 2, Medium: 3-5, High: >= 6
  let impactLevel: "Alto impacto" | "Impacto medio" | "Impacto bajo" = "Impacto bajo";
  if (degree >= 6) {
    impactLevel = "Alto impacto";
  } else if (degree >= 3) {
    impactLevel = "Impacto medio";
  }

  // 3. Neighbor names
  const neighborsNames = neighborsIds
    .map((id) => nodes.find((n) => n.id === id)?.name || "")
    .filter((name) => name !== "");

  // 4. Component type
  // Find which component it belongs to
  const nodeComponent = components.find((comp) => comp.includes(selectedNodeId)) || [];
  // Sort components by size descending to find the "Principal" (largest)
  const sortedComponents = [...components].sort((a, b) => b.length - a.length);
  const largestComp = sortedComponents[0] || [];

  let componentType: "Principal" | "Secundario" | "Aislado" = "Secundario";
  if (nodeComponent.length === 1) {
    componentType = "Aislado";
  } else if (nodeComponent.length === largestComp.length && largestComp.includes(selectedNodeId)) {
    componentType = "Principal";
  }

  // 5. Shortest paths to compute eccentricity and distance
  const shortestPaths = getShortestPaths(selectedNodeId, adj);
  
  // Eccentricity is the maximum distance to any other reachable node
  let eccentricity = 0;
  let totalDistance = 0;
  let reachableCount = 0;

  shortestPaths.forEach((dist, id) => {
    if (id !== selectedNodeId) {
      if (dist > eccentricity) {
        eccentricity = dist;
      }
      totalDistance += dist;
      reachableCount++;
    }
  });

  // Average distance
  let averageDistance = "N/A";
  if (reachableCount > 0) {
    const avg = totalDistance / reachableCount;
    if (avg === 1) {
      averageDistance = "1 (directo)";
    } else {
      averageDistance = `${avg.toFixed(2)}`;
    }
  } else {
    averageDistance = "0 (aislado)";
  }

  // 6. Bridge Node (Cut vertex)
  const isBridgeNode = checkIsBridgeNode(selectedNodeId, nodes, edges, baseCompCount);

  return {
    degree,
    impactLevel,
    neighbors: neighborsNames,
    averageDistance,
    isBridgeNode,
    componentType,
    eccentricity,
  };
}

// Calculate Global Metrics
export function computeGlobalMetrics(nodes: GraphNode[], edges: GraphEdge[]): GlobalMetricsType {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  if (nodeCount === 0) {
    return {
      density: 0,
      componentsCount: 0,
      diameter: 0,
      radius: 0,
      averageDegree: 0,
      bridgeEdgesCount: 0,
    };
  }

  // 1. Density: 2 * |E| / (|V| * (|V| - 1))
  const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
  const density = maxEdges > 0 ? parseFloat((edgeCount / maxEdges).toFixed(2)) : 0;

  // Adjacency List
  const adj = getAdjacencyList(nodes, edges);

  // 2. Components Count
  const components = getConnectedComponents(nodes, adj);
  const componentsCount = components.length;

  // 3. Average Degree: 2 * |E| / |V|
  const averageDegree = parseFloat(((2 * edgeCount) / nodeCount).toFixed(2));

  // 4. Bridge Edges
  const bridgeEdges = getBridgeEdges(nodes, edges);
  const bridgeEdgesCount = bridgeEdges.length;

  // 5. Diameter and Radius
  // We compute eccentricities for all reachable pairs.
  // For standard calculations, we often define diameter as the max eccentricity in any connected component,
  // and radius as the min eccentricity in the largest component, or across all components.
  // Let's compute eccentricity for all nodes:
  const eccentricities: number[] = [];

  nodes.forEach((node) => {
    const paths = getShortestPaths(node.id, adj);
    let maxDist = 0;
    paths.forEach((dist) => {
      if (dist > maxDist) {
        maxDist = dist;
      }
    });
    eccentricities.push(maxDist);
  });

  const diameter = eccentricities.length > 0 ? Math.max(...eccentricities) : 0;
  const nonZeroEcc = eccentricities.filter((e) => e > 0);
  const radius = nonZeroEcc.length > 0 ? Math.min(...nonZeroEcc) : 0;

  return {
    density,
    componentsCount,
    diameter,
    radius,
    averageDegree,
    bridgeEdgesCount,
  };
}
