import { CommonNodeType } from '../types';

export enum ModelType {
  LLAMA = 'llama',
  Deepseek = 'deepseek',
  Embedding = 'embedding',
}

export interface ModelNodeType extends CommonNodeType {
  modelName: string;
  modelType?: ModelType;
  modelParameters?: Record<string, any>;
  modelTrainingData?: string;
  modelEvaluationData?: string;
  modelEvaluationResults?: string;
  description?: string;
}
