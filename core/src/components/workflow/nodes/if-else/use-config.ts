import { useCallback } from 'react';
import produce from 'immer';
import type { Var } from '../../types';
import { VarType } from '../../types';
import { LogicalOperator } from './types';
import type { Condition, IfElseNodeType } from './types';
import { useNodeCrud } from '@/src/components/workflow/hooks/use-node-crud';
import {
  useNodesReadOnly,
  useWorkflow,
} from '@/src/components/workflow/hooks/hooks';

const useConfig = (id: string, payload: IfElseNodeType) => {
  const { nodesReadOnly: readOnly } = useNodesReadOnly();

  const { inputs, setInputs } = useNodeCrud<IfElseNodeType>(id, payload);

  const handleConditionsChange = useCallback(
    (newConditions: Condition[]) => {
      const newInputs = produce(inputs, (draft) => {
        draft.conditions = newConditions;
      });
      setInputs(newInputs);
    },
    [inputs, setInputs]
  );

  const handleAddCondition = useCallback(() => {
    const newInputs = produce(inputs, (draft) => {
      draft.conditions.push({
        id: `${Date.now()}`,
        variable_selector: [],
        comparison_operator: undefined,
        value: '',
      });
    });
    setInputs(newInputs);
  }, [inputs, setInputs]);

  const handleLogicalOperatorToggle = useCallback(() => {
    const newInputs = produce(inputs, (draft) => {
      draft.logical_operator =
        draft.logical_operator === LogicalOperator.and
          ? LogicalOperator.or
          : LogicalOperator.and;
    });
    setInputs(newInputs);
  }, [inputs, setInputs]);

  const filterVar = useCallback((varPayload: Var) => {
    return varPayload.type !== VarType.arrayFile;
  }, []);

  return {
    readOnly,
    inputs,
    handleConditionsChange,
    handleAddCondition,
    handleLogicalOperatorToggle,
    filterVar,
  };
};

export default useConfig;
