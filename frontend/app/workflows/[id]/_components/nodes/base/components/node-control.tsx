import React, { FC } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { NodeRunningStatus } from '@/app/workflows/[id]/types';

interface NodeControlProps {
  id: string;
  data: any;
}

const NodeControl: FC<NodeControlProps> = ({ id, data }) => {
  // Node is not running if no status is set
  if (!data._runningStatus) return null;

  // Render different icons based on running status
  switch (data._runningStatus) {
    case NodeRunningStatus.Running:
      return (
        <div className="absolute top-1 right-1">
          <div className="animate-spin">
            <ClockIcon className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      );

    case NodeRunningStatus.Succeeded:
      return (
        <div className="absolute top-1 right-1">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        </div>
      );

    case NodeRunningStatus.Failed:
      return (
        <div className="absolute top-1 right-1">
          <XCircleIcon className="h-5 w-5 text-red-500" />
        </div>
      );

    case NodeRunningStatus.Waiting:
      return (
        <div className="absolute top-1 right-1">
          <div className="animate-pulse">
            <ClockIcon className="h-5 w-5 text-yellow-500" />
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default NodeControl;
