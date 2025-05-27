'use client';

import { WorkflowContextProvider } from '@/app/workflows/[id]/_components/workflow-internal/context';
import WorkflowMain from '../[id]/_components/workflow-main';

const WorkflowPage = () => {
  return (
    <WorkflowContextProvider>
      <WorkflowMain isNew={true} />
    </WorkflowContextProvider>
  );
};

export default WorkflowPage;
