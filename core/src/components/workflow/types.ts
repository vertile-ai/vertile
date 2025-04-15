import type {
  Edge as ReactFlowEdge,
  Node as ReactFlowNode,
  Viewport,
} from 'reactflow';
import { DatasetNode } from './nodes/Dataset/types';
import { ModelNode } from './nodes/Model/types';
import { TrainNode } from './nodes/Train/types';
import { StartNode } from './nodes/start/types';
import { AllHTMLAttributes } from 'react';
import { IOType } from './io.types';

export type ToolDefaultValue = {
  provider_id: string;
  provider_type: string;
  provider_name: string;
  tool_name: string;
  tool_label: string;
  title: string;
};

export enum CollectionType {
  all = 'all',
  builtIn = 'builtin',
  custom = 'api',
  model = 'model',
  workflow = 'workflow',
}

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

export type Collection = {
  id: string;
  name: string;
  description: string;
  icon: string;
  labels: string[];
};

export type ToolParameter = {
  name: string;
  label: string;
  human_description: string;
  type: string;
  form: string;
  llm_description: string;
  required: boolean;
  default: string;
  options?: {
    label: string;
    value: string;
  }[];
  min?: number;
  max?: number;
};

export type ToolVarInputs = Record<
  string,
  {
    type: VarType;
    value?: string | ValueSelector;
  }
>;

export type ToolNodeType = CommonNodeType & {
  provider_id: string;
  provider_type: CollectionType;
  provider_name: string;
  tool_name: string;
  tool_label: string;
  tool_parameters: ToolVarInputs;
  tool_configurations: Record<string, any>;
};
export type NodesExtraData = {
  about: string;
  availablePrevNodes: BlockEnum[];
  availableNextNodes: BlockEnum[];
  getAvailablePrevNodes: () => BlockEnum[];
  getAvailableNextNodes: () => BlockEnum[];
  checkValid: any;
};

export type Tool = {
  name: string;
  label: string;
  description: any;
  parameters: ToolParameter[];
  labels: string[];
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


export type CustomNodeType = 'custom';


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
}

export type CommonEdgeType = {
  _hovering?: boolean;
  connectedNodeIsEntered?: boolean;
  _connectedNodeIsSelected?: boolean;
  _runned?: boolean;
  _isBundled?: boolean;
  sourceType: BlockEnum;
  targetType: BlockEnum;
}

export type AllNodeTypes = StartNode | DatasetNode | ModelNode | TrainNode;
export interface GraphNode extends CommonNodeType {
  id: string;
  title: string;
  desc?: string;
}


export type Node<T extends AllNodeTypes = AllNodeTypes> = ReactFlowNode<T>;
export type SelectedNode<T extends AllNodeTypes = AllNodeTypes> = Pick<Node<T>, 'id' | 'data'>;
export interface NodeProps<T extends AllNodeTypes = AllNodeTypes> {
  id: string; 
  data: T;
}
export interface NodePanelProps<T extends AllNodeTypes = AllNodeTypes> {
  id: string;
  data: T;
}
export type Edge = ReactFlowEdge<CommonEdgeType>;


export interface GraphEdge {
  id: string;
  inDegree: string;
  outDegree: string;
}

export interface WorkflowGraphRecord {
  id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  viewport: Viewport;
}

export interface WorkflowDataUpdator {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

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

export interface VariableWithValue {
  key: string;
  value: string;
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

export enum PromptRole {
  system = 'system',
  user = 'user',
  assistant = 'assistant',
}

export enum EditionType {
  basic = 'basic',
  jinja2 = 'jinja2',
}

export type PromptItem = {
  id?: string;
  role?: PromptRole;
  text: string;
  edition_type?: EditionType;
  jinja2_text?: string;
};

export enum MemoryRole {
  user = 'user',
  assistant = 'assistant',
}

export type RolePrefix = {
  user: string;
  assistant: string;
};

export type Memory = {
  role_prefix?: RolePrefix;
  window: {
    enabled: boolean;
    size: number | string | null;
  };
  query_prompt_template: string;
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

export type CheckValidRes = {
  isValid: boolean;
  errorMessage?: string;
};

export type RunFile = {
  type: string;
  transfer_method: TransferMethod[];
  url?: string;
  upload_file_id?: string;
};

export type WorkflowRunningData = {
  task_id?: string;
  message_id?: string;
  conversation_id?: string;
  result: {
    sequence_number?: number;
    workflow_id?: string;
    inputs?: string;
    process_data?: string;
    outputs?: string;
    status: string;
    error?: string;
    elapsed_time?: number;
    total_tokens?: number;
    created_at?: number;
    created_by?: string;
    finished_at?: number;
    steps?: number;
    showSteps?: boolean;
    total_steps?: number;
  };
  tracing?: NodeTracing[];
};

export type HistoryWorkflowData = {
  id: string;
  sequence_number: number;
  status: string;
  conversation_id?: string;
};

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

export type ToolWithProvider = Collection & {
  tools: Tool[];
};
