import React from 'react';

interface ScrollableProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  hideScrollbar?: boolean;
}

const Scrollable = ({
  children,
  color,
  className = '',
  hideScrollbar = false,
}: ScrollableProps) => {
  const scrollColor = color ?? 'rgba(69, 81, 102, 0.5)';

  // Create dynamic styles for the scrollbar
  const scrollbarStyles = {
    '--scrollbar-color': scrollColor,
    '--scrollbar-width': '6px',
  } as React.CSSProperties;

  return (
    <div
      className={`scrollable-container w-full h-full overflow-auto ${hideScrollbar ? 'scrollbar-hide' : 'custom-scrollbar'} ${className}`}
      style={scrollbarStyles}
    >
      {children}
    </div>
  );
};

export default Scrollable;
