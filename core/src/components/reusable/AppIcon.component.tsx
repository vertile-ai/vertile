import { FlipVertical } from '@phosphor-icons/react';
import React from 'react';

const AppIcon = ({ size, color }: { size?: number; color?: string }) => {
  return (
    <FlipVertical
      className="transform rotate-90"
      size={size || 36}
      color={color || '#f0f2f4'}
      weight="fill"
    />
  );
};

export default AppIcon;
