'use client';
import type { FC } from 'react';
import React from 'react';
import cn from 'classnames';

type Props = {
  isFocus?: boolean;
  onFocus?: () => void;
  value: string;
  children?: React.ReactNode;
  wrapClassName?: string;
  textClassName?: string;
  readonly?: boolean;
};

const SupportVarInput: FC<Props> = ({
  isFocus,
  onFocus,
  children,
  value,
  wrapClassName,
  textClassName,
  readonly,
}) => {
  return (
    <div className={cn(wrapClassName, 'flex w-full h-full')} onClick={onFocus}>
      {isFocus && !readonly && children ? (
        children
      ) : (
        <div
          className={cn(
            textClassName,
            'w-0 grow h-full whitespace-nowrap truncate'
          )}
          title={value}
        ></div>
      )}
    </div>
  );
};
export default React.memo(SupportVarInput);
