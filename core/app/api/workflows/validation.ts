import { BlockEnum } from '@/src/components/workflow/types';
import { z } from 'zod';

export const workflowNodeSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  positionX: z.number(),
  positionY: z.number(),
  data: z.any().optional(),
});

export const workflowEdgeSchema = z.object({
  id: z.string().optional(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  data: z.object({
    _hovering: z.boolean().optional(),
    connectedNodeIsEntered: z.boolean().optional(),
    _connectedNodeIsSelected: z.boolean().optional(),
    _runned: z.boolean().optional(),
    _isBundled: z.boolean().optional(),
    sourceType: z.nativeEnum(BlockEnum),
    targetType: z.nativeEnum(BlockEnum),
  }),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  zoom: z.number().default(1),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
});

export const updateWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  zoom: z.number().optional(),
  nodes: z.array(workflowNodeSchema).optional(),
  edges: z.array(workflowEdgeSchema).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
