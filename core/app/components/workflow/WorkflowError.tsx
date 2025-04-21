const WorkflowError = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
      <div className="text-red-500 text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Failed to load workflow
      </h2>
      <p className="text-gray-600 mb-4">
        There was an error loading the workflow data. Please try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );
};

WorkflowError.displayName = 'WorkflowError';
export default WorkflowError;
