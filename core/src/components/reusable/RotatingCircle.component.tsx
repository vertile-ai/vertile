import {
  Binary,
  BracketsAngle,
  BracketsRound,
  Circle,
  CircleNotch,
  IconProps,
} from '@phosphor-icons/react';
import React from 'react';

const RotatingCircle = ({
  color,
  weight,
  size,
}: Pick<IconProps, 'color' | 'weight'> & {
  size: number;
  weight: 'thin' | 'light' | 'regular' | 'bold' | 'duotone';
}) => {
  return (
    <div
      className={`relative inline-flex justify-center items-center w-[${size}px] h-[${size}px]`}
    >
      <Circle
        color={color}
        weight={'regular'}
        size={size}
        className="flex items-center justify-center"
      ></Circle>
      <BracketsAngle
        color={color}
        weight={weight}
        size={Math.floor(size / 2) - 1}
        className={`absolute`}
      >
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          dur="3.5s"
          keyTimes="0;0.2;0.75;0.8;1"
          values="0 0 0; 60 0 0; 900 0 0; 980 0 0; 1080 0 0"
          repeatCount="indefinite"
        ></animateTransform>
      </BracketsAngle>
    </div>
  );
};

export default RotatingCircle;
