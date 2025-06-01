import { CommonNodeType } from '../types';
export interface DatasetNodeType extends CommonNodeType {
  datasetName: string;
  description?: string;
  fileId?: string;
  fileName?: string;
  nodeName?: string;
  fileSize?: number;
  uploadedAt?: string;
  contentType?: string;
}

export interface FileInfo {
  fileId: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt?: string;
  contentType?: string;
}

export interface DatasetNodePanelProps {
  fileId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt?: string;
  contentType?: string;
  onUpdate?: (data: {
    fileId: string;
    fileName: string;
    fileSize?: number;
    uploadedAt?: string;
    contentType?: string;
  }) => void;
}
