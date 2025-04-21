import React, { memo, useMemo } from 'react';

import { useEdges } from 'reactflow';
import { canRunBySingle } from '@/src/components/workflow/utils';
import {
  useNodesExtraData,
  useNodesInteractions,
  useNodesReadOnly,
} from '@/src/components/workflow/hooks/hooks';
import { BlockEnum, Node } from '@/app/workflows/[id]/_components/nodes/types';
import { useNodeDataUpdate } from '../../../hooks';

type PanelOperatorPopupProps = {
  id: string;
  data: Node['data'];
  onClosePopup: () => void;
  showHelpLink?: boolean;
};
const PanelOperatorPopup = ({
  id,
  data,
  onClosePopup,
}: PanelOperatorPopupProps) => {
  const edges = useEdges();
  const {
    handleNodeDelete,
    handleNodesDuplicate,
    handleNodeSelect,
    handleNodesCopy,
  } = useNodesInteractions();
  const { handleNodeDataUpdate } = useNodeDataUpdate();
  const { nodesReadOnly } = useNodesReadOnly();
  const nodesExtraData = useNodesExtraData();
  const edge = edges.find((edge) => edge.target === id);

  const about = useMemo(() => {
    return nodesExtraData[data.type].about;
  }, [data, nodesExtraData]);

  const showChangeBlock = !nodesReadOnly;

  return (
    <div className="w-[240px] border-[0.5px] border-gray-200 rounded-lg shadow-xl bg-white text-gray-800">
      {(showChangeBlock || canRunBySingle(data.type)) && (
        <>
          <div className="p-1">
            {canRunBySingle(data.type) && (
              <div
                className={`
                      flex items-center px-3 h-8 text-sm text-gray-700 rounded-lg cursor-pointer
                      hover:bg-gray-50
                    `}
                onClick={() => {
                  handleNodeSelect(id);
                  handleNodeDataUpdate({ id, data: { _isSingleRun: true } });
                  onClosePopup();
                }}
              >
                Run this step
              </div>
            )}
          </div>
          <div className="h-[1px] bg-gray-100"></div>
        </>
      )}
      {!nodesReadOnly && (
        <>
          <div className="p-1">
            <div
              className="flex items-center justify-between px-3 h-8 text-sm text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => {
                onClosePopup();
                handleNodesCopy();
              }}
            >
              Copy
            </div>
            <div
              className="flex items-center justify-between px-3 h-8 text-sm text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => {
                onClosePopup();
                handleNodesDuplicate();
              }}
            >
              Duplicate
            </div>
          </div>
          <div className="h-[1px] bg-gray-100"></div>
          <div className="p-1">
            <div
              className={`
                flex items-center justify-between px-3 h-8 text-sm text-gray-700 rounded-lg cursor-pointer
                hover:bg-rose-50 hover:text-red-500
                `}
              onClick={() => handleNodeDelete(id)}
            >
              Delete
            </div>
          </div>
          <div className="h-[1px] bg-gray-100"></div>
        </>
      )}
      <div className="p-1">
        <div className="px-3 py-2 text-xs text-gray-500">
          <div className="flex items-center mb-1 h-[22px] font-medium">
            ABOUT
          </div>
          <div className="mb-1 text-gray-700 leading-[18px]">{about}</div>
        </div>
      </div>
    </div>
  );
};

export default memo(PanelOperatorPopup);
