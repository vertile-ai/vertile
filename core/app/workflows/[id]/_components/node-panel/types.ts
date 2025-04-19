import { ReactNode } from 'react';

// Define a type for the node data
export interface NodeData {
  id: string;
  type: string;
  title?: string;
  desc?: string;
  config?: Record<string, any>;
  [key: string]: any;
}

// Props for the render node panel function
export interface RenderNodePanelProps {
  nodeType: string;
  nodeId: string;
  nodeData: NodeData;
  onConfigChange?: (newConfig: Record<string, any>) => void;
}

// Interface for node config panel props
export interface NodeConfigPanelProps {
  onClose?: () => void;
  // Function to render specific node panel based on node type
  renderNodePanel?: (props: RenderNodePanelProps) => ReactNode;
}
