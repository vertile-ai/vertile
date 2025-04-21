import { JobDetail } from '@/types/dashboard.type';
import {
  CheckCircle,
  MinusCircle,
  WarningCircle,
  type IconWeight,
} from '@phosphor-icons/react';
import React from 'react';
import RotatingCircle from './RotatingCircle.component';

const StatusIcon = ({
  size,
  color,
  status,
  weight,
}: { color?: string | undefined; size: number; weight: IconWeight } & Pick<
  JobDetail,
  'status'
>) => {
  return status === 'finished' ? (
    <CheckCircle size={size} color="#22a06b" weight={weight} />
  ) : status === 'running' ? (
    // Rotating Circle cannot accept fill atm
    <RotatingCircle
      size={size}
      color={color ?? '#0c66e4'}
      weight={weight === 'fill' ? 'bold' : weight}
    />
  ) : status === 'failed' ? (
    <WarningCircle size={size} color={'#c9372c '} weight={weight} />
  ) : status === 'paused' ? (
    <MinusCircle size={size} color={'#626F86'} weight={weight} />
  ) : undefined;
};

export default StatusIcon;
