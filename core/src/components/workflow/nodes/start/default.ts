import type { NodeDefault } from '../../types';
import type { StartNodeType } from './types';
import { ALL_COMPLETION_AVAILABLE_BLOCKS } from '@/src/components/workflow/constants';

const StartNodeDefault: NodeDefault<StartNodeType> = {
  defaultValue: {},
  getAvailablePrevNodes() {
    return [];
  },
  getAvailableNextNodes() {
    const nodes = ALL_COMPLETION_AVAILABLE_BLOCKS;
    return nodes;
  },
  checkValid() {
    return {
      isValid: true,
    };
  },
};

export default StartNodeDefault;
