import { GraphNode } from '../../types';

export interface TrainNode extends GraphNode {
  trainingMethod: string;
  trainParams?: Record<string, any>;
  modelOutput?: string;
  description?: string;
}
