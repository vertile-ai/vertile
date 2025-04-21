import { NextRequest, NextResponse } from 'next/server';
import { workflowService } from './service';
import { createWorkflowSchema, updateWorkflowSchema } from './validation';

// GET /api/workflows - Get all workflows
export async function GET() {
  try {
    const workflows = await workflowService.getAllWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = createWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const workflow = await workflowService.createWorkflow(result.data);
    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
} 