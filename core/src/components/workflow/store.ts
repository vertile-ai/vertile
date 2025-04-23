import { useContext } from 'react';
import { useStore as useZustandStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { debounce } from 'lodash-es';
import { WorkflowContext } from './context';

// Helper function to safely access localStorage
export const getLocalStorageItem = (key: string, defaultValue: any) => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  }
  return defaultValue;
};

// Helper function to safely set localStorage
export const setLocalStorageItem = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

// Add the nodeExecutionStatuses to the store
interface WorkflowState {
  selectedNode: string | undefined;
  setSelectedNode: (selectedNode: string | undefined) => void;
  lastSaved: number;
  setLastSaved: (lastSaved: number) => void;
  saveStatus: string;
  setSaveStatus: (saveStatus: string) => void;
  workflowId: string;
  setWorkflowId: (workflowId: string) => void;
  panelWidth: number;
  workflowRunningData: any | undefined;
  setWorkflowRunningData: (workflowRunningData: any | undefined) => void;
  historyWorkflowData: any | undefined;
  setHistoryWorkflowData: (historyWorkflowData: any | undefined) => void;
  showRunHistory: boolean;
  setShowRunHistory: (showRunHistory: boolean) => void;
  workflowExecutionStatus: string;
  setWorkflowExecutionStatus: (status: string) => void;
  nodeExecutionStatuses: Record<string, string>;
  setNodeExecutionStatuses: (statuses: Record<string, string>) => void;
  updateNodeExecutionStatus: (nodeId: string, status: string) => void;
  clearNodeExecutionStatuses: () => void;
  publishedAt: number;
  setPublishedAt: (publishedAt: number) => void;
  showInputsPanel: boolean;
  setShowInputsPanel: (showInputsPanel: boolean) => void;
  inputs: Record<string, any>;
  setInputs: (inputs: Record<string, any>) => void;
  backupDraft: any | undefined;
  notInitialWorkflow: boolean;
  setNotInitialWorkflow: (notInitialWorkflow: boolean) => void;
  nodesDefaultConfigs: Record<string, any>;
  setNodesDefaultConfigs: (nodesDefaultConfigs: Record<string, any>) => void;
  nodeAnimation: boolean;
  setNodeAnimation: (nodeAnimation: boolean) => void;
  isRestoring: boolean;
  setIsRestoring: (isRestoring: boolean) => void;
  debouncedUpdateWorkflow: (updateWorkflow: () => void) => void;
  clipboardElements: any[];
  setClipboardElements: (clipboardElements: any[]) => void;
  shortcutsDisabled: boolean;
  setShortcutsDisabled: (shortcutsDisabled: boolean) => void;
  selection: any | null;
  setSelection: (selection: any | null) => void;
  bundleNodeSize: any | null;
  setBundleNodeSize: (bundleNodeSize: any | null) => void;
  controlMode: string;
  setControlMode: (controlMode: string) => void;
  panelMenu: any | undefined;
  setPanelMenu: (panelMenu: any | undefined) => void;
  nodeMenu: any | undefined;
  setNodeMenu: (nodeMenu: any | undefined) => void;
  mousePosition: {
    pageX: number;
    pageY: number;
    elementX: number;
    elementY: number;
  };
  setMousePosition: (mousePosition: {
    pageX: number;
    pageY: number;
    elementX: number;
    elementY: number;
  }) => void;
  showConfirm: any | undefined;
  setShowConfirm: (showConfirm: any | undefined) => void;
  showAssignVariablePopup: any | undefined;
  setShowAssignVariablePopup: (
    showAssignVariablePopup: any | undefined
  ) => void;
  hoveringAssignVariableGroupId: any | undefined;
  setHoveringAssignVariableGroupId: (
    hoveringAssignVariableGroupId: any | undefined
  ) => void;
  connectingNodePayload: any | undefined;
  setConnectingNodePayload: (connectingNodePayload: any | undefined) => void;
  enteringNodePayload: any | undefined;
  setEnteringNodePayload: (enteringNodePayload: any | undefined) => void;
}

