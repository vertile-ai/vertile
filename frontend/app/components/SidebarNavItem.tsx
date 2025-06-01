import React from 'react';
import { TooltipPlus } from './ui/TooltipPlus';

interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  tooltipContent?: React.ReactNode;
  isActive: boolean;
  expanded: boolean;
  onClick: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon,
  label,
  tooltipContent,
  isActive,
  expanded,
  onClick,
}) => {
  if (expanded) {
    return (
      <button
        onClick={onClick}
        className={`flex rounded-sm px-1 py-2 text-gray-600 items-center hover:bg-gray-100 transition-all 
          duration-300 w-full ${isActive ? 'bg-gray-100' : ''}`}
      >
        <div className="flex items-center justify-center">{icon}</div>
        <span
          className={`${isActive ? 'text-primary-500' : 'text-gray-500'} whitespace-nowrap 
          overflow-hidden ml-2 font-medium`}
        >
          {label}
        </span>
      </button>
    );
  }

  return (
    <TooltipPlus
      position="right"
      offset={4}
      hideArrow
      popupClassName="!p-0 !bg-white"
      popupContent={
        tooltipContent ? (
          tooltipContent
        ) : (
          <div className="flex items-center gap-1 px-2 h-6 text-xs font-medium text-gray-700 rounded-lg border-[0.5px] border-gray-200">
            {label}
          </div>
        )
      }
    >
      <div
        onClick={onClick}
        className="flex mb-3 justify-center items-center 
        transition-all duration-300 w-full h-full cursor-pointer"
      >
        {icon}
      </div>
    </TooltipPlus>
  );
};

export default SidebarNavItem;
