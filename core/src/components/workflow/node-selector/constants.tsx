import type { Block } from '../types';
import { BlockEnum } from '../types';
import { BlockClassificationEnum } from './types';

export const BLOCKS: Block[] = [
  {
    classification: BlockClassificationEnum.Default,
    type: BlockEnum.Start,
    title: 'Start',
    description: '',
  },
  {
    classification: BlockClassificationEnum.Logic,
    type: BlockEnum.IfElse,
    title: 'IF/ELSE',
  },
];

export const BLOCK_CLASSIFICATIONS: string[] = [
  BlockClassificationEnum.Default,
  BlockClassificationEnum.QuestionUnderstand,
  BlockClassificationEnum.Logic,
  BlockClassificationEnum.Transform,
  BlockClassificationEnum.Utilities,
];
