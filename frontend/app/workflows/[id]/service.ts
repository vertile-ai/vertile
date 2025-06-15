class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export async function getWorkflow(workflowId: string) {
  const response = await fetch(`/api/workflows/${workflowId}`);
  if (!response.ok) {
    throw new HttpError('Failed to get workflow', response.status);
  }
  return response.json();
}
