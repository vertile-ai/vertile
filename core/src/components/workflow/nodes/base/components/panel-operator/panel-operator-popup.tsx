import { memo, useMemo } from 'react';

import { useEdges } from 'reactflow';
import ChangeBlock from './change-block';
import { canRunBySingle } from '@/src/components/workflow/utils';
import {
  useNodesExtraData,
  useNodesInteractions,
  useNodesReadOnly,
} from '@/src/components/workflow/hooks/hooks';
import type { Node } from '@/src/components/workflow/types';
import { BlockEnum } from '@/src/components/workflow/types';
import React from 'react';
import { useNodeDataUpdate } from '@/src/components/workflow/hooks/use-node-crud';

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

  const showChangeBlock = data.type !== BlockEnum.Start && !nodesReadOnly;

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
            {showChangeBlock && (
              <ChangeBlock
                nodeId={id}
                nodeData={data}
                sourceHandle={edge?.sourceHandle || 'source'}
              />
            )}
          </div>
          <div className="h-[1px] bg-gray-100"></div>
        </>
      )}
      {data.type !== BlockEnum.Start && !nodesReadOnly && (
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
