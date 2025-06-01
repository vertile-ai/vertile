import { BlockEnum } from '@/app/workflows/[id]/_components/nodes/types';
import { z } from 'zod';

export const workflowNodeSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  positionX: z.number(),
  positionY: z.number(),
  data: z.any().optional(),
  rawData: z.any(),
});

export const workflowEdgeSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  data: z
    .object({
      _hovering: z.boolean().optional(),
      connectedNodeIsEntered: z.boolean().optional(),
      _connectedNodeIsSelected: z.boolean().optional(),
      isInIteration: z.boolean().optional(),
      _runned: z.boolean().optional(),
      _isBundled: z.boolean().optional(),
      sourceType: z.nativeEnum(BlockEnum).optional(),
      targetType: z.nativeEnum(BlockEnum).optional(),
    })
    .optional()
    .default({}),
  rawData: z.any(),
});

export const createWorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Workflow name is required'),
  zoom: z.number().default(1),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
});

export const updateWorkflowSchema = z.object({
  name: z.string().optional(),
  zoom: z.number().optional(),
  nodes: z.array(workflowNodeSchema).optional(),
  edges: z.array(workflowEdgeSchema).optional(),
});

export const fetchWorkflowSchema = z.object({
  id: z.string(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type FetchWorkflowInput = z.infer<typeof fetchWorkflowSchema>;
