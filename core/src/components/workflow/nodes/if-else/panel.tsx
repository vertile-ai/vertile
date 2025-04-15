import type { FC } from 'react';
import React from 'react';

import useConfig from './use-config';
import ConditionList from './components/condition-list';
import type { IfElseNodeType } from './types';
import type { NodePanelProps } from '@/src/components/workflow/types';
import Split from '../base/components/split';
import AddButton from '../base/components/add-button';
import Field from '../base/components/field';
const i18nPrefix = 'workflow.nodes.ifElse';

const Panel: FC<NodePanelProps<IfElseNodeType>> = ({ id, data }) => {
  

  const {
    readOnly,
    inputs,
    handleConditionsChange,
    handleAddCondition,
    handleLogicalOperatorToggle,
    filterVar,
  } = useConfig(id, data);
  return (
    <div className="mt-2">
      <div className="px-4 pb-4 space-y-4">
        <Field title={t(`${i18nPrefix}.if`)}>
          <>
            <ConditionList
              className="mt-2"
              readonly={readOnly}
              nodeId={id}
              list={inputs.conditions}
              onChange={handleConditionsChange}
              logicalOperator={inputs.logical_operator}
              onLogicalOperatorToggle={handleLogicalOperatorToggle}
              filterVar={filterVar}
            />
            {!readOnly && (
              <AddButton
                className="mt-3"
                text={t(`${i18nPrefix}.addCondition`) as string}
                onClick={handleAddCondition}
              />
            )}
          </>
        </Field>
        <Split />
        <Field title={t(`${i18nPrefix}.else`)}>
          <div className="leading-[18px] text-xs font-normal text-gray-400">
            {t(`${i18nPrefix}.elseDescription`)}
          </div>
        </Field>
      </div>
    </div>
  );
};

export default React.memo(Panel);
