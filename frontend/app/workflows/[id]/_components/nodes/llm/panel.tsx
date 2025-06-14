export const LLMPanel: React.FC<any> = (data) => {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-indigo-700">LLM Configuration</h3>

      <div className="bg-white p-3 rounded-md border border-indigo-100">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LLM Template
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono"
            rows={6}
            defaultValue={
              data.promptTemplate ||
              'Answer the following question:\n\n{question}'
            }
            placeholder="Enter prompt template"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperature
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            className="w-full"
            defaultValue={data.temperature || '0.7'}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0 (Deterministic)</span>
            <span>1 (Balanced)</span>
            <span>2 (Creative)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
