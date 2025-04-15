'use client';
import type { FC } from 'react';
import React from 'react';
import { InputVarType } from '../../../types';
import { Angle } from '@phosphor-icons/react';

type Props = {
  className?: string;
  type: InputVarType;
};
const InputVarTypeIcon: FC<Props> = ({ className, type }) => {
  return <Angle className={className} />;
};
export default React.memo(InputVarTypeIcon);
