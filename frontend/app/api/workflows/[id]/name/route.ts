import { NextRequest, NextResponse } from 'next/server';
import { workflowService } from '../../service';
import { z } from 'zod';

// Schema for validating the name update request
const updateNameSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
});

// PATCH /api/workflows/[id]/name - Update only the workflow name
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const body = await request.json();

    // Validate request body
    const result = updateNameSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }

    // Get the current workflow to ensure it exists
    const existingWorkflow = await workflowService.getWorkflowById(params.id);
    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Update just the name
    const updatedWorkflow = await workflowService.updateWorkflow(params.id, {
      name: result.data.name,
    });

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    console.error(`Error updating workflow name:`, error);
    // Add more detailed error info
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    return NextResponse.json(
      {
        error: 'Failed to update workflow name',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
