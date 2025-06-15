'use client';

import { WorkflowContextProvider } from '@/app/workflows/[id]/_components/workflow-internal/context';
import WorkflowMain from './_components/workflow-main';
import WorkflowSidebar from './_components/workflow-sidebar';
import { ReactFlowProvider } from 'reactflow';

const WorkflowPage = () => {
  return (
    <WorkflowContextProvider>
      <ReactFlowProvider>
        <div className="flex h-screen w-full">
          <WorkflowSidebar />
          <div className="h-screen w-full overflow-hidden relative flex flex-col">
            <WorkflowMain />
          </div>
        </div>
      </ReactFlowProvider>
    </WorkflowContextProvider>
  );
};

export default WorkflowPage;
