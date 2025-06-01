import { ArrowLeft, TreeStructure } from '@phosphor-icons/react';

const ReturnSplash = () => {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-50/50">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Simple icon */}
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
          <TreeStructure size={32} color="#6B7280" weight="duotone" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Select a Workflow
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Choose an existing workflow from the sidebar to start editing and
          customizing your automation.
        </p>

        {/* Simple visual indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <ArrowLeft size={16} weight="bold" />
          <span>Click a workflow to begin</span>
        </div>
      </div>
    </div>
  );
};

ReturnSplash.displayName = 'ReturnSplash';
export default ReturnSplash;
