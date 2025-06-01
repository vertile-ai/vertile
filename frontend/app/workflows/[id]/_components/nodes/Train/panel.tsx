export const TrainPanel: React.FC<any> = (data) => {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-indigo-700">
        Training Configuration
      </h3>

      <div className="bg-white p-3 rounded-md border border-indigo-100">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Learning Rate
          </label>
          <input
            type="number"
            step="0.0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            defaultValue={data.learningRate || '0.0001'}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Epochs
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            defaultValue={data.epochs || '3'}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch Size
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            defaultValue={data.batchSize || '16'}
          >
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
          </select>
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="gradient_checkpointing"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            defaultChecked={data.gradientCheckpointing || false}
          />
          <label
            htmlFor="gradient_checkpointing"
            className="ml-2 block text-sm text-gray-700"
          >
            Enable Gradient Checkpointing
          </label>
        </div>
      </div>
    </div>
  );
};
