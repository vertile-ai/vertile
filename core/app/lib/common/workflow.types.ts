import type { WorkflowEdge, WorkflowNode } from '@prisma/client';
import type { Merge } from './util.types';
import type { Edge, Node } from 'reactflow';

import type {
  AllNodeTypes,
  CommonEdgeType,
} from '@/app/workflows/[id]/_components/nodes/types';
export interface WorkflowClient {
  id: string;
  zoom: number;
  name: string;
  description?: string;
  nodes: WorkflowNodeClient[];
  edges: WorkflowEdgeClient[];
}

export type WorkflowNodeClient = Merge<
  WorkflowNode,
  {
    data: AllNodeTypes;
    rawData: Node<AllNodeTypes>;
  }
>;

export type WorkflowEdgeClient = Merge<
  WorkflowEdge,
  {
    data: CommonEdgeType;
    rawData: Edge<CommonEdgeType>;
  }
>;
