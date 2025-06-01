import type { NodesExtraData } from '../../types';
import { BlockEnum, IOType } from '../nodes/types';
import { ComponentType } from 'react';
import TrainNode, {
  TrainDefault,
} from '@/app/workflows/[id]/_components/nodes/Train';
import DatasetNode, {
  DatasetDefault,
} from '@/app/workflows/[id]/_components/nodes/Dataset';
import ModelNodeImpl, { ModelDefault } from '../nodes/Model';
import PromptNodeImpl, { PromptDefault } from '../nodes/Prompt';

export const COMPOSE_MODE = 0b01;
export const EXECUTIONS_MODE = 0b10;

export const NodeComponentMap: Record<BlockEnum, ComponentType<any>> = {
  [BlockEnum.Dataset]: DatasetNode,
  [BlockEnum.Train]: TrainNode,
  [BlockEnum.Model]: ModelNodeImpl,
  [BlockEnum.Prompt]: PromptNodeImpl,
};

// This k-v map means, these v nodes can accept input k.
export const NodeInputTypesReverse: Record<IOType, BlockEnum[]> = {
  [IOType.llm]: [BlockEnum.Prompt, BlockEnum.Train],
  [IOType.text]: [BlockEnum.Prompt],
  [IOType.kv]: [BlockEnum.Prompt],
  [IOType.file]: [],
};

// This k-v map means, these v nodes can output k.
export const NodeOutputTypesReverse: Record<IOType, BlockEnum[]> = {
  [IOType.llm]: [BlockEnum.Train],
  [IOType.text]: [BlockEnum.Prompt],
  [IOType.kv]: [BlockEnum.Prompt],
  [IOType.file]: [BlockEnum.Dataset],
};

export const NODES_EXTRA_DATA: Record<BlockEnum, NodesExtraData> = {
  [BlockEnum.Dataset]: {
    about: '',
    availablePrevNodes: [],
    availableNextNodes: [],
    getAvailablePrevNodes: DatasetDefault.getAvailablePrevNodes,
    getAvailableNextNodes: DatasetDefault.getAvailableNextNodes,
    checkValid: DatasetDefault.checkValid,
  },
  [BlockEnum.Train]: {
    about: '',
    availablePrevNodes: [],
    availableNextNodes: [],
    getAvailablePrevNodes: TrainDefault.getAvailablePrevNodes,
    getAvailableNextNodes: TrainDefault.getAvailableNextNodes,
    checkValid: TrainDefault.checkValid,
  },
  [BlockEnum.Model]: {
    about: '',
    availablePrevNodes: [],
    availableNextNodes: [],
    getAvailablePrevNodes: ModelDefault.getAvailablePrevNodes,
    getAvailableNextNodes: ModelDefault.getAvailableNextNodes,
    checkValid: ModelDefault.checkValid,
  },
  [BlockEnum.Prompt]: {
    about: 'Generate text using a prompt and a model',
    availablePrevNodes: [],
    availableNextNodes: [],
    getAvailablePrevNodes: PromptDefault.getAvailablePrevNodes,
    getAvailableNextNodes: PromptDefault.getAvailableNextNodes,
    checkValid: PromptDefault.checkValid,
  },
};

export const NODES_INITIAL_DATA = {
  [BlockEnum.Dataset]: {
    type: BlockEnum.Dataset,
    ...DatasetDefault.defaultValue,
  },
  [BlockEnum.Train]: {
    type: BlockEnum.Train,
    title: 'Training',
    desc: '',
    ...TrainDefault.defaultValue,
  },
  [BlockEnum.Model]: {
    type: BlockEnum.Model,
    title: 'Model',
    desc: '',
    ...ModelDefault.defaultValue,
  },
  [BlockEnum.Prompt]: {
    type: BlockEnum.Prompt,
    title: 'Prompt',
    desc: 'Generate text using a prompt and a model',
    ...PromptDefault.defaultValue,
  },
};

export const NODE_WIDTH = 240;
// Node's height is not certain
export const X_OFFSET = 60;
export const NODE_WIDTH_X_OFFSET = NODE_WIDTH + X_OFFSET;
export const Y_OFFSET = 39;
export const MAX_TREE_DEEPTH = 50;
export const START_INITIAL_POSITION = { x: 80, y: 282 };
export const AUTO_LAYOUT_OFFSET = {
  x: -42,
  y: 243,
};
export const ITERATION_NODE_Z_INDEX = 1;
export const ITERATION_CHILDREN_Z_INDEX = 1002;
export const ITERATION_PADDING = {
  top: 85,
  right: 16,
  bottom: 20,
  left: 16,
};
