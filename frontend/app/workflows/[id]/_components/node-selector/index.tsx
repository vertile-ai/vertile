import {
  Database,
  HouseLine,
  MathOperations,
  PlusCircle,
  Question,
  X,
} from '@phosphor-icons/react';
import cn from 'classnames';
import React, { useState, useEffect } from 'react';
import { TooltipPlus } from '@/app/components/ui/TooltipPlus';
import { BlockEnum } from '@/app/workflows/[id]/_components/nodes/types';
import { useReactFlow } from 'reactflow';
import {
  EXECUTIONS_MODE,
  NODE_WIDTH,
} from '@/app/workflows/[id]/_components/workflow-main/const';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';

// Simplified DraggableNode component that uses HTML5 drag and drop API
const DraggableNode = ({ type, children, className }) => {
  const { getZoom } = useReactFlow();

  // Handle drag start event
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Set the data that will be used when dropping
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'move';

    // Get the icon element from the children
    const iconElement = e.currentTarget.querySelector('svg');
    const iconHTML = iconElement ? iconElement.outerHTML : '';
    const nodeLabel =
      e.currentTarget.querySelector('span')?.textContent || type;

    // Get current zoom level
    const zoom = getZoom();

    // Base dimensions
    const baseWidth = NODE_WIDTH;
    const baseHeight = 100;
    const baseFontSize = 14;
    // Create a ghost image for dragging
    const ghostElement = document.createElement('div');
    ghostElement.classList.add(
      'flex',
      'items-center',
      'gap-2',
      'bg-indigo-100',
      'p-2',
      'rounded',
      'border',
      'border-indigo-300'
    );
    ghostElement.innerHTML = `
      <div class="flex items-center">
        ${iconHTML}
        <span class="ml-2 text-sm font-medium">New ${nodeLabel} Node</span>
      </div>
    `;
    ghostElement.style.position = 'absolute';
    ghostElement.style.top = '-1000px';

    // Set the ghost element size and scale it according to zoom
    ghostElement.style.width = `${baseWidth * zoom}px`;
    ghostElement.style.height = `${baseHeight * zoom}px`;
    // help me set span font size according to zoom
    const spanElement = ghostElement.querySelector('span');
    spanElement!.style.fontSize = `${Math.floor(baseFontSize * zoom)}px`;
    document.body.appendChild(ghostElement);

    e.dataTransfer.setDragImage(ghostElement, 0, 0);

    // Remove the ghost element after a short delay
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 100);
  };

  return (
    <div
      className={cn(
        'cursor-grab active:cursor-grabbing',
        className,
        'transition-all duration-200'
      )}
      draggable="true"
      onDragStart={handleDragStart}
    >
      {children}
    </div>
  );
};

// Individual node item component
const NodeItem = ({ type, icon, label, tooltip }) => {
  return (
    <TooltipPlus
      position="right"
      offset={4}
      hideArrow
      popupClassName="!p-0 !bg-white"
      popupContent={
        <div className="flex items-center gap-1 px-2 h-6 text-xs font-medium text-gray-700 rounded-lg border-[0.5px] border-gray-200">
          {tooltip}
        </div>
      }
    >
      <DraggableNode
        type={type}
        className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 p-3 rounded-lg mx-2 mb-2 border border-gray-100"
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-3 text-sm font-medium text-gray-700">
            {label}
          </span>
        </div>
        <Question size={16} color={'#9CA3AF'} />
      </DraggableNode>
    </TooltipPlus>
  );
};

export const NodeSelector = () => {
  // Get the workflow mode and visibility from the store
  const workflowMode = useStore((state) => state.workflowMode);
  const nodeSelectorVisible = useStore((state) => state.nodeSelectorVisible);
  const setNodeSelectorVisible = useStore(
    (state) => state.setNodeSelectorVisible
  );

  // Local state for animation control
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(true);

  // Don't render the selector in pipeline mode
  if (workflowMode === EXECUTIONS_MODE) {
    return null;
  }

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setNodeSelectorVisible(false);
      setIsClosing(false);
    }, 300); // Match the animation duration
  };

  // Handle opening animation
  useEffect(() => {
    if (nodeSelectorVisible) {
      setIsOpening(true);
      // Trigger opening animation after component mounts
      const timer = setTimeout(() => {
        setIsOpening(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodeSelectorVisible]);

  // Don't render if not visible and not animating
  if (!nodeSelectorVisible && !isClosing) {
    return null;
  }

  return (
    <div
      className={`w-[280px] h-full bg-white border-r border-gray-200 flex flex-col relative z-[100] transform transition-all duration-300 ease-out ${
        isClosing
          ? '-translate-x-full opacity-0'
          : isOpening
            ? '-translate-x-full opacity-0'
            : 'translate-x-0 opacity-100'
      }`}
      style={{
        animation: isClosing
          ? 'slideOut 0.3s ease-out forwards'
          : 'slideIn 0.3s ease-out forwards',
      }}
    >
      <button
        onClick={handleClose}
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
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onOpen();
    // Reset the clicked state after animation
    setTimeout(() => setIsClicked(false), 200);
  };

  return (
    <div className="absolute top-4 left-4 z-50">
      <button
        onClick={handleClick}
        className={`flex items-center justify-center w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${
          isClicked ? 'scale-95' : ''
        }`}
        style={{
          animation: 'fadeInScale 0.3s ease-out forwards',
        }}
        aria-label="Open node selector"
      >
        <PlusCircle size={24} weight="bold" />
      </button>
    </div>
  );
};
