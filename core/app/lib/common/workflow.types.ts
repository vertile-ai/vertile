import type { WorkflowEdge, WorkflowNode } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { Equal } from './util.types';
import type {
  AllNodeTypes,
  CommonEdgeType,
} from '@/src/components/workflow/types';

export interface WorkflowClient {
  id: string;
  zoom: number;
  name: string;
  description?: string;
  nodes: WorkflowNodeClient<AllNodeTypes>[];
  edges: WorkflowEdgeClient<CommonEdgeType>[];
}

type TransformJsonValue<T, Data = Record<string, any>> = {
  [K in keyof T]: Equal<T[K], Prisma.JsonValue> extends true
    ? T[K] extends {}
      ? TransformJsonValue<T[K]>
      : Data
    : T[K];
};

export type WorkflowNodeClient<Data = Record<string, any>> = TransformJsonValue<
  WorkflowNode,
  Data
>;
export type WorkflowEdgeClient<Data = Record<string, any>> = TransformJsonValue<
  WorkflowEdge,
  Data
>;
