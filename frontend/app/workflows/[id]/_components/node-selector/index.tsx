import {
  Database,
  HouseLine,
  MathOperations,
  PlusCircle,
  X,
} from '@phosphor-icons/react';
import { BlockEnum } from '@/app/workflows/[id]/_components/nodes/types';
import { EXECUTIONS_MODE } from '@/app/workflows/[id]/_components/workflow-main/const';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';
import './style.css';
import { NodeItem } from './node-item';

export const NodeSelector = () => {
  // Get the workflow mode and visibility from the store
  const workflowMode = useStore((state) => state.workflowMode);
  const nodeSelectorVisible = useStore((state) => state.nodeSelectorVisible);
  const setNodeSelectorVisible = useStore(
    (state) => state.setNodeSelectorVisible
  );

  // Don't render the selector in pipeline mode
  if (workflowMode === EXECUTIONS_MODE) {
    return null;
  }

  return (
    <div
      className={`w-[280px] h-full bg-white border-r border-gray-200 flex flex-col relative z-[100] ${
        nodeSelectorVisible
          ? 'node-selector-enter'
          : 'node-selector-exit pointer-events-none'
      }`}
    >
      <button
        onClick={() => setNodeSelectorVisible(false)}
        className="flex items-center justify-center w-8 h-8 z-[101] absolute top-1 right-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Close node selector"
      >
        <X size={18} weight="bold" />
      </button>

      {/* Nodes Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Data Section */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            Data
          </h4>
          <NodeItem
            type={BlockEnum.Dataset}
            icon={<Database size={20} color="#6366F1" weight="fill" />}
            label="Dataset"
            tooltip="Use the Dataset node to specify your input data"
          />
        </div>

        {/* AI/ML Section */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            AI & ML
          </h4>
          <NodeItem
            type={BlockEnum.Train}
            icon={<MathOperations size={20} color="#6366F1" weight="fill" />}
            label="Train"
            tooltip="Use the Train node to specify a model training job"
          />
          <NodeItem
            type={BlockEnum.Model}
            icon={<PlusCircle size={20} color="#6366F1" weight="fill" />}
            label="Model"
            tooltip="Use the Model node to specify which model to use"
          />
          <NodeItem
            type={BlockEnum.Prompt}
            icon={<HouseLine size={20} color="#6366F1" weight="fill" />}
            label="Prompt"
            tooltip="Use the Prompt node to create prompts for your model"
          />
        </div>
      </div>
    </div>
  );
};

// Export a separate component for the floating button
export const NodeSelectorToggle = ({ onOpen }: { onOpen: () => void }) => {
  return (
    <div className="absolute top-4 left-4 z-50">
      <button
        onClick={onOpen}
        className="flex items-center justify-center w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
        aria-label="Open node selector"
      >
        <PlusCircle size={24} weight="bold" />
      </button>
    </div>
  );
};
