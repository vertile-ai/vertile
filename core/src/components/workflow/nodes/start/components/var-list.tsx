'use client';
import type { FC } from 'react';
import React, { useCallback } from 'react';
import produce from 'immer';

import VarItem from './var-item';
import {
  ChangeType,
  type InputVar,
  type MoreInfo,
} from '@/src/components/workflow/types';
type Props = {
  readonly: boolean;
  list: InputVar[];
  onChange: (
    list: InputVar[],
    moreInfo?: { index: number; payload: MoreInfo }
  ) => void;
};

const VarList: FC<Props> = ({ readonly, list, onChange }) => {
  

  const handleVarChange = useCallback(
    (index: number) => {
      return (payload: InputVar, moreInfo?: MoreInfo) => {
        const newList = produce(list, (draft) => {
          draft[index] = payload;
        });
        onChange(newList, moreInfo ? { index, payload: moreInfo } : undefined);
      };
    },
    [list, onChange]
  );

  const handleVarRemove = useCallback(
    (index: number) => {
      return () => {
        const newList = produce(list, (draft) => {
          draft.splice(index, 1);
        });
        onChange(newList, {
          index,
          payload: {
            type: ChangeType.remove,
            payload: {
              beforeKey: list[index].variable,
            },
          },
        });
      };
    },
    [list, onChange]
  );

  const showNoVarTip = list.length === 0;

  return (
    <div className="space-y-1">
      {list.map((item, index) => (
        <VarItem
          key={index}
          readonly={readonly}
          payload={item}
          onChange={handleVarChange(index)}
          onRemove={handleVarRemove(index)}
          varKeys={list.map((item) => item.variable)}
        />
      ))}
      {showNoVarTip && <div>No variables defined</div>}
    </div>
  );
};
export default React.memo(VarList);
