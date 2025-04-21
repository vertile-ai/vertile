export interface TrainerResponseWS {
  type?: 'info' | 'warning' | 'error';
  status: 'success' | 'failed' | 'error';
  message: string;
  code: number;
  data?: Record<string, any>;
}

export interface TrainerPayload {
  type: 'command';
  message: string;
  data?: Record<string, any>;
}

export interface DatasetBase {
  name: string;
  size: number;
  extension: string;
  numRows?: number;
}

export interface DatasetLocal extends DatasetBase {}

export interface DatasetRemote extends DatasetBase {
  id: string;
  path?: string;
  config: string;
  split: string;
  source: string;
  createdAt: Date;
  lastUpdatedAt: Date;
}

export interface JobCreate {
  baseModel: string;
  trainingMethod: string;
  datasetName: string;
  hyperparameters: Record<string, string | number | boolean>;
}

export interface JobDetail extends JobCreate {
  id: number;
  status: 'finished' | 'running' | 'failed' | 'paused';
  taskId?: string;
  createdAt: Date;
  lastUpdatedAt: Date;
}

export interface TrainingMethod {
  name: string;
  fullName: string;
  explanation: string;
  externalLink?: string;
}

export interface AllJobOptions {
  baseModels: Array<string>;
  trainingMethods: Array<TrainingMethod>;
  datasets: Array<Record<string, any>>;
  hyperparameters: Record<string, string | number | boolean>;
}
