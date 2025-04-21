import React from 'react';
import { ArrowClockwise, ArrowsClockwise, Cube } from '@phosphor-icons/react';

export default function FullScreenLoader() {
  return (
    <div
      id="preloader"
      className="fixed left-0 top-0 z-999999 flex h-screen w-screen items-center justify-center bg-main"
    >
      <div className="h-16 w-16 animate-spin rounded-full border-main-blue border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  );
}

export function PreLoader({ size = 16 }: { size: number }) {
  return (
    <div
      className={`h-${size} w-${size} animate-spin rounded-full border-4 border-solid border-primary border-t-transparent`}
    ></div>
  );
}

export interface LoadingSpinnerProps {
  size: number;
  color: string;
}

export const RunningSpinner = ({ size, color }: LoadingSpinnerProps) => {
  return (
    <ArrowsClockwise color={color} weight="thin" size={size}>
      <animate
        attributeName="opacity"
        values="0;1;0"
        dur="2s"
        repeatCount="indefinite"
      ></animate>
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="5s"
        from="0 0 0"
        to="360 0 0"
        repeatCount="indefinite"
      ></animateTransform>
    </ArrowsClockwise>
  );
};
