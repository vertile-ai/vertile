import { Edge, Position } from 'reactflow';
import dagre from '@dagrejs/dagre';
import { v4 as uuid4, v4 } from 'uuid';
import { cloneDeep } from 'lodash-es';
import type { Node } from '@/app/workflows/[id]/_components/nodes/types';
import { BlockEnum } from '@/app/workflows/[id]/_components/nodes/types';
import produce from 'immer';
import { IOType } from '@/app/workflows/[id]/_components/nodes/types';
import {
  NodeInputTypesReverse,
  NodeOutputTypesReverse,
} from '@/app/workflows/[id]/const';

/**
 * Sort messy nodes and edges to top down layout
 * @param messyNodes Nodes to be sorted
 * @param messyEdges Edges connecting the nodes
 */
export const sortNodes = (
  messyNodes: Node[],
  messyEdges: Edge[],
  workflowWidth?: number
) => {
  const graphLayout = getLayoutByDagre(messyNodes, messyEdges, workflowWidth);
  const rankMap = {} as Record<string, Node>;

  messyNodes.forEach((node) => {
    if (!node.parentId) {
      const rank = graphLayout.node(node.id).rank!;

      if (!rankMap[rank]) rankMap[rank] = node;
      else if (rankMap[rank].position.y > node.position.y) rankMap[rank] = node;
    }
  });

  const newNodes = produce(messyNodes, (draft) => {
    draft.forEach((node) => {
      if (!node.parentId) {
        const nodeWithPosition = graphLayout.node(node.id);

        node.position = {
          x: nodeWithPosition.x - node.width! / 2,
          y:
            nodeWithPosition.y -
            node.height! / 2 +
            rankMap[nodeWithPosition.rank!].height! / 2,
        };
      }
    });
  });
  return newNodes;
};

export const getLayoutByDagre = (
  originNodes: Node[],
  originEdges: Edge[],
  workflowWidth?: number
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const nodes = cloneDeep(originNodes).filter((node) => !node.parentId);
  const edges = cloneDeep(originEdges);
  dagreGraph.setGraph({
    rankdir: 'LR',
    align: 'UL',
    nodesep: 40,
    ranksep: 60,
    ranker: 'tight-tree',
    marginx: workflowWidth ? Math.floor(workflowWidth / 2) - 100 : 200,
    marginy: 30,
  });
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.width!,
      height: node.height!,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return dagreGraph;
};

export const canRunBySingle = (nodeType: BlockEnum) => {
  return false;
};

type ConnectedSourceOrTargetNodesChange = {
  type: string;
  edge: Edge;
}[];
export const getNodesConnectedSourceOrTargetHandleIdsMap = (
  changes: ConnectedSourceOrTargetNodesChange,
  nodes: Node[]
) => {
  const nodesConnectedSourceOrTargetHandleIdsMap = {} as Record<string, any>;

  changes.forEach((change) => {
    const { edge, type } = change;
    const sourceNode = nodes.find((node) => node.id === edge.source)!;
    if (sourceNode) {
      nodesConnectedSourceOrTargetHandleIdsMap[sourceNode.id] =
        nodesConnectedSourceOrTargetHandleIdsMap[sourceNode.id] || {
          connectedSourceHandleIds: [
            ...(sourceNode?.data.connectedSourceHandleIds || []),
          ],
          connectedTargetHandleIds: [
            ...(sourceNode?.data.connectedTargetHandleIds || []),
          ],
        };
    }

    const targetNode = nodes.find((node) => node.id === edge.target)!;
    if (targetNode) {
      nodesConnectedSourceOrTargetHandleIdsMap[targetNode.id] =
        nodesConnectedSourceOrTargetHandleIdsMap[targetNode.id] || {
          connectedSourceHandleIds: [
            ...(targetNode?.data.connectedSourceHandleIds || []),
          ],
          connectedTargetHandleIds: [
            ...(targetNode?.data.connectedTargetHandleIds || []),
          ],
        };
    }

    if (sourceNode) {
      if (type === 'remove') {
        const index = nodesConnectedSourceOrTargetHandleIdsMap[
          sourceNode.id
        ].connectedSourceHandleIds.findIndex(
          (handleId: string) => handleId === edge.sourceHandle
        );
        nodesConnectedSourceOrTargetHandleIdsMap[
          sourceNode.id
        ].connectedSourceHandleIds.splice(index, 1);
      }

      if (type === 'add')
        nodesConnectedSourceOrTargetHandleIdsMap[
          sourceNode.id
        ].connectedSourceHandleIds.push(edge.sourceHandle || 'source');
    }

    if (targetNode) {
      if (type === 'remove') {
        const index = nodesConnectedSourceOrTargetHandleIdsMap[
          targetNode.id
        ].connectedTargetHandleIds.findIndex(
          (handleId: string) => handleId === edge.targetHandle
        );
        nodesConnectedSourceOrTargetHandleIdsMap[
          targetNode.id
        ].connectedTargetHandleIds.splice(index, 1);
      }

      if (type === 'add')
        nodesConnectedSourceOrTargetHandleIdsMap[
          targetNode.id
        ].connectedTargetHandleIds.push(edge.targetHandle || 'target');
    }
  });

  return nodesConnectedSourceOrTargetHandleIdsMap;
};

