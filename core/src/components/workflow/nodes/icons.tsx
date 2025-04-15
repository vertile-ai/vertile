import type { FC } from 'react';
import { memo } from 'react';
import { BlockEnum } from '../types';
import AppIcon from '@/src/components/reusable/AppIcon.component';
import React from 'react';
import { GitBranch, HouseLine } from '@phosphor-icons/react';

type BlockIconProps = {
  type: BlockEnum;
  size?: string;
  className?: string;
  toolIcon?: string | { content: string; background: string };
};
const ICON_CONTAINER_CLASSNAME_SIZE_MAP: Record<string, string> = {
  xs: 'w-4 h-4 rounded-[5px] shadow-xs',
  sm: 'w-5 h-5 rounded-md shadow-xs',
  md: 'w-6 h-6 rounded-lg shadow-md',
};
const getIcon = (type: BlockEnum, className: string) => {
  return {
    [BlockEnum.Start]: <HouseLine className={className} />,
    [BlockEnum.IfElse]: <GitBranch className={className} />,
  }[type];
};
const ICON_CONTAINER_BG_COLOR_MAP: Record<string, string> = {
  [BlockEnum.Start]: 'bg-primary-500',
  [BlockEnum.IfElse]: 'bg-[#06AED4]',
};
const NodeIcon: FC<BlockIconProps> = ({ type, size = 'sm', className }) => {
  return (
    <div
      className={`
      flex items-center justify-center border-[0.5px] border-white/[0.02] text-white
      ${ICON_CONTAINER_CLASSNAME_SIZE_MAP[size]} 
      ${ICON_CONTAINER_BG_COLOR_MAP[type]}
      ${className}
    `}
    >
      {getIcon(type, size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5')}
      <AppIcon size={26} color="#2E90FA" />
    </div>
  );
};

export const VarBlockIcon: FC<BlockIconProps> = ({ type, className }) => {
  return <>{getIcon(type, `w-3 h-3 ${className}`)}</>;
};

export default memo(NodeIcon);
