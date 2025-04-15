import type { FC } from 'react';
import React, { useCallback, useRef } from 'react';
import { useBoolean, useHover } from 'ahooks';

import type { InputVar, MoreInfo } from '@/src/components/workflow/types';
import { ArrowElbowDownRight } from '@phosphor-icons/react';

type Props = {
  readonly: boolean;
  payload: InputVar;
  onChange?: (item: InputVar, moreInfo?: MoreInfo) => void;
  onRemove?: () => void;
  rightContent?: JSX.Element;
  varKeys?: string[];
};

const VarItem: FC<Props> = ({
  readonly,
  payload,
  onChange = () => {},
  onRemove = () => {},
  rightContent,
}) => {
  

  const ref = useRef(null);
  const isHovering = useHover(ref);
  const [
    isShowEditVarModal,
    { setTrue: showEditVarModal, setFalse: hideEditVarModal },
  ] = useBoolean(false);

  const handlePayloadChange = useCallback(
    (payload: InputVar, moreInfo?: MoreInfo) => {
      onChange(payload, moreInfo);
      hideEditVarModal();
    },
    [onChange, hideEditVarModal]
  );
  return (
    <div
      ref={ref}
      className="flex items-center h-8 justify-between px-2.5 bg-gray-900 rounded-lg border border-gray-700 shadow-xs cursor-pointer hover:shadow-md"
    >
      <div className="flex items-center space-x-1 grow w-0">
        <ArrowElbowDownRight className="w-3.5 h-3.5 text-blue-500" />
        <div
          title={payload.variable}
          className="shrink-0 max-w-[130px] truncate text-[13px] font-medium text-gray-300"
        >
          {payload.variable}
        </div>
        {payload.label && (
          <>
            <div className="shrink-0 text-xs font-medium text-gray-600">·</div>
            <div
              title={payload.label as string}
              className="max-w-[130px] truncate text-[13px] font-medium text-gray-400"
            >
              {payload.label as string}
            </div>
          </>
        )}
      </div>
      <div className="shrink-0 ml-2 flex items-center">
        {rightContent || (
          <>
            {!isHovering || readonly ? (
              <>
                {payload.required && (
                  <div className="mr-2 text-xs font-normal text-gray-400">
                    Required
                  </div>
                )}
                <ArrowElbowDownRight
                  type={payload.type}
                  className="w-3.5 h-3.5 text-gray-400"
                />
              </>
            ) : (
              !readonly && (
                <>
                  <div
                    onClick={showEditVarModal}
                    className="mr-1 p-1 rounded-md cursor-pointer hover:bg-gray-800"
                  >
                    <ArrowElbowDownRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div
                    onClick={onRemove}
                    className="p-1 rounded-md cursor-pointer hover:bg-gray-800"
                  >
                    <ArrowElbowDownRight className="w-4 h-4 text-gray-400" />
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default React.memo(VarItem);
