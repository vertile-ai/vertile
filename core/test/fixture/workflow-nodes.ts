import {
  AllNodeTypes,
  BlockEnum,
  CommonEdgeType,
  Edge,
  Node,
} from '@/src/components/workflow/types';

export const initialNodes: Node<AllNodeTypes>[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 50, y: 100 },
    width: 240,
    height: 120,
    data: { desc: '', type: BlockEnum.Start, id: '1', title: 'Start' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 350, y: 100 },
    width: 240,
    height: 120,
    data: {
      desc: '',
      type: BlockEnum.Dataset,
      datasetName: 'soulhq-ai/insuranceQA-v2',
      id: '2',
      title: 'Dataset',
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 650, y: 100 },
    width: 240,
    height: 120,
    data: {
      desc: 'Model for fine-tuning',
      type: BlockEnum.Model,
      modelName: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
      id: '3',
      title: 'Model',
    },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 950, y: 100 },
    width: 240,
    height: 120,
    data: {
      desc: 'Training configuration',
      type: BlockEnum.Train,
      id: '4',
      title: 'Train',
    },
  },
];

// Initial edges
export const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    type: 'custom',
    source: '1',
    target: '2',
    data: {
      _hovering: false,
      connectedNodeIsEntered: false,
      _connectedNodeIsSelected: false,
      _runned: false,
      _isBundled: false,
      sourceType: BlockEnum.Start,
      targetType: BlockEnum.Dataset,
    },
  },
  {
    id: 'e2-3',
    type: 'custom',
    source: '2',
    target: '3',
    data: {
      _hovering: false,
      connectedNodeIsEntered: false,
      _connectedNodeIsSelected: false,
      _runned: false,
      _isBundled: false,
      sourceType: BlockEnum.Dataset,
      targetType: BlockEnum.Model,
    },
  },
  {
    id: 'e3-4',
    type: 'custom',
    source: '3',
    target: '4',
    data: {
      _hovering: false,
      connectedNodeIsEntered: false,
      _connectedNodeIsSelected: false,
      _runned: false,
      _isBundled: false,
      sourceType: BlockEnum.Model,
      targetType: BlockEnum.Train,
    },
  },
];
