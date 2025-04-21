import { NodePanelProps } from "../../NodeConfigPanel";

export const ModelPanel: React.FC<NodePanelProps> = ({ id, data }) => {
    return (
      <div className="space-y-4">
        <h3 className="text-md font-medium text-indigo-700">Model Configuration</h3>
        
        <div className="bg-white p-3 rounded-md border border-indigo-100">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
              defaultValue={data.modelName || ''}
              placeholder="Enter model name"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Type
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              defaultValue={data.modelType || 'llm'}
            >
              <option value="llm">Large Language Model</option>
              <option value="vision">Vision Model</option>
              <option value="multimodal">Multimodal Model</option>
            </select>
          </div>
  
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parameters
            </label>
            <input 
              type="number" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
              defaultValue={data.parameters || '7'}
              placeholder="Number of parameters (in billions)"
            />
          </div>
        </div>
      </div>
    );
  };