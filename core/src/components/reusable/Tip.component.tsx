import { Question, Warning, WarningCircle } from '@phosphor-icons/react';
import React from 'react';

interface TipProps {
  message: string;
  type: 'error' | 'info' | 'question';
}

const infoIcon = <WarningCircle size={32} color="#d7c692" weight="bold" />;
const questionIcon = <Question size={32} color="#d7c692" weight="bold" />;
const errorIcon = <Warning size={32} color="#d7c692" weight="bold" />;

export default function Tip({ message, type }: TipProps) {
  return (
    <div className="flex justify-center items-center">
      {type === 'info' ? infoIcon : type === 'error' ? errorIcon : questionIcon}
      <div className="text-main-orange text-sm font-bold italic">{message}</div>
    </div>
  );
}
