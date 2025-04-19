import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DatasetNodePanelProps, FileInfo } from './types';
import { FileUpload } from './upload';
import { FileSelector } from './upload/FileSelector';
import { Upload, List, Clock, FilePdf } from '@phosphor-icons/react';

type TabType = 'upload' | 'select';

export const DatasetPanel: React.FC<DatasetNodePanelProps> = (data) => {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const [activeTab, setActiveTab] = useState<TabType>(
    data.fileId ? 'select' : 'upload'
  );
  const [fileData, setFileData] = useState({
    fileId: data.fileId || '',
    fileName: data.fileName || '',
    fileSize: data.fileSize || 0,
    uploadedAt: data.uploadedAt || '',
    contentType: data.contentType || '',
  });

  // If a file is already selected, default to the 'select' tab
  useEffect(() => {
    if (data.fileId && data.fileName) {
      setFileData({
        fileId: data.fileId,
        fileName: data.fileName,
        fileSize: data.fileSize || 0,
        uploadedAt: data.uploadedAt || '',
        contentType: data.contentType || '',
      });
    }
  }, [
    data.fileId,
    data.fileName,
    data.fileSize,
    data.uploadedAt,
    data.contentType,
  ]);

  // This function handles both FileUpload and FileSelector callbacks
  const handleFileSelected = async (
    fileId: string,
    fileName: string,
    fileSize?: number,
    contentType?: string,
    uploadedAt?: string
  ) => {
    // If we have complete information from the upload component, use it directly
    if (fileSize !== undefined && uploadedAt !== undefined) {
      const updatedFileData = {
        fileId,
        fileName,
        fileSize,
        uploadedAt,
        contentType: contentType || '',
      };

      setFileData(updatedFileData);

      // Call the onUpdate callback if provided
      if (data.onUpdate) {
        data.onUpdate({
          ...updatedFileData,
        });
      }
      return;
    }

    // Otherwise, fetch file details (for FileSelector)
    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/dataset?fileId=${fileId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch file details');
      }

      const fileDetails = await response.json();

      const updatedFileData = {
        fileId,
        fileName,
        fileSize: fileDetails.size,
        uploadedAt: fileDetails.uploadedAt,
        contentType: fileDetails.contentType,
      };

      setFileData(updatedFileData);

      // Call the onUpdate callback if provided
      if (data.onUpdate) {
        data.onUpdate({
          ...updatedFileData,
        });
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      // Fall back to basic info if fetch fails
      const basicFileData = {
        fileId,
        fileName,
        fileSize: 0,
        uploadedAt: '',
        contentType: '',
      };

      setFileData(basicFileData);

      if (data.onUpdate) {
        data.onUpdate({
          ...basicFileData,
        });
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0 || !bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-md border border-indigo-100">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dataset Source
          </label>

          <div className="flex border-b border-gray-200 mb-3">
            <button
              className={`flex items-center px-4 py-2 mr-2 text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={16} className="mr-1" />
              Upload New
            </button>
            <button
              className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'select'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('select')}
            >
              <List size={16} className="mr-1" />
              Select Existing
            </button>
          </div>

          {activeTab === 'upload' ? (
            <FileUpload onUploadComplete={handleFileSelected} />
          ) : (
            <FileSelector onFileSelect={handleFileSelected} />
          )}

          {fileData.fileId && (
            <div className="mt-3 space-y-3">
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected File
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  value={fileData.fileName}
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    value={fileData.fileId}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Size
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    value={formatFileSize(fileData.fileSize)}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    value={fileData.contentType || 'Unknown'}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uploaded At
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    value={formatDate(fileData.uploadedAt)}
                    disabled
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
