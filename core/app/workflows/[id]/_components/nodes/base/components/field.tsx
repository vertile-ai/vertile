'use client';
import type { FC } from 'react';
import React from 'react';
import cn from 'classnames';
import { useBoolean } from 'ahooks';
import type { DefaultTFuncReturn } from 'i18next';
import { CaretCircleDoubleRight, Question } from '@phosphor-icons/react';
import { TooltipPlus } from '@/app/components/ui/TooltipPlus';

type Props = {
  className?: string;
  title: JSX.Element | string | DefaultTFuncReturn;
  tooltip?: string;
  supportFold?: boolean;
  children?: JSX.Element | string | null;
  operations?: JSX.Element;
  inline?: boolean;
};

const Filed: FC<Props> = ({
  className,
  title,
  tooltip,
  children,
  operations,
  inline,
  supportFold,
}) => {
  const [fold, { toggle: toggleFold }] = useBoolean(true);
  return (
    <div
      className={cn(className, inline && 'flex justify-between items-center')}
    >
      <div
        onClick={() => supportFold && toggleFold()}
        className={cn(
          'flex justify-between items-center',
          supportFold && 'cursor-pointer'
        )}
      >
        <div className="flex items-center h-6">
          <div className="text-[13px] font-medium text-gray-300 uppercase">
            {title}
          </div>
          {tooltip && (
            <TooltipPlus
              popupContent={<div className="w-[120px]">{tooltip}</div>}
            >
              <Question className="w-3.5 h-3.5 ml-0.5 text-gray-500" />
            </TooltipPlus>
          )}
        </div>
        <div className="flex">
          {operations && <div>{operations}</div>}
          {supportFold && (
            <CaretCircleDoubleRight
              className="w-3.5 h-3.5 text-gray-400 cursor-pointer transform transition-transform"
              style={{ transform: fold ? 'rotate(0deg)' : 'rotate(90deg)' }}
            />
          )}
        </div>
      </div>
      {children && (!supportFold || (supportFold && !fold)) && (
        <div className={cn(!inline && 'mt-1')}>{children}</div>
      )}
    </div>
  );
};
export default React.memo(Filed);
