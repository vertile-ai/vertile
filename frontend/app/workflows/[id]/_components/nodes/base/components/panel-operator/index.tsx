import { memo, useMemo } from 'react';
import { Node } from '@/app/workflows/[id]/_components/nodes/types';
import { canRunBySingle } from '@/app/workflows/[id]/_components/workflow-internal/utils';
import {
  useNodesExtraData,
  useNodesInteractions,
  useNodesReadOnly,
} from '@/app/workflows/[id]/_components/workflow-internal/hooks/hooks';
import { useNodeDataUpdate } from '../../../hooks';
import { useStore } from '../../../../workflow-main/store';
import { Play, Copy, Files, Trash, Info } from '@phosphor-icons/react/dist/ssr';
import { TooltipPlus } from '@/app/components/ui/TooltipPlus';

type PanelOperatorProps = {
  id: string;
  data: Node['data'];
};

const PanelOperator = ({ id, data }: PanelOperatorProps) => {
  // Panel Operator logic
  const {
    handleNodeDelete,
    handleNodesDuplicate,
    handleNodeSelect,
    handleNodesCopy,
  } = useNodesInteractions();
  const { handleNodeDataUpdate } = useNodeDataUpdate();
  const { nodesReadOnly } = useNodesReadOnly();
  const nodesExtraData = useNodesExtraData();

  const hasChanges = useStore((s) => s.hasChanges);
  const setHasChanges = useStore((s) => s.setHasChanges);

  const about = useMemo(() => {
    return nodesExtraData[data.type].about;
  }, [data, nodesExtraData]);

  const canRun = canRunBySingle(data.type);

  return (
    <div className="flex items-center space-x-1">
      {canRun && (
        <TooltipPlus position="bottom" popupContent={<p>Run this step</p>}>
          <button
            className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer hover:bg-gray-100"
            onClick={() => {
              handleNodeSelect(id);
              handleNodeDataUpdate({
                id,
                data: { _isSingleRun: true },
              });
            }}
          >
            <Play size={16} color="#6B7280" weight="fill" />
          </button>
        </TooltipPlus>
      )}

      {!nodesReadOnly && (
        <>
          <TooltipPlus position="bottom" popupContent={<p>Copy</p>}>
            <button
              className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer hover:bg-gray-100"
              onClick={handleNodesCopy}
            >
              <Copy size={16} color="#6B7280" />
            </button>
          </TooltipPlus>

          <TooltipPlus position="bottom" popupContent={<p>Duplicate</p>}>
            <button
              className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer hover:bg-gray-100"
              onClick={handleNodesDuplicate}
            >
              <Files size={16} color="#6B7280" />
            </button>
          </TooltipPlus>

          <TooltipPlus position="bottom" popupContent={<p>Delete</p>}>
            <button
              className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer hover:bg-gray-100 hover:text-red-500"
              onClick={() => {
                handleNodeDelete(id);
                if (!hasChanges) {
                  setHasChanges(true);
                }
              }}
            >
              <Trash size={16} color="#6B7280" />
            </button>
          </TooltipPlus>
        </>
      )}

      <TooltipPlus
        position="bottom"
        popupContent={
          <div className="max-w-[200px]">
            <p className="text-xs font-medium mb-1">ABOUT</p>
            <p className="text-xs">{about}</p>
          </div>
        }
      >
        <button className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer hover:bg-gray-100">
          <Info size={16} color="#6B7280" />
        </button>
      </TooltipPlus>
    </div>
  );
};

export default memo(PanelOperator);
