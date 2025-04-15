import React from 'react';
import { BlockEnum } from './types';
import StartNodePanel from './nodes/start/panel';
import { NodePanelProps, createNodeConfigPanel } from './NodeConfigPanel';
import { PromptPanel } from './nodes/Prompt/panel';
import { TrainPanel } from './nodes/Train/panel';
import { ModelPanel } from './nodes/Model/panel';
import { DatasetPanel } from './nodes/Dataset/panel';

// Map all node types to their respective panel components
const nodePanels: Record<string, React.ComponentType<NodePanelProps>> = {
  [BlockEnum.Start]: StartNodePanel,
  [BlockEnum.Dataset]: DatasetPanel,
  [BlockEnum.Model]: ModelPanel,
  [BlockEnum.Train]: TrainPanel,
  [BlockEnum.Prompt]: PromptPanel,
};

// Create a configured NodeConfigPanel that knows how to render each node type
const ConfiguredNodePanel = createNodeConfigPanel(nodePanels);

// Export the configured panel
export default ConfiguredNodePanel; 