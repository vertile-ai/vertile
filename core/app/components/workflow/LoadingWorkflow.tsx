// Loading state component
const LoadingWorkflow = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
      <div className="relative w-20 h-20 mb-4">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-lg text-gray-600 font-medium">Loading workflow...</p>
      <p className="text-sm text-gray-500 mt-2">
        Please wait while we retrieve your workflow data
      </p>
    </div>
  );
};

LoadingWorkflow.displayName = 'LoadingWorkflow';

export default LoadingWorkflow;
