import { Icon } from '@phosphor-icons/react';
import React, { ReactElement, ReactNode } from 'react';
import styled from 'styled-components';

interface HoverableIconProps {
  children: ReactElement;
  hoverBackgroundColor?: string;
  color: string;
  hoverfill?: string;
  tooltipText?: string; // Add this prop for the tooltip text
}

const IconContainer = styled.div<HoverableIconProps>`
  transition: background-color 0.3s ease;
  padding: 6px;
  margin: 0 auto;
  &:hover {
    background-color: ${({ hoverBackgroundColor }) =>
      hoverBackgroundColor || 'rgba(0, 0, 0, 0.1)'};
  }
  &:hover svg {
    fill: ${({ hoverfill, color }) => hoverfill ?? color};
  }
`;

const HoverableIcon: React.FC<HoverableIconProps> = ({
  children,
  color,
  hoverfill,
  hoverBackgroundColor,
  tooltipText,
}) => {
  return (
    <IconContainer
      hoverBackgroundColor={hoverBackgroundColor}
      title={tooltipText}
      color={color}
      hoverfill={hoverfill}
      className="rounded cursor-pointer"
    >
      {React.cloneElement(children, {
        fill: color, // Set the initial fill color
      })}
    </IconContainer>
  );
};

export default HoverableIcon;
