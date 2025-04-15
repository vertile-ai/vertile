import React from 'react';
import LoadingSpinner from './LoadingSpinner';

type ButtonType = 'primary' | 'warning' | 'default';

interface ButtonProps {
  type?: ButtonType;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  tabIndex?: number;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler;
}

export default function Button({
  type = 'default',
  disabled = false,
  children,
  className = '',
  onClick,
  loading = false,
  tabIndex,
}: ButtonProps) {
  let style = 'cursor-pointer';

  switch (type) {
    case 'primary':
      style = disabled || loading ? 'btn-primary-disabled' : 'btn-primary';
      break;
    case 'warning':
      style = disabled || loading ? 'btn-warning-disabled' : 'btn-warning';
      break;
    default:
      style = disabled ? 'btn-default-disabled' : 'btn-default';
      break;
  }

  return (
    <div
      className={`btn ${style} ${className}`}
      tabIndex={tabIndex}
      onClick={disabled || loading ? undefined : onClick}
    >
      {children}
      {loading && <LoadingSpinner size={13} color="blue" />}
    </div>
  );
}
