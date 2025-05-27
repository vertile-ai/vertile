/**
 * Directed Graph Utilities for Workflow Execution
 *
 * This module provides utilities for working with directed graphs, specifically
 * for determining execution order in workflow systems.
 */

import { Node, Edge } from '@/app/workflows/[id]/types';

// Cache for topological sort results to avoid recomputation
const sortCache = new Map<string, string[]>();

/**
 * Creates an adjacency list representation of the graph
 */
export function createAdjacencyList(
  nodes: Node[],
  edges: Edge[]
): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();

  // Initialize the adjacency list for all nodes
  nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
  });

  // Add edges to the adjacency list
  edges.forEach((edge) => {
    const sourceId = edge.source;
    const targetId = edge.target;

    if (adjacencyList.has(sourceId)) {
      const neighbors = adjacencyList.get(sourceId) || [];
      if (!neighbors.includes(targetId)) {
        neighbors.push(targetId);
        adjacencyList.set(sourceId, neighbors);
      }
    }
  });

  return adjacencyList;
}

/**
 * Generates a cache key based on the current graph structure
 */
function generateCacheKey(nodes: Node[], edges: Edge[]): string {
  // Sort to ensure consistent key generation
  const nodeIds = nodes
    .map((n) => n.id)
    .sort()
    .join('|');
  const edgeKeys = edges
    .map((e) => `${e.source}->${e.target}`)
    .sort()
    .join('|');
  return `${nodeIds}::${edgeKeys}`;
}

/**
 * Determines if the directed graph contains a cycle
 *
 * Uses a depth-first search (DFS) approach with three states:
 * - WHITE: Node not yet processed
 * - GRAY: Node is being processed (in the current path)
 * - BLACK: Node has been processed fully
 *
 * @returns Object containing whether a cycle was detected and the cycle path if found
 */
export function detectCycle(nodes: Node[], edges: Edge[]): boolean {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  const adjacencyList = createAdjacencyList(nodes, edges);
  const state = new Map<string, number>();
  const parent = new Map<string, string | null>();

  // Initialize all nodes as not processed
  nodes.forEach((node) => {
    state.set(node.id, WHITE);
    parent.set(node.id, null);
  });

  let cycleDetected = false;
  let cycleStart: string | null = null;
  let cycleEnd: string | null = null;

  // DFS to detect cycles
  function dfs(nodeId: string): void {
    if (cycleDetected) return;

    state.set(nodeId, GRAY); // Mark as being processed

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const neighborState = state.get(neighbor);

      if (neighborState === GRAY) {
        // Back edge found, cycle detected
        cycleDetected = true;
        cycleStart = neighbor;
        cycleEnd = nodeId;
        return;
      } else if (neighborState === WHITE) {
        // Not yet processed, continue DFS
        parent.set(neighbor, nodeId);
        dfs(neighbor);
      }
    }

    state.set(nodeId, BLACK); // Mark as fully processed
  }

  // Start DFS from each unprocessed node
  for (const node of nodes) {
    if (state.get(node.id) === WHITE) {
      dfs(node.id);
      if (cycleDetected) break;
    }
  }

  // If a cycle was detected, reconstruct it
  if (cycleDetected && cycleStart && cycleEnd) {
    return true;
  }

  return false;
}

/**
 * Performs a topological sort on the directed graph.
 *
 * This gives a valid execution order for the workflow nodes.
 * Only works if the graph is acyclic (DAG).
 *
 * Uses Kahn's algorithm for topological sorting which is deterministic
 * given the same input graph.
 *
 * @returns Ordered array of node IDs, or null if a cycle is detected
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): string[] | null {
  // Check cache first
  const cacheKey = generateCacheKey(nodes, edges);
  if (sortCache.has(cacheKey)) {
    return sortCache.get(cacheKey) || null;
  }

  const adjacencyList = createAdjacencyList(nodes, edges);

  // Calculate in-degree for each node (how many edges point to it)
  const inDegree = new Map<string, number>();
  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    const targetNode = edge.target;
    inDegree.set(targetNode, (inDegree.get(targetNode) || 0) + 1);
  });

  // Queue nodes with no dependencies (in-degree of 0)
  const queue: string[] = [];
  nodes.forEach((node) => {
    if ((inDegree.get(node.id) || 0) === 0) {
      queue.push(node.id);
    }
  });

  // Process queue
  const result: string[] = [];
  while (queue.length > 0) {
    // Sort queue to ensure deterministic ordering when multiple nodes have no dependencies
    queue.sort();

    const nodeId = queue.shift()!;
    result.push(nodeId);

    // For each neighbor, decrease in-degree and check if it's ready
    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const newInDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newInDegree);

      if (newInDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If result doesn't include all nodes, there must be a cycle
  if (result.length !== nodes.length) {
    return null;
  }

  // Cache the result
  sortCache.set(cacheKey, result);

  return result;
}

/**
 * Clears the topological sort cache
 * Call this when the graph structure changes significantly
 */
