import { NodePanelProps } from "../../NodeConfigPanel";

export const DatasetPanel: React.FC<NodePanelProps> = ({ id, data }) => {
    return (
      <div className="space-y-4">
        <h3 className="text-md font-medium text-indigo-700">Dataset Configuration</h3>
        
        <div className="bg-white p-3 rounded-md border border-indigo-100">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dataset Name
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
              defaultValue={data.datasetName || ''}
              placeholder="Enter dataset name"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Type
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              defaultValue={data.dataType || 'text'}
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="audio">Audio</option>
            </select>
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
              rows={3}
              defaultValue={data.description || ''}
              placeholder="Enter dataset description"
            />
          </div>
        </div>
      </div>
    );
  };