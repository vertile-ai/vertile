import React, { useState, useRef, useEffect } from 'react';
import { BlockEnum } from '@/app/workflows/[id]/_components/nodes/types';
import { PromptPanel } from '@/app/workflows/[id]/_components/nodes/Prompt/panel';
import { TrainPanel } from '@/app/workflows/[id]/_components/nodes/Train/panel';
import { ModelPanel } from '@/app/workflows/[id]/_components/nodes/Model/panel';
import { NodeConfigPanelProps, NodeData, RenderNodePanelProps } from './types';
import { Lightning, X, PencilSimple, Check } from '@phosphor-icons/react';
import { DatasetPanel } from '../nodes/Dataset/panel';
import { useStoreApi } from 'reactflow';
import { useStore } from '@/src/components/workflow/store';
const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  onClose,
  renderNodePanel,
}) => {
  // Use the shared context to access the selected node
  const selectedNode = useStore((s) => s.selectedNode);
  const setSelectedNode = useStore((s) => s.setSelectedNode);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [configData, setConfigData] = useState<Record<string, any>>({});
  const [originalNodeData, setOriginalNodeData] = useState<NodeData | null>(
    null
  );
  const titleInputRef = useRef<HTMLInputElement>(null);
  const store = useStoreApi();

  // Update local title state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      const nodeData = selectedNode as NodeData;
      setTitleValue(nodeData.title || 'Node Configuration');
      setConfigData(nodeData.config || {});
      setOriginalNodeData(JSON.parse(JSON.stringify(nodeData)));
      setHasUnsavedChanges(false);
    }
  }, [selectedNode]);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  // Check for changes based on node type
  const checkForChanges = () => {
    if (!selectedNode || !originalNodeData) return false;

    const nodeData = selectedNode as NodeData;

    // Title change check
    if (titleValue !== (originalNodeData.title || 'Node Configuration')) {
      return true;
    }

    // Node-specific change detection
    switch (nodeData.type) {
      case BlockEnum.Dataset:
        // For Dataset nodes, check if file selection changed
        const originalFileId = originalNodeData.fileId;
        const currentFileId = nodeData.fileId;
        return originalFileId !== currentFileId && currentFileId !== undefined;

      // Add cases for other node types as needed
      default:
        // Generic check for config changes
        return (
          JSON.stringify(configData) !==
          JSON.stringify(originalNodeData.config || {})
        );
    }
  };

  // Effect to check for changes
  useEffect(() => {
    if (selectedNode && originalNodeData) {
      setHasUnsavedChanges(checkForChanges());
    }
  }, [selectedNode, configData, titleValue]);

  // Determine if panel should be shown (only when a node is selected)
  const shouldShowPanel = !!selectedNode;

  const handleClose = () => {
    setSelectedNode(null);
    onClose?.();
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  const handleConfigChange = (newConfig: Record<string, any>) => {
    setConfigData((prevConfig) => {
      const updatedConfig = { ...prevConfig, ...newConfig };
      return updatedConfig;
    });

    // For Dataset nodes, directly update the node data when a file is selected
    if (selectedNode && (selectedNode as NodeData).type === BlockEnum.Dataset) {
      const nodeData = selectedNode as NodeData;
      // Create a new node data object with the updated file information
      const updatedNode = {
        ...nodeData,
        fileId: newConfig.fileId,
        fileName: newConfig.fileName,
        fileSize: newConfig.fileSize,
        contentType: newConfig.contentType,
        uploadedAt: newConfig.uploadedAt,
      };

      // Update the selected node in context
      setSelectedNode(updatedNode);
    }
  };

  const handleTitleSave = () => {
    if (!selectedNode) return;

    const nodeData = selectedNode as NodeData;
    const updatedTitle = titleValue.trim() || 'Node Configuration';

    // Update the node in the reactflow store
    const { getNodes, setNodes } = store.getState();
    const nodes = getNodes();
    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeData.id) {
        return {
          ...node,
          data: {
            ...node.data,
            title: updatedTitle,
          },
        };
      }
      return node;
    });

    setNodes(updatedNodes);

    // Also update the node in the context
    const updatedNode = {
      ...nodeData,
      title: updatedTitle,
    };

    setSelectedNode(updatedNode);
    setIsEditingTitle(false);
  };

  const handleApplyChanges = () => {
    if (!selectedNode || !hasUnsavedChanges) return;

    const nodeData = selectedNode as NodeData;

    // Prepare the update based on node type
    let nodeUpdate: Partial<NodeData> = {};

    // Common updates for all node types
    nodeUpdate.title = titleValue;
    nodeUpdate.config = configData;

    // Node-specific updates
    switch (nodeData.type) {
      case BlockEnum.Dataset:
        // For Dataset nodes, ensure file info is included
        nodeUpdate = {
          ...nodeUpdate,
          fileId: nodeData.fileId,
          fileName: nodeData.fileName,
          fileSize: nodeData.fileSize,
          contentType: nodeData.contentType,
          uploadedAt: nodeData.uploadedAt,
        };
        break;

      // Add cases for other node types as needed
    }

    // Update the node in the reactflow store
    const { getNodes, setNodes } = store.getState();
    const nodes = getNodes();
    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeData.id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...nodeUpdate,
          },
        };
      }
      return node;
    });

    setNodes(updatedNodes);

    // Also update the node in the context and save the original state
    const updatedNode = {
      ...nodeData,
      ...nodeUpdate,
    };

    setSelectedNode(updatedNode);
    setOriginalNodeData(JSON.parse(JSON.stringify(updatedNode)));
    setHasUnsavedChanges(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      if (selectedNode) {
        setTitleValue((selectedNode as NodeData).title || 'Node Configuration');
      }
    }
  };

  // Render content based on whether a node is selected
  const renderContent = () => {
    if (!shouldShowPanel) {
      return (
        <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
          <div className="text-center">
            <Lightning size={48} weight="bold" />
            <p>Select a node to view its configuration</p>
          </div>
        </div>
      );
    }

    // If renderNodePanel function is provided, use it to render the panel
    if (renderNodePanel && selectedNode) {
      const node = selectedNode as NodeData;
      const panel = renderNodePanel({
        nodeType: node.type,
        nodeId: node.id,
        nodeData: node,
        onConfigChange: handleConfigChange,
      });

      if (!panel) {
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-gray-600 p-4 bg-gray-50 rounded-md">
              No configuration options available for this node type.
            </div>
          </div>
        );
      }

      return <div className="flex-1 overflow-y-auto p-4">{panel}</div>;
    }

    // Fallback message
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-gray-600 p-4 bg-gray-50 rounded-md">
          {(selectedNode && (selectedNode as NodeData).desc) ||
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
    <div className="flex flex-col h-full rounded-lg bg-white shadow-2xl border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-indigo-50 rounded-t-lg">
        {isEditingTitle ? (
          <div className="flex-1 flex items-center mr-2">
            <input
              ref={titleInputRef}
              type="text"
              value={titleValue}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 text-lg font-medium text-gray-800 bg-white border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300"
              maxLength={50}
            />
            <button
              onClick={handleTitleSave}
              className="ml-2 p-1.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors focus:outline-none"
              title="Save title"
            >
              <Check size={18} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center overflow-hidden mr-2">
            <h2 className="text-lg font-medium text-gray-800 truncate">
              {getNodeTitle()}
            </h2>
            <button
              onClick={handleEditTitle}
              className="ml-2 p-1 rounded-md hover:bg-indigo-100 text-gray-600 transition-colors focus:outline-none"
              title="Edit title"
            >
              <PencilSimple size={16} weight="bold" />
            </button>
          </div>
        )}
        <div className="flex items-center">
          <button
            onClick={handleApplyChanges}
            disabled={!hasUnsavedChanges}
            className={`p-1 mr-2 rounded-md ${
              hasUnsavedChanges
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } transition-colors focus:outline-none`}
            title="Apply changes"
          >
            <Check size={18} weight="bold" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-indigo-100 text-gray-600 transition-colors focus:outline-none"
            title="Close panel"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

const createNodeConfigPanel = (
  nodePanels: Record<string, React.ComponentType<any>>
) => {
  return (props: Omit<NodeConfigPanelProps, 'renderNodePanel'>) => {
    const renderNodePanel = ({
      nodeType,
      nodeId,
      nodeData,
      onConfigChange,
    }: RenderNodePanelProps) => {
      const PanelComponent = nodePanels[nodeType];
      return PanelComponent ? (
        <PanelComponent
          id={nodeId}
          data={nodeData}
          onConfigChange={onConfigChange}
          onUpdate={onConfigChange}
        />
      ) : null;
    };

    return <NodeConfigPanel {...props} renderNodePanel={renderNodePanel} />;
  };
};

// Map all node types to their respective panel components
const nodePanels: Record<BlockEnum, React.ComponentType<any>> = {
  [BlockEnum.Dataset]: DatasetPanel,
  [BlockEnum.Model]: ModelPanel,
  [BlockEnum.Train]: TrainPanel,
  [BlockEnum.Prompt]: PromptPanel,
};

// Create a configured NodeConfigPanel that knows how to render each node type
const ConfiguredNodePanel = createNodeConfigPanel(nodePanels);

// Export the configured panel
export default ConfiguredNodePanel;