export function clearSortCache(): void {
  sortCache.clear();
}

/**
 * Gets the execution order of nodes based on the workflow graph
 *
 * @returns Object containing execution order and any errors
 */
export function getExecutionOrder(
  nodes: Node[],
  edges: Edge[]
): {
  order: string[] | null;
  error?: string;
  cycleNodes?: string[];
} {
  // First, check for cycles
  const hasCycle = detectCycle(nodes, edges);

  if (hasCycle) {
    return {
      order: null,
      error: 'Cannot determine execution order: workflow contains a cycle',
    };
  }

  // If no cycles, get topological sort
  const order = topologicalSort(nodes, edges);

  return { order };
}

/**
 * Finds all paths from a start node to an end node
 * Used for tracing execution paths through the workflow
 */
export function findAllPaths(
  startNodeId: string,
  endNodeId: string,
  nodes: Node[],
  edges: Edge[]
): string[][] {
  const adjacencyList = createAdjacencyList(nodes, edges);
  const paths: string[][] = [];

  function dfs(
    currentId: string,
    visited = new Set<string>(),
    path: string[] = []
  ) {
    // Add current node to path and mark as visited
    path.push(currentId);
    visited.add(currentId);

    // If we've reached the destination, add the path
    if (currentId === endNodeId) {
      paths.push([...path]);
    } else {
      // Continue DFS on unvisited neighbors
      const neighbors = adjacencyList.get(currentId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, new Set(visited), [...path]);
        }
      }
    }
  }

  dfs(startNodeId);
  return paths;
}

/**
 * Gets a deterministic execution order based on the workflow structure
 * including handling of parallel branches
 */
export function getWorkflowExecutionPlan(
  nodes: Node[],
  edges: Edge[]
): {
  plan: string[] | null;
  parallelGroups: string[][];
  error?: string;
} {
  const { order, error, cycleNodes } = getExecutionOrder(nodes, edges);

  if (error || !order) {
    return {
      plan: null,
      parallelGroups: [],
      error: error || 'Unknown error in topological sort',
    };
  }

  // Find parallel branches (nodes that can execute independently)
  const parallelGroups: string[][] = [];
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();

  // Calculate in-degree and out-degree for each node
  nodes.forEach((node) => {
    inDegreeMap.set(node.id, 0);
    outDegreeMap.set(node.id, 0);
  });

  edges.forEach((edge) => {
    inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) || 0) + 1);
    outDegreeMap.set(edge.source, (outDegreeMap.get(edge.source) || 0) + 1);
  });

  // Find branch points (nodes with multiple outgoing edges)
  const branchPoints = nodes
    .filter((node) => (outDegreeMap.get(node.id) || 0) > 1)
    .map((node) => node.id);

  // Find merge points (nodes with multiple incoming edges)
  const mergePoints = nodes
    .filter((node) => (inDegreeMap.get(node.id) || 0) > 1)
    .map((node) => node.id);

  // For each branch point, find paths to merge points
  branchPoints.forEach((startId) => {
    mergePoints.forEach((endId) => {
      const paths = findAllPaths(startId, endId, nodes, edges);

      if (paths.length > 1) {
        // Extract the middle portions of the paths (exclude start and end)
        const parallelBranches = paths.map((path) =>
          path.slice(1, path.length - 1)
        );

        // Only add non-empty branches
        const nonEmptyBranches = parallelBranches.filter(
          (branch) => branch.length > 0
        );

        if (nonEmptyBranches.length > 1) {
          parallelGroups.push(...nonEmptyBranches);
        }
      }
    });
  });

  return {
    plan: order,
    parallelGroups,
  };
}
