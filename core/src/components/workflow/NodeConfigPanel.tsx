import React, { useContext, ReactNode } from 'react';
import { BlockEnum } from './types';
import StartNodePanel from './nodes/start/panel';
import { SelectedNodeContext } from '../../pages/workflow.page';
import { X } from '@phosphor-icons/react';

// Define a type for the node data
export interface NodeData {
  id: string;
  type: string;
  title?: string;
  desc?: string;
  [key: string]: any;
}

// Interface for node panel props
export interface NodePanelProps {
  id: string;
  data: NodeData;
}

// Interface for node config panel props
interface NodeConfigPanelProps {
  width: number;
  onClose?: () => void;
  children?: ReactNode;
  // Function to render specific node panel based on node type
  renderNodePanel?: (nodeType: string, nodeId: string, nodeData: NodeData) => ReactNode;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  width,
  onClose,
  children,
  renderNodePanel,
}) => {
  // Use the shared context to access the selected node
  const { selectedNode, setSelectedNode } = useContext(SelectedNodeContext);

  // Determine if panel should be shown (only when a node is selected)
  const shouldShowPanel = !!selectedNode;

  // Handle node deselection and panel collapse
  const handleClose = () => {
    // Deselect the node
    setSelectedNode(null);

    // Collapse the panel if onClose is provided
    if (onClose) {
      onClose();
    }
  };

  // Render content based on whether a node is selected
  const renderContent = () => {
    if (!shouldShowPanel) {
      return (
        <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
            <p>Select a node to view its configuration</p>
          </div>
        </div>
      );
    }

    // If children are provided, render them
    if (children) {
      return <div className="flex-1 overflow-y-auto p-4">{children}</div>;
    }

    // If renderNodePanel function is provided, use it to render the panel
    if (renderNodePanel && selectedNode) {
      const node = selectedNode as NodeData;
      const panel = renderNodePanel(
        node.type, 
        node.id, 
        node
      );
      
      return (
        <div className="flex-1 overflow-y-auto p-4">
          {panel || (
            <div className="text-gray-600 p-4 bg-gray-50 rounded-md">
              No configuration options available for this node type.
            </div>
          )}
        </div>
      );
    }

    // Fallback message
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-gray-600 p-4 bg-gray-50 rounded-md">
          {selectedNode && (selectedNode as NodeData).desc ||
            'No configuration options available for this node.'}
        </div>
      </div>
    );
  };

  // Get the node title safely
  const getNodeTitle = () => {
    if (!selectedNode) return 'Node Configuration';
    return (selectedNode as NodeData).title || 'Node Configuration';
  };

  return (
    <div
      className="flex flex-col h-full rounded-lg bg-white shadow-2xl border border-gray-200"
      style={{ 
        width: `${width}px`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-indigo-50 rounded-t-lg">
        <h2 className="text-lg font-medium text-gray-800">
          {getNodeTitle()}
        </h2>
        <button
          onClick={handleClose}
          className="p-1 rounded-md hover:bg-indigo-100 text-gray-600 transition-colors focus:outline-none"
          title="Close panel"
        >
          <X size={18} weight="bold" />
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

// Create a higher-order component to make it easier to use with specific node panels
export const createNodeConfigPanel = (
  nodePanels: Record<string, React.ComponentType<NodePanelProps>>
) => {
  return (props: Omit<NodeConfigPanelProps, 'renderNodePanel'>) => {
    const renderNodePanel = (nodeType: string, nodeId: string, nodeData: NodeData) => {
      const PanelComponent = nodePanels[nodeType];
      return PanelComponent ? (
        <PanelComponent id={nodeId} data={nodeData} />
      ) : null;
    };

    return <NodeConfigPanel {...props} renderNodePanel={renderNodePanel} />;
  };
};

export default NodeConfigPanel;
