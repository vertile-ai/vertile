'use client';

import { WorkflowContextProvider } from '@/app/workflows/[id]/_components/workflow-internal/context';
import WorkflowMain from './_components/workflow-main';
import WorkflowSidebar from './_components/workflow-sidebar';

const WorkflowPage = () => {
  return (
    <WorkflowContextProvider>
      <div className="flex h-screen w-full">
        <WorkflowSidebar />
        <WorkflowMain />
      </div>
    </WorkflowContextProvider>
  );
};

export default WorkflowPage;
