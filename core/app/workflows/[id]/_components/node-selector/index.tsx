import {
  Database,
  HouseLine,
  MathOperations,
  PlusCircle,
  Question,
} from '@phosphor-icons/react';
import cn from 'classnames';
import React from 'react';
import { TooltipPlus } from '@/app/components/ui/TooltipPlus';
import { AnimatedDropdown } from '@/src/components/reusable/AnimatedDropdown.component';
import { BlockEnum } from '@/app/workflows/[id]/_components/nodes/types';
import { useReactFlow } from 'reactflow';
import { NODE_WIDTH } from '@/app/workflows/[id]/const';

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

export const NodeSelector = () => {
  return (
    <AnimatedDropdown size={30} color="#6B7280">
      <div className="flex flex-col items-center pb-2 px-1 w-32 bg-white rounded-md text-gray-800 shadow-md border border-gray-200">
        <TooltipPlus
          position="right"
          offset={4}
          hideArrow
          popupClassName="!p-0 !bg-white"
          popupContent={
            <div className="flex items-center gap-1 px-2 h-6 text-xs font-medium text-gray-700 rounded-lg border-[0.5px] border-gray-200">
              Use the Dataset node to specify your input data
            </div>
          }
        >
          <DraggableNode
            type={BlockEnum.Dataset}
            className="mt-2 flex items-center justify-between w-full cursor-pointer hover:bg-gray-100 p-1 rounded-md"
          >
            <div className="flex items-center">
              <Database size={22} color="#9B7280" weight="fill" />
              <span className="ml-1 text-sm">Dataset</span>
            </div>
            <Question size={18} color={'#6B7280'} />
          </DraggableNode>
        </TooltipPlus>

        <TooltipPlus
          position="right"
          offset={4}
          hideArrow
          popupClassName="!p-0 !bg-white"
          popupContent={
            <div className="flex items-center gap-1 px-2 h-6 text-xs font-medium text-gray-700 rounded-lg border-[0.5px] border-gray-200">
              Use the Train node to specify a model training job
            </div>
          }
        >
          <DraggableNode
            type={BlockEnum.Train}
            className="mt-2 flex items-center justify-between w-full cursor-pointer hover:bg-gray-100 p-1 rounded-md"
          >
            <div className="flex items-center">
              <MathOperations
                size={22}
                color="#6B7280"
                weight="fill"
                className="cursor-pointer"
              />
              <span className="ml-1 text-sm">Train</span>
            </div>
            <Question size={18} color={'#6B7280'} />
          </DraggableNode>
        </TooltipPlus>

        {/* Model Node */}
        <TooltipPlus
          position="right"
          offset={4}
          hideArrow
          popupClassName="!p-0 !bg-white"
          popupContent={
            <div className="flex items-center gap-1 px-2 h-6 text-xs font-medium text-gray-700 rounded-lg border-[0.5px] border-gray-200">
              Use the Model node to specify which model to use
            </div>
          }
        >
          <DraggableNode
            type={BlockEnum.Model}
            className="mt-2 flex items-center justify-between w-full cursor-pointer hover:bg-gray-100 p-1 rounded-md"
          >
            <div className="flex items-center">
              <PlusCircle
                size={22}
                color="#6B7280"
                weight="fill"
                className="cursor-pointer"
              />
              <span className="ml-1 text-sm">Model</span>
            </div>
            <Question size={18} color={'#6B7280'} />
          </DraggableNode>
        </TooltipPlus>

        {/* Prompt Node */}
        <TooltipPlus
          position="right"
          offset={4}
          hideArrow
          popupClassName="!p-0 !bg-white"
          popupContent={
            <div className="flex items-center gap-1 px-2 h-6 text-xs font-medium text-gray-700 rounded-lg border-[0.5px] border-gray-200">
              Use the Prompt node to create prompts for your model
            </div>
          }
        >
          <DraggableNode
            type={BlockEnum.Prompt}
            className="mt-2 flex items-center justify-between w-full cursor-pointer hover:bg-gray-100 p-1 rounded-md"
          >
            <div className="flex items-center">
              <HouseLine
                size={22}
                color="#6B7280"
                weight="fill"
                className="cursor-pointer"
              />
              <span className="ml-1 text-sm">Prompt</span>
            </div>
            <Question size={18} color={'#6B7280'} />
          </DraggableNode>
        </TooltipPlus>
      </div>
    </AnimatedDropdown>
  );
};
