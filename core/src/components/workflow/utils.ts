import { Position, getConnectedEdges, getOutgoers } from 'reactflow';
import dagre from '@dagrejs/dagre';
import { v4 as uuid4, v4 } from 'uuid';
import { cloneDeep, uniqBy } from 'lodash-es';
import type {
  Edge,
  InputVar,
  Node,
  ToolNodeType,
  ToolParameter,
  ToolWithProvider,
} from './types';
import { BlockEnum, CollectionType } from './types';
import {
  ITERATION_NODE_Z_INDEX,
  NODE_WIDTH_X_OFFSET,
  NodeInputTypesReverse,
  NodeOutputTypesReverse,
  START_INITIAL_POSITION,
} from './constants';
import produce from 'immer';
import { IOType } from './io.types';

const WHITE = 'WHITE';
const GRAY = 'GRAY';
const BLACK = 'BLACK';

const toType = (type: string) => {
  switch (type) {
    case 'string':
      return 'text-input';
    case 'number':
      return 'number-input';
    default:
      return type;
  }
};
export const toolParametersToFormSchemas = (parameters: ToolParameter[]) => {
  if (!parameters) return [];

  const formSchemas = parameters.map((parameter) => {
    return {
      ...parameter,
      variable: parameter.name,
      type: toType(parameter.type),
      _type: parameter.type,
      show_on: [],
      options: parameter.options?.map((option) => {
        return {
          ...option,
          show_on: [],
        };
      }),
      tooltip: parameter.human_description,
    };
  });
  return formSchemas;
};

const isCyclicUtil = (
  nodeId: string,
  color: Record<string, string>,
  adjaList: Record<string, string[]>,
  stack: string[]
) => {
  color[nodeId] = GRAY;
  stack.push(nodeId);

  for (let i = 0; i < adjaList[nodeId].length; ++i) {
    const childId = adjaList[nodeId][i];

    if (color[childId] === GRAY) {
      stack.push(childId);
      return true;
    }
    if (
      color[childId] === WHITE &&
      isCyclicUtil(childId, color, adjaList, stack)
    )
      return true;
  }
  color[nodeId] = BLACK;
  if (stack.length > 0 && stack[stack.length - 1] === nodeId) stack.pop();
  return false;
};

const getCycleEdges = (nodes: Node[], edges: Edge[]) => {
  const adjaList: Record<string, string[]> = {};
  const color: Record<string, string> = {};
  const stack: string[] = [];

  for (const node of nodes) {
    color[node.id] = WHITE;
    adjaList[node.id] = [];
  }

  for (const edge of edges) adjaList[edge.source]?.push(edge.target);

  for (let i = 0; i < nodes.length; i++) {
    if (color[nodes[i].id] === WHITE)
      isCyclicUtil(nodes[i].id, color, adjaList, stack);
  }

  const cycleEdges: Edge[] = [];
  if (stack.length > 0) {
    const cycleNodes = new Set(stack);
    for (const edge of edges) {
      if (cycleNodes.has(edge.source) && cycleNodes.has(edge.target))
        cycleEdges.push(edge);
    }
  }

  return cycleEdges;
};

