import { memo } from 'react';
import { MiniMap } from 'reactflow';
import ZoomInOut from './zoom-in-out';
import Control from './control';
import React from 'react';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import { COMPOSE_MODE } from '../workflow-main/const';

const Operator = () => {
  // Get the workflow mode from the store
  const workflowMode = useStore((state) => state.workflowMode);

  return (
    <>
      <MiniMap
        style={{
          width: 102,
          height: 68,
        }}
        className="!absolute !left-4 !bottom-14 z-[9] !m-0 !w-[102px] !h-[72px] !border-[0.5px] !border-black/[0.08] !rounded-lg !shadow-lg"
      />
      <div className="flex items-center mt-1 gap-2 absolute left-4 bottom-4 z-[9]">
        <ZoomInOut />
        {workflowMode === COMPOSE_MODE && <Control />}
      </div>
    </>
  );
};

export default memo(Operator);
