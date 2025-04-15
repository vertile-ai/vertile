import type { GraphNode } from "../../types";

export enum ModelType {
  LLAMA = 'llama',
  Deepseek = 'deepseek',
  Embedding = 'embedding',
}

export interface ModelNode extends GraphNode {
  modelName: string;
  modelType?: ModelType;
  modelParameters?: Record<string, any>;
  modelTrainingData?: string;
  modelEvaluationData?: string;
  modelEvaluationResults?: string;
}