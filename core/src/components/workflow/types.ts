import type {
  Edge as ReactFlowEdge,
  Node as ReactFlowNode,
  Viewport,
} from 'reactflow';
import { ModelNode } from './nodes/Model/types';
import { TrainNode } from './nodes/Train/types';
import { StartNode } from './nodes/start/types';
import { DatasetNode } from '@/app/workflows/[id]/_components/nodes/Dataset/types';

export type ToolDefaultValue = {
  provider_id: string;
  provider_type: string;
  provider_name: string;
  tool_name: string;
  tool_label: string;
  title: string;
};

export type NodeTracing = {
  id: string;
  index: number;
  predecessor_node_id: string;
  node_id: string;
  node_type: BlockEnum;
  title: string;
  inputs: any;
  process_data: any;
  outputs?: any;
  status: string;
  error?: string;
  elapsed_time: number;
  execution_metadata: {
    total_tokens: number;
    total_price: number;
    currency: string;
    steps_boundary: number[];
  };
  metadata: {
    iterator_length: number;
  };
  created_at: number;
  created_by: {
    id: string;
    name: string;
    email: string;
  };
  finished_at: number;
  extras?: any;
  expand?: boolean; // for UI
  details?: NodeTracing[][]; // iteration detail
};

export type NodesExtraData = {
  about: string;
  availablePrevNodes: BlockEnum[];
  availableNextNodes: BlockEnum[];
  getAvailablePrevNodes: () => BlockEnum[];
  getAvailableNextNodes: () => BlockEnum[];
  checkValid: any;
};

export enum TransferMethod {
  all = 'all',
  local_file = 'local_file',
  remote_url = 'remote_url',
}

export enum BlockEnum {
  Start = 'start',
  IfElse = 'if-else',
  Train = 'train',
  Dataset = 'dataset',
  Model = 'model',
  Prompt = 'prompt',
}

export type Branch = {
  id: string;
  name: string;
};

export type CommonNodeType = {
  connectedSourceHandleIds?: string[];
  connectedTargetHandleIds?: string[];
  _targetBranches?: Branch[];
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

export type AllNodeTypes = StartNode | DatasetNode | ModelNode | TrainNode;
export interface GraphNode extends CommonNodeType {
  id: string;
  title: string;
  desc?: string;
}

export type Node<T extends AllNodeTypes = AllNodeTypes> = ReactFlowNode<T>;
export type SelectedNode<T extends AllNodeTypes = AllNodeTypes> = Pick<
  Node<T>,
  'id' | 'data'
>;
export interface NodeProps<T extends AllNodeTypes = AllNodeTypes> {
  id: string;
  data: T;
}
export interface NodePanelProps<T extends AllNodeTypes = AllNodeTypes> {
  id: string;
  data: T;
}
export type Edge = ReactFlowEdge<CommonEdgeType>;

export type ValueSelector = string[]; // [nodeId, key | obj key path]
export enum VarType {
  variable = 'variable',
  constant = 'constant',
  mixed = 'mixed',
}
export interface Variable {
  variable: string;
  label?:
    | string
    | {
        nodeType: BlockEnum;
        nodeName: string;
        variable: string;
      };
  value_selector: ValueSelector;
  variable_type?: VarType;
  value?: string;
  options?: string[];
  required?: boolean;
  isParagraph?: boolean;
}

export enum InputVarType {
  textInput = 'text-input',
  paragraph = 'paragraph',
  select = 'select',
  number = 'number',
  url = 'url',
  files = 'files',
  json = 'json', // obj, array
  contexts = 'contexts', // knowledge retrieval
  iterator = 'iterator', // iteration input
}

export type InputVar = {
  type: InputVarType;
  label:
    | string
    | {
        nodeType: BlockEnum;
        nodeName: string;
        variable: string;
      };
  variable: string;
  max_length?: number;
  default?: string;
  required: boolean;
  hint?: string;
  options?: string[];
};

export type ModelConfig = {
  provider: string;
  name: string;
  mode: string;
  completion_params: Record<string, any>;
};

export enum VarType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  object = 'object',
  array = 'array',
  arrayString = 'array[string]',
  arrayNumber = 'array[number]',
  arrayObject = 'array[object]',
  arrayFile = 'array[file]',
  any = 'any',
}

export type Var = {
  variable: string;
  type: VarType;
  children?: Var[]; // if type is obj, has the children struct
  isParagraph?: boolean;
  isSelect?: boolean;
  options?: string[];
  required?: boolean;
};

export type NodeOutPutVar = {
  nodeId: string;
  title: string;
  vars: Var[];
  isStartNode?: boolean;
};

export type Block = {
  classification?: string;
  type: BlockEnum;
  title: string;
  description?: string;
};

export type NodeDefault<T> = {
  defaultValue: Partial<T>;
  getAvailablePrevNodes: () => BlockEnum[];
  getAvailableNextNodes: () => BlockEnum[];
  checkValid: (
    payload: T,
    t: any,
    moreDataForCheckValid?: any
  ) => { isValid: boolean; errorMessage?: string };
};

export type OnSelectBlock = (
  type: BlockEnum,
  toolDefaultValue?: ToolDefaultValue
) => void;

export enum WorkflowRunningStatus {
  Waiting = 'waiting',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Stopped = 'stopped',
}

export enum NodeRunningStatus {
  NotStart = 'not-start',
  Waiting = 'waiting',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export type OnNodeAdd = (
  newNodePayload: {
    nodeType: BlockEnum;
    sourceHandle?: string;
    targetHandle?: string;
    toolDefaultValue?: ToolDefaultValue;
  },
  oldNodesPayload: {
    prevNodeId?: string;
    prevNodeSourceHandle?: string;
    nextNodeId?: string;
    nextNodeTargetHandle?: string;
  }
) => void;

export enum ChangeType {
  changeVarName = 'changeVarName',
  remove = 'remove',
}

export type MoreInfo = {
  type: ChangeType;
  payload?: {
    beforeKey: string;
    afterKey?: string;
  };
};
