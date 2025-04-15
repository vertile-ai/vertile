'use client';
import type { FC } from 'react';
import React from 'react';
import { useWorkflow } from '../../../hooks/hooks';
import { BlockEnum } from '../../../types';
import { CodeBlock, LineSegment } from '@phosphor-icons/react';
type Props = {
  nodeId: string;
  value: string;
};

const VAR_PLACEHOLDER = '@#!@#!';

const ReadonlyInputWithSelectVar: FC<Props> = ({ nodeId, value }) => {
  const { getBeforeNodesInSameBranchIncludeParent } = useWorkflow();
  const availableNodes = getBeforeNodesInSameBranchIncludeParent(nodeId);
  const startNode = availableNodes.find((node: any) => {
    return node.data.type === BlockEnum.Start;
  });

  const res = (() => {
    const vars: string[] = [];
    const strWithVarPlaceholder = value.replaceAll(
      /{{#([^#]*)#}}/g,
      (_match, p1) => {
        vars.push(p1);
        return VAR_PLACEHOLDER;
      }
    );

    const html: JSX.Element[] = strWithVarPlaceholder
      .split(VAR_PLACEHOLDER)
      .map((str, index) => {
        if (!vars[index])
          return (
            <span className="relative top-[-3px] leading-[16px]" key={index}>
              {str}
            </span>
          );

        const value = vars[index].split('.');
        const node = startNode?.data;
        const varName = `${value[value.length - 1]}`;

        return (
          <span key={index}>
            <span className="relative top-[-3px] leading-[16px]">{str}</span>
            <div className=" inline-flex h-[16px] items-center px-1.5 rounded-[5px] bg-white">
              <div className="flex items-center">
                <div className="p-[1px]">
                  <CodeBlock
                    className="!text-gray-900"
                    type={node?.type || BlockEnum.Start}
                  />
                </div>
                <div
                  className="max-w-[60px] mx-0.5 text-xs font-medium text-gray-700 truncate"
                  title={node?.title}
                >
                  {node?.title}
                </div>
                <LineSegment className="mr-0.5" />
              </div>
              <div className="flex items-center text-primary-600">
                <LineSegment className="w-3.5 h-3.5" />
                <div
                  className="max-w-[50px] ml-0.5 text-xs font-medium truncate"
                  title={varName}
                >
                  {varName}
                </div>
              </div>
            </div>
          </span>
        );
      });
    return html;
  })();

  return <div className="break-all text-xs">{res}</div>;
};
export default React.memo(ReadonlyInputWithSelectVar);