export const initNodesAndEdges = (
  originalNodes?: Node[],
  originalEdges?: Edge[]
) => {
  const nodes = originalNodes ? cloneDeep(originalNodes) : [];
  const edges = originalEdges ? cloneDeep(originalEdges) : [];

  const connectedEdges = getConnectedEdges(nodes, edges);
  const initNodes = nodes.map((node) => {
    node.type = 'custom';

    node.data.connectedSourceHandleIds = connectedEdges
      .filter((edge) => edge.source === node.id)
      .map((edge) => edge.sourceHandle || 'source');
    node.data.connectedTargetHandleIds = connectedEdges
      .filter((edge) => edge.target === node.id)
      .map((edge) => edge.targetHandle || 'target');

    if (node.data.type === BlockEnum.IfElse) {
      node.data._targetBranches = [
        {
          id: 'true',
          name: 'IS TRUE',
        },
        {
          id: 'false',
          name: 'IS FALSE',
        },
      ];
    }

    return node;
  });

  let selectedNode: Node | null = null;
  const nodesMap = nodes.reduce(
    (acc, node) => {
      acc[node.id] = node;

      if (node.data?.selected) selectedNode = node;

      return acc;
    },
    {} as Record<string, Node>
  );

  const cycleEdges = getCycleEdges(nodes, edges);
  const initEdges = edges
    .filter((edge) => {
      return !cycleEdges.find(
        (cycEdge) =>
          cycEdge.source === edge.source && cycEdge.target === edge.target
      );
    })
    .map((edge) => {
      edge.type = 'custom';

      if (!edge.sourceHandle) edge.sourceHandle = 'source';

      if (!edge.targetHandle) edge.targetHandle = 'target';

      if (!edge.data?.sourceType && edge.source && nodesMap[edge.source]) {
        edge.data = {
          ...edge.data,
          sourceType: nodesMap[edge.source].data.type!,
        } as any;
      }

      if (!edge.data?.targetType && edge.target && nodesMap[edge.target]) {
        edge.data = {
          ...edge.data,
          targetType: nodesMap[edge.target].data.type!,
        } as any;
      }

      if (selectedNode) {
        edge.data = {
          ...edge.data,
          _connectedNodeIsSelected:
            edge.source === selectedNode.id || edge.target === selectedNode.id,
        } as any;
      }
      return edge;
    });

  return { nodes: initNodes, edges: initEdges };
};

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

export const getValidTreeNodes = (nodes: Node[], edges: Edge[]) => {
  const startNode = nodes.find((node) => node.data.type === BlockEnum.Start);

  if (!startNode) {
    return {
      validNodes: [],
      maxDepth: 0,
    };
  }

  const list: Node[] = [startNode];
  let maxDepth = 1;

  const traverse = (root: Node, depth: number) => {
    if (depth > maxDepth) maxDepth = depth;

    const outgoers = getOutgoers(root, nodes, edges);

    if (outgoers.length) {
      outgoers.forEach((outgoer) => {
        list.push(outgoer);
        traverse(outgoer, depth + 1);
      });
    } else {
      list.push(root);
    }
  };

  traverse(startNode, maxDepth);

  return {
    validNodes: uniqBy(list, 'id'),
    maxDepth,
  };
};

export const getToolCheckParams = (
  toolData: ToolNodeType,
  buildInTools: ToolWithProvider[],
  customTools: ToolWithProvider[],
  workflowTools: ToolWithProvider[],
  language: string
) => {
  const { provider_id, provider_type, tool_name } = toolData;
  const isBuiltIn = provider_type === CollectionType.builtIn;
  const currentTools =
    provider_type === CollectionType.builtIn
      ? buildInTools
      : provider_type === CollectionType.custom
        ? customTools
        : workflowTools;
  const currCollection = currentTools.find((item) => item.id === provider_id);
  const currTool = currCollection?.tools.find(
    (tool) => tool.name === tool_name
  );
  const formSchemas = currTool
    ? toolParametersToFormSchemas(currTool.parameters)
    : [];
  const toolInputVarSchema = formSchemas.filter(
    (item: any) => item.form === 'llm'
  );
  const toolSettingSchema = formSchemas.filter(
    (item: any) => item.form !== 'llm'
  );

  return {
    toolInputsSchema: (() => {
      const formInputs: InputVar[] = [];
      toolInputVarSchema.forEach((item: any) => {
        formInputs.push({
          label: item.label[language] || item.label.en_US,
          variable: item.variable,
          type: item.type,
          required: item.required,
        });
      });
      return formInputs;
    })(),
    notAuthed: isBuiltIn && toolSettingSchema,
    language,
  };
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
  nodeInput.forEach(ioType => availablePrevNodes.concat(NodeInputTypesReverse[ioType]));
  return availablePrevNodes;
};

export const getAvailableNextNodes = (nodeOutput: IOType[]) => {
  const availableNextNodes: BlockEnum[] = [];
  nodeOutput.forEach(ioType => availableNextNodes.concat(NodeOutputTypesReverse[ioType]));
  return availableNextNodes;
};
