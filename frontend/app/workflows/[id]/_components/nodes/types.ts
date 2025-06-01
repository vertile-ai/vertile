import { DatasetNodeType } from './Dataset/types';
import { ModelNodeType } from './Model/types';
import type { Node as ReactFlowNode } from 'reactflow';
import { TrainNodeType } from './Train/types';
import { NodeRunningStatus } from '../../types';
import { PromptNodeType } from './Prompt/types';

export enum BlockEnum {
  Train = 'train',
  Dataset = 'dataset',
  Prompt = 'prompt',
  Model = 'model',
}

export enum IOType {
  text = 'text',
  kv = 'kv',
  llm = 'llm',
  file = 'file',
}

export const IOTypeLabels: Record<IOType, string> = {
  [IOType.text]: 'Text',
  [IOType.kv]: 'Key-Value Pairs',
  [IOType.llm]: 'LLM',
  [IOType.file]: 'File',
};

export type CommonNodeType = {
  connectedSourceHandleIds?: string[];
  connectedTargetHandleIds?: string[];
  _runningStatus?: NodeRunningStatus;
  _singleRunningStatus?: NodeRunningStatus;
  isCandidate?: boolean;
  _children?: string[];
  _hover?: boolean;
  selected?: boolean;
  type: BlockEnum;
  title: string;
};
export type CommonEdgeType = {
  _hovering?: boolean;
  connectedNodeIsEntered?: boolean;
  _connectedNodeIsSelected?: boolean;
  _runned?: boolean;
  _isBundled?: boolean;
  sourceType: BlockEnum;
  targetType: BlockEnum;
};

export type AllNodeTypes =
  | DatasetNodeType
  | ModelNodeType
  | TrainNodeType
  | PromptNodeType;

export type Node<T extends AllNodeTypes = AllNodeTypes> = ReactFlowNode<T>;

export interface NodeProps<T extends AllNodeTypes = AllNodeTypes> {
  id: string;
  data: T;
}
