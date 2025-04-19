import { DatasetNodeType } from './Dataset/types';
import { ModelNode } from '@/src/components/workflow/nodes/Model/types';
import { StartNode } from '@/src/components/workflow/nodes/start/types';
import { TrainNode } from '@/src/components/workflow/nodes/Train/types';
import { NodeRunningStatus } from '@/src/components/workflow/types';
import type { Edge as ReactFlowEdge, Node as ReactFlowNode } from 'reactflow';

export enum BlockEnum {
  Start = 'start',
  IfElse = 'if-else',
  Train = 'train',
  Dataset = 'dataset',
  Model = 'model',
  Prompt = 'prompt',
}

export type CommonNodeType = {
  connectedSourceHandleIds?: string[];
  connectedTargetHandleIds?: string[];
  _runningStatus?: NodeRunningStatus;
  _singleRunningStatus?: NodeRunningStatus;
  isCandidate?: boolean;
  _children?: string[];
  _isEntering?: boolean;
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

export type AllNodeTypes = StartNode | DatasetNodeType | ModelNode | TrainNode;
export interface GraphNode extends CommonNodeType {
  id: string;
  title: string;
  desc?: string;
}

export type Node<T extends AllNodeTypes = AllNodeTypes> = ReactFlowNode<T>;

export interface NodeProps<T extends AllNodeTypes = AllNodeTypes> {
  id: string;
  data: T;
}
