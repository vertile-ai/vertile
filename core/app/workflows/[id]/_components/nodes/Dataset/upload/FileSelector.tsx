import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Clock, FileText } from '@phosphor-icons/react';

interface DatasetFile {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

interface FileSelectorProps {
  onFileSelect: (
    fileId: string,
    filename: string,
    size?: number,
    contentType?: string,
    uploadedAt?: string
  ) => void;
  acceptedFileTypes?: string;
}

export const FileSelector: React.FC<FileSelectorProps> = ({ onFileSelect }) => {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const [files, setFiles] = useState<DatasetFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/workflows/${workflowId}/dataset`);

        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }

        const data = await response.json();

        // Filter files by accepted types if specified
        let filteredFiles = data.files;

        setFiles(filteredFiles);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [workflowId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleFileSelection = (file: DatasetFile) => {
    onFileSelect(
      file.id,
      file.filename,
      file.size,
      file.contentType,
      file.uploadedAt
    );
  };

  if (loading) {
    return (
      <div className="text-center p-4 text-gray-500">Loading files...</div>
    );
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  if (files.length === 0) {
    return <div className="text-center p-4 text-gray-500">No files found</div>;
  }

  return (
    <div className="max-h-60 overflow-y-auto border rounded-md">
      {files.map((file) => (
        <div
          key={file.id}
          onClick={() => handleFileSelection(file)}
          className="p-3 border-b last:border-b-0 hover:bg-indigo-50 cursor-pointer transition-colors flex items-start"
        >
          <FileText size={20} className="text-indigo-500 mr-3 mt-1 shrink-0" />
          <div className="flex-grow min-w-0">
            <div className="font-medium text-gray-800 truncate">
              {file.filename}
            </div>
            <div className="text-xs text-gray-500 flex items-center mt-1">
              <span className="mr-3">{formatFileSize(file.size)}</span>
              <span className="flex items-center">
                <Clock size={12} className="inline mr-1" />
                {formatDate(file.uploadedAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
