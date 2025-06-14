import { BlockEnum } from './types';

import { IOType } from './types';

export const NodeInputTypes: Record<BlockEnum, IOType[]> = {
  [BlockEnum.Dataset]: [],
  [BlockEnum.Train]: [IOType.llm, IOType.text, IOType.kv, IOType.file],
  [BlockEnum.Model]: [],
  [BlockEnum.LLM]: [IOType.llm, IOType.text, IOType.kv, IOType.file],
};

// Output Should be deterministic
export const NodeOutputTypes: Record<BlockEnum, IOType[]> = {
  [BlockEnum.Dataset]: [IOType.file],
  [BlockEnum.Train]: [IOType.llm],
  [BlockEnum.Model]: [IOType.llm],
  [BlockEnum.LLM]: [IOType.text],
};

// This k-v map means, these v nodes can accept input k.
export const NodeInputTypesReverse: Record<IOType, BlockEnum[]> = {
  [IOType.llm]: [BlockEnum.LLM, BlockEnum.Train],
  [IOType.text]: [BlockEnum.LLM],
  [IOType.kv]: [BlockEnum.LLM],
  [IOType.file]: [BlockEnum.Train],
};

// This k-v map means, these v nodes can output k.
export const NodeOutputTypesReverse: Record<IOType, BlockEnum[]> = {
  [IOType.llm]: [BlockEnum.Train],
  [IOType.text]: [BlockEnum.LLM],
  [IOType.kv]: [BlockEnum.LLM],
  [IOType.file]: [BlockEnum.Dataset],
};
