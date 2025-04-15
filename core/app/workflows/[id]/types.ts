import type { Workflow, WorkflowEdge, WorkflowNode } from '@prisma/client';

export type WorkflowWithRelations = Workflow & {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};
