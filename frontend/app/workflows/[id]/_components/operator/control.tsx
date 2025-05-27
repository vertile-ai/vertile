import React from 'react';
import { memo, useCallback } from 'react';

import cn from 'classnames';
import {
  useNodesReadOnly,
  useWorkflow,
} from '@/app/workflows/[id]/_components/workflow-internal/hooks/hooks';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import TipPopup from './tip-popup';
import { CursorClick, HandPointing, SquaresFour } from '@phosphor-icons/react';
import { useSelectionInteractions } from '@/app/workflows/[id]/_components/workflow-internal/hooks/use-selection-interactions';

const Control = () => {
  const controlMode = useStore((s) => s.controlMode);
  const setControlMode = useStore((s) => s.setControlMode);
  const { handleLayout } = useWorkflow();
  const { nodesReadOnly, getNodesReadOnly } = useNodesReadOnly();
  const { handleSelectionCancel } = useSelectionInteractions();

  const handleModePointer = useCallback(() => {
    setControlMode('pointer');
  }, [getNodesReadOnly, setControlMode]);
  const handleModeHand = useCallback(() => {
    setControlMode('hand');
    handleSelectionCancel();
  }, [getNodesReadOnly, setControlMode, handleSelectionCancel]);

  return (
    <div className="flex items-center p-0.5 rounded-lg border-[0.5px] border-gray-100 bg-white shadow-lg text-gray-500">
      <div className="mx-[3px] w-[1px] h-3.5 bg-gray-200"></div>
      <TipPopup title="Pointer Mode">
        <div
          className={cn(
            'flex items-center justify-center mr-[1px] w-8 h-8 rounded-lg cursor-pointer',
            controlMode === 'pointer'
              ? 'bg-primary-50 text-primary-600'
              : 'hover:bg-black/5 hover:text-gray-700',
            `${nodesReadOnly && '!cursor-not-allowed opacity-50'}`
          )}
          onClick={handleModePointer}
        >
          {controlMode === 'pointer' ? (
            <CursorClick weight="fill" className="w-4 h-4" />
          ) : (
            <CursorClick weight="regular" className="w-4 h-4" />
          )}
        </div>
      </TipPopup>
      <TipPopup title="Hand Mode">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer',
            controlMode === 'hand'
              ? 'bg-primary-50 text-primary-600'
              : 'hover:bg-black/5 hover:text-gray-700',
            `${nodesReadOnly && '!cursor-not-allowed opacity-50'}`
          )}
          onClick={handleModeHand}
        >
          {controlMode === 'hand' ? (
            <HandPointing weight="fill" className="w-4 h-4" />
          ) : (
            <HandPointing weight="regular" className="w-4 h-4" />
          )}
        </div>
      </TipPopup>
      <div className="mx-[3px] w-[1px] h-3.5 bg-gray-200"></div>
      <TipPopup title="Organize">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg hover:bg-black/5 hover:text-gray-700 cursor-pointer',
            `${nodesReadOnly && '!cursor-not-allowed opacity-50'}`
          )}
          onClick={handleLayout}
        >
          <SquaresFour size={24} />
        </div>
      </TipPopup>
    </div>
  );
};

export default memo(Control);
