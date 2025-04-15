'use client';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useState, useRef, useEffect } from 'react';

type TooltipProps = {
  selector: string;
  content?: string;
  disabled?: boolean;
  htmlContent?: React.ReactNode;
  className?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  clickable?: boolean;
  children: React.ReactNode;
  noArrow?: boolean;
};

const Tooltip: FC<TooltipProps> = ({
  selector,
  content,
  disabled,
  position = 'top',
  children,
  htmlContent,
  className,
  clickable,
  noArrow,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const showTooltip = () => {
    if (!disabled) {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (!clickable) {
      setIsVisible(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (clickable && 
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    if (clickable) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [clickable]);

  const getTooltipPosition = () => {
    if (!triggerRef.current) return {};
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    
    switch (position) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-8px)',
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(8px)',
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(8px)',
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(-8px)',
        };
      default:
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-8px)',
        };
    }
  };

  const getArrowPosition = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderRight: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
        };
      case 'right':
        return {
          left: '-4px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderLeft: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
        };
      case 'bottom':
        return {
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderLeft: '1px solid #e5e7eb',
          borderTop: '1px solid #e5e7eb',
        };
      case 'left':
        return {
          right: '-4px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderRight: '1px solid #e5e7eb',
          borderTop: '1px solid #e5e7eb',
        };
      default:
        return {
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderRight: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
        };
    }
  };

  return (
    <div 
      className="tooltip-container relative inline-block"
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onClick={clickable ? showTooltip : undefined}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={classNames(
            'absolute z-[999] bg-white text-xs font-normal text-gray-700 shadow-lg p-2 rounded-md whitespace-nowrap border border-gray-200',
            className
          )}
          style={{
            ...getTooltipPosition(),
            pointerEvents: clickable ? 'auto' : 'none',
          }}
        >
          {content || htmlContent}
          
          {!noArrow && (
            <div
              className="absolute w-2 h-2 bg-white"
              style={getArrowPosition()}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
