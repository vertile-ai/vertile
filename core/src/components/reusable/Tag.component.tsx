import { Question, Warning, WarningCircle } from '@phosphor-icons/react';
import React, { useState, useMemo } from 'react';

interface TagProps {
  name: string;
  backgroundColor: string;
}

const Tag = ({ backgroundColor, name }) => {
  const textColor = useMemo(() => {
    const color =
      backgroundColor.charAt(0) === '#'
        ? backgroundColor.substring(1, 7)
        : backgroundColor;
    const r = parseInt(color.substring(0, 2), 16); // hexToR
    const g = parseInt(color.substring(2, 4), 16); // hexToG
    const b = parseInt(color.substring(4, 6), 16); // hexToB
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
  }, [backgroundColor]);

  return (
    <span
      style={{
        backgroundColor,
        color: textColor,
        padding: '4px 8px',
        borderRadius: '4px',
      }}
    >
      {name}
    </span>
  );
};

export default Tag;
