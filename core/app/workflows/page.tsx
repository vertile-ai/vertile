'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Workflow } from '@prisma/client';

import { formatDistanceToNow } from 'date-fns';
import {
  PlusCircle,
  Trash,
  Pencil,
  DownloadSimple,
  Circuitry,
} from '@phosphor-icons/react';

import { useWorkflows } from './hook';
export default function WorkflowsPage() {
  const router = useRouter();
  const { loading, error, fetchWorkflows, deleteWorkflow } = useWorkflows();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    const data = await fetchWorkflows();
    setWorkflows(data);
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this workflow?')) {
      setIsDeleting(id);
      const success = await deleteWorkflow(id);
      if (success) {
        setWorkflows((prev) => prev.filter((workflow) => workflow.id !== id));
      }
      setIsDeleting(null);
    }
  };

  const handleEdit = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    router.push(`/workflows/${id}`);
  };

  const handleExport = (workflow: Workflow, event: React.MouseEvent) => {
    event.stopPropagation();
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(workflow));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${workflow.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Workflows</h1>
        <button
          onClick={() => router.push('/workflows/new')}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          <PlusCircle size={20} weight="bold" />
          <span>New Workflow</span>
        </button>
      </div>

      {loading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div
          className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-8"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && workflows.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Circuitry size={48} color="#3B82F6" weight="duotone" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No workflows yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first workflow to get started
          </p>
          <button
            onClick={() => router.push('/workflows/new')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Create Workflow
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            onClick={() => router.push(`/workflows/${workflow.id}`)}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow transition-shadow duration-200 cursor-pointer group"
          >
            <div className="h-40 bg-gradient-to-r from-sky-200 to-cyan-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-50 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate group-hover:text-blue-500 transition-colors duration-200">
                {workflow.name}
              </h3>
              {workflow.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {workflow.description}
                </p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Updated{' '}
                  {formatDistanceToNow(new Date(workflow.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => handleExport(workflow, e)}
                    className="text-gray-500 hover:text-blue-500 p-1 rounded-full hover:bg-gray-50"
                    title="Export workflow"
                  >
                    <DownloadSimple size={18} />
                  </button>
                  <button
                    onClick={(e) => handleEdit(workflow.id, e)}
                    className="text-gray-500 hover:text-blue-500 p-1 rounded-full hover:bg-gray-50"
                    title="Edit workflow"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(workflow.id, e)}
                    className={`text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-gray-50 ${
                      isDeleting === workflow.id
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    disabled={isDeleting === workflow.id}
                    title="Delete workflow"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
