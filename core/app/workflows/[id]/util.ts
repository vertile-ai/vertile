import type { Viewport } from 'reactflow';
import type { Node, Edge } from './types';

export const prepareWorkflowData = ({
  viewport,
  nodes,
  edges,
  name,
}: {
  viewport?: Viewport;
  nodes?: Node[];
  edges?: Edge[];
  name?: string;
}) => {
  // Prepare the workflow data
  const workflowData = {
    ...(name && { name }),
    ...(viewport && { zoom: viewport.zoom }),
    ...(nodes && {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        positionX: node.position.x,
        positionY: node.position.y,
        data: node.data,
        rawData: node,
      })),
    }),
    ...(edges && {
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        data: edge.data,
        rawData: edge,
      })),
    }),
  };

  return workflowData;
};
