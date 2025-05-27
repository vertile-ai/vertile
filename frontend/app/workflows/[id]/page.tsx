'use client';

import { WorkflowContextProvider } from '@/app/workflows/[id]/_components/workflow-internal/context';
import WorkflowMain from './_components/workflow-main';

const WorkflowPage = () => {
  return (
    <WorkflowContextProvider>
      <WorkflowMain />
    </WorkflowContextProvider>
  );
};

export default WorkflowPage;
