import React, { useCallback, useState, useRef } from 'react';
import { Upload, FilePlus, X, Check } from '@phosphor-icons/react';
import { useStore } from '@/app/workflows/[id]/_components/workflow-main/store';

interface FileUploadProps {
  onUploadComplete: (
    fileId: string,
    filename: string,
    size?: number,
    contentType?: string,
    uploadedAt?: string
  ) => void;
  acceptedFileTypes?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  filename: string | null;
  fileId: string | null;
  fileSize: number | null;
  contentType: string | null;
  uploadedAt: string | null;
}

const initialUploadState: UploadState = {
  isUploading: false,
  progress: 0,
  error: null,
  success: false,
  filename: null,
  fileId: null,
  fileSize: null,
  contentType: null,
  uploadedAt: null,
};

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const workflowId = useStore((state) => state.workflowId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] =
    useState<UploadState>(initialUploadState);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        uploadFile(file);
      }
    },
    [workflowId]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        uploadFile(file);
      }
    },
    [workflowId]
  );

  const uploadFile = async (file: File) => {
    setUploadState({
      ...initialUploadState,
      isUploading: true,
      filename: file.name,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/workflows/${workflowId}/dataset`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await response.json();

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true,
        filename: file.name,
        fileId: data.fileId,
        fileSize: data.size,
        contentType: file.type,
        uploadedAt: data.uploadedAt,
      });

      onUploadComplete(
        data.fileId,
        file.name,
        data.size,
        file.type,
        data.uploadedAt
      );
    } catch (error) {
      setUploadState({
        ...uploadState,
        isUploading: false,
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
        success: false,
      });
    }
  };

  const handleRetry = () => {
    setUploadState(initialUploadState);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mt-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : uploadState.error
              ? 'border-red-300 bg-red-50'
              : uploadState.success
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadState.isUploading ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <FilePlus
                size={24}
                className="text-indigo-500"
                weight="duotone"
              />
            </div>
            <p className="text-sm text-gray-600">
              Uploading {uploadState.filename}...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadState.progress}%` }}
              ></div>
            </div>
          </div>
        ) : uploadState.error ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <X size={24} className="text-red-500" weight="bold" />
            </div>
            <p className="text-sm text-red-600">{uploadState.error}</p>
            <button
              className="mt-2 px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
            >
              Try Again
            </button>
          </div>
        ) : uploadState.success ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <Check size={24} className="text-green-500" weight="bold" />
            </div>
            <p className="text-sm text-green-600">
              Successfully uploaded {uploadState.filename}
            </p>
            <div className="flex flex-col items-center text-xs text-gray-500">
              <p>File ID: {uploadState.fileId}</p>
              {uploadState.fileSize && (
                <p>Size: {formatFileSize(uploadState.fileSize)}</p>
              )}
            </div>
            <button
              className="mt-2 px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
            >
              Upload Another File
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <Upload size={24} className="text-indigo-500" weight="duotone" />
            </div>
            <p className="text-sm text-gray-600">
              Drag & drop a file here, or click to select
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
