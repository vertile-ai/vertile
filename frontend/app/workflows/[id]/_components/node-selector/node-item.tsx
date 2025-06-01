import { TooltipPlus } from '@/app/components/ui/TooltipPlus';
import { DraggableNode } from './draggable-node';
import { Question } from '@phosphor-icons/react';

export const NodeItem = ({ type, icon, label, tooltip }) => {
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