export const createWorkflowStore = () => {
  return createStore<WorkflowState>((set) => ({
    selectedNode: undefined,
    setSelectedNode: (selectedNode) => set({ selectedNode }),
    lastSaved: 0,
    setLastSaved: (lastSaved) => set({ lastSaved }),
    saveStatus: 'idle',
    setSaveStatus: (saveStatus) => set({ saveStatus }),

    workflowId: '',
    setWorkflowId: (workflowId) => set({ workflowId }),
    panelWidth: getLocalStorageItem('workflow-node-panel-width', null)
      ? parseFloat(getLocalStorageItem('workflow-node-panel-width', '420'))
      : 420,
    workflowRunningData: undefined,
    setWorkflowRunningData: (workflowRunningData) =>
      set(() => ({ workflowRunningData })),
    historyWorkflowData: undefined,
    setHistoryWorkflowData: (historyWorkflowData) =>
      set(() => ({ historyWorkflowData })),
    showRunHistory: false,
    setShowRunHistory: (showRunHistory) => set(() => ({ showRunHistory })),

    // Workflow execution state
    workflowExecutionStatus: 'idle',
    setWorkflowExecutionStatus: (status) =>
      set(() => ({ workflowExecutionStatus: status })),
    nodeExecutionStatuses: {},
    setNodeExecutionStatuses: (statuses: Record<string, string>) =>
      set(() => ({ nodeExecutionStatuses: statuses })),
    updateNodeExecutionStatus: (nodeId, status) =>
      set((state) => ({
        nodeExecutionStatuses: {
          ...state.nodeExecutionStatuses,
          [nodeId]: status,
        },
      })),
    clearNodeExecutionStatuses: () =>
      set(() => ({ nodeExecutionStatuses: {} })),

    publishedAt: 0,
    setPublishedAt: (publishedAt) =>
      set(() => ({ publishedAt: publishedAt ? publishedAt * 1000 : 0 })),
    showInputsPanel: false,
    setShowInputsPanel: (showInputsPanel) => set(() => ({ showInputsPanel })),
    inputs: {},
    setInputs: (inputs) => set(() => ({ inputs })),
    backupDraft: undefined,
    notInitialWorkflow: false,
    setNotInitialWorkflow: (notInitialWorkflow) =>
      set(() => ({ notInitialWorkflow })),
    nodesDefaultConfigs: {},
    setNodesDefaultConfigs: (nodesDefaultConfigs) =>
      set(() => ({ nodesDefaultConfigs })),
    nodeAnimation: false,
    setNodeAnimation: (nodeAnimation) => set(() => ({ nodeAnimation })),
    isRestoring: false,
    setIsRestoring: (isRestoring) => set(() => ({ isRestoring })),
    debouncedUpdateWorkflow: debounce((updateWorkflow) => {
      updateWorkflow();
    }, 5000),

    clipboardElements: [],
    setClipboardElements: (clipboardElements) =>
      set(() => ({ clipboardElements })),
    shortcutsDisabled: false,
    setShortcutsDisabled: (shortcutsDisabled) =>
      set(() => ({ shortcutsDisabled })),
    selection: null,
    setSelection: (selection) => set(() => ({ selection })),
    bundleNodeSize: null,
    setBundleNodeSize: (bundleNodeSize) => set(() => ({ bundleNodeSize })),
    controlMode:
      getLocalStorageItem('workflow-operation-mode', '') === 'pointer'
        ? 'pointer'
        : 'hand',
    setControlMode: (controlMode) => {
      set(() => ({ controlMode }));
      setLocalStorageItem('workflow-operation-mode', controlMode);
    },
    panelMenu: undefined,
    setPanelMenu: (panelMenu) => set(() => ({ panelMenu })),
    nodeMenu: undefined,
    setNodeMenu: (nodeMenu) => set(() => ({ nodeMenu })),

    mousePosition: { pageX: 0, pageY: 0, elementX: 0, elementY: 0 },
    setMousePosition: (mousePosition) => set(() => ({ mousePosition })),
    showConfirm: undefined,
    setShowConfirm: (showConfirm) => set(() => ({ showConfirm })),
    showAssignVariablePopup: undefined,
    setShowAssignVariablePopup: (showAssignVariablePopup) =>
      set(() => ({ showAssignVariablePopup })),
    hoveringAssignVariableGroupId: undefined,
    setHoveringAssignVariableGroupId: (hoveringAssignVariableGroupId) =>
      set(() => ({ hoveringAssignVariableGroupId })),
    connectingNodePayload: undefined,
    setConnectingNodePayload: (connectingNodePayload) =>
      set(() => ({ connectingNodePayload })),
    enteringNodePayload: undefined,
    setEnteringNodePayload: (enteringNodePayload) =>
      set(() => ({ enteringNodePayload })),
  }));
};

export function useStore<T = WorkflowState>(
  selector: (state: WorkflowState) => T
): T {
  const store = useContext(WorkflowContext);
  if (!store) throw new Error('Missing WorkflowContext.Provider in the tree');

  return useZustandStore(store, selector);
}
