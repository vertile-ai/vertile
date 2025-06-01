export async function getWorkflow(workflowId: string) {
  const response = await fetch(`/api/workflows/${workflowId}`);
  if (!response.ok) {
    throw new Error('Failed to get workflow');
  }

  return response.json();
}