export const generateNewNode = ({
  data,
  position,
  id,
  zIndex,
  ...rest
}: Omit<Node, 'id'> & { id?: string }) => {
  return {
    id: id || v4(),
    type: 'custom',
    data,
    position,
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    zIndex,
    ...rest,
  } as Node;
};

export const genNewNodeTitleFromOld = (oldTitle: string) => {
  const regex = /^(.+?)\s*\((\d+)\)\s*$/;
  const match = oldTitle.match(regex);

  if (match) {
    const title = match[1];
    const num = parseInt(match[2], 10);
    return `${title} (${num + 1})`;
  } else {
    return `${oldTitle} (1)`;
  }
};

export const changeNodesAndEdgesId = (nodes: Node[], edges: Edge[]) => {
  const idMap = nodes.reduce(
    (acc, node) => {
      acc[node.id] = uuid4();

      return acc;
    },
    {} as Record<string, string>
  );

  const newNodes = nodes.map((node) => {
    return {
      ...node,
      id: idMap[node.id],
    };
  });

  const newEdges = edges.map((edge) => {
    return {
      ...edge,
      source: idMap[edge.source],
      target: idMap[edge.target],
    };
  });

  return [newNodes, newEdges] as [Node[], Edge[]];
};

export const isMac = () => {
  return navigator.userAgent.toUpperCase().includes('MAC');
};

const specialKeysNameMap: Record<string, string | undefined> = {
  ctrl: '⌘',
  alt: '⌥',
};

export const getKeyboardKeyNameBySystem = (key: string) => {
  if (isMac()) return specialKeysNameMap[key] || key;

  return key;
};

const specialKeysCodeMap: Record<string, string | undefined> = {
  ctrl: 'meta',
};

export const getKeyboardKeyCodeBySystem = (key: string) => {
  if (isMac()) return specialKeysCodeMap[key] || key;

  return key;
};

export const getTopLeftNodePosition = (nodes: Node[]) => {
  let minX = Infinity;
  let minY = Infinity;

  nodes.forEach((node) => {
    if (node.position.x < minX) minX = node.position.x;

    if (node.position.y < minY) minY = node.position.y;
  });

  return {
    x: minX,
    y: minY,
  };
};

export const isEventTargetInputArea = (target: HTMLElement) => {
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true;

  if (target.contentEditable === 'true') return true;
};

export const getAvailablePrevNodes = (nodeInput: IOType[]) => {
  const availablePrevNodes: BlockEnum[] = [];
  nodeInput.forEach((ioType) =>
    availablePrevNodes.concat(NodeInputTypesReverse[ioType])
  );
  return availablePrevNodes;
};

export const getAvailableNextNodes = (nodeOutput: IOType[]) => {
  const availableNextNodes: BlockEnum[] = [];
  nodeOutput.forEach((ioType) =>
    availableNextNodes.concat(NodeOutputTypesReverse[ioType])
  );
  return availableNextNodes;
};
