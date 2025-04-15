import type { FC } from 'react';
import React from 'react';

import type { NodePanelProps } from '@/src/components/workflow/types';
import Field from '../base/components/field';
import Split from '../base/components/split';
import VarItem from './components/var-item';

const i18nPrefix = 'workflow.nodes.start';

const Panel: FC<NodePanelProps> = () => {
  

  return (
    <div className="mt-2">
      <div className="px-4 pb-2 space-y-4">
        <Field title={t(`${i18nPrefix}.inputField`)} operations={undefined}>
          <>
            <div className="mt-1 space-y-1">
              <Split className="my-2" />
              (
              <VarItem
                readonly
                payload={
                  {
                    variable: 'sys.query',
                  } as any
                }
                rightContent={
                  <div className="text-xs font-normal text-gray-400">
                    String
                  </div>
                }
              />
              )
              <VarItem
                readonly
                payload={
                  {
                    variable: 'sys.files',
                  } as any
                }
                rightContent={
                  <div className="text-xs font-normal text-gray-400">
                    Array[File]
                  </div>
                }
              />
              {
                <VarItem
                  readonly
                  payload={
                    {
                      variable: 'sys.conversation_id',
                    } as any
                  }
                  rightContent={
                    <div className="text-xs font-normal text-gray-400">
                      String
                    </div>
                  }
                />
              }
              <VarItem
                readonly
                payload={
                  {
                    variable: 'sys.user_id',
                  } as any
                }
                rightContent={
                  <div className="text-xs font-normal text-gray-400">
                    String
                  </div>
                }
              />
            </div>
          </>
        </Field>
      </div>
    </div>
  );
};

export default React.memo(Panel);
