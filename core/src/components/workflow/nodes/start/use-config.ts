import { useCallback, useState } from 'react';
import produce from 'immer';
import { useBoolean } from 'ahooks';
import type { StartNodeType } from './types';
import { useNodeCrud } from '@/src/components/workflow/hooks/use-node-crud';
import { useNodesReadOnly } from '@/src/components/workflow/hooks/hooks';

const useConfig = (id: string, payload: StartNodeType) => {
  const { nodesReadOnly: readOnly } = useNodesReadOnly();

  const { inputs, setInputs } = useNodeCrud(id, payload);

  const [
    isShowAddVarModal,
    { setTrue: showAddVarModal, setFalse: hideAddVarModal },
  ] = useBoolean(false);

  return {
    readOnly,
    inputs,
    isShowAddVarModal,
    showAddVarModal,
    hideAddVarModal,
  };
};

export default useConfig;
