import { CommonNodeType } from '../types';

export interface TrainNodeType extends CommonNodeType {
  trainingMethod: string;
  trainingParams?: Record<string, any>;
  modelOutput?: string;
  description?: string;
}

export interface TrainNodePanelProps extends TrainNodeType {}
