import { NextRequest, NextResponse } from 'next/server';
import { getExecutionOrder } from '@/app/lib/graph';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const workflowData = await req.json();

    // First validate the workflow data
    if (!workflowData || !workflowData.nodes || !workflowData.edges) {
      return NextResponse.json(
        { error: 'Invalid workflow data' },
        { status: 400 }
      );
    }

    // Get the execution order
    const { order, error } = getExecutionOrder(
      workflowData.nodes,
      workflowData.edges
    );

    if (error || !order) {
      return NextResponse.json(
        { error: error || 'Failed to create execution order' },
        { status: 400 }
      );
    }

    // Return the execution order
    return NextResponse.json({
      workflowId,
      executionOrder: order,
      status: 'started',
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
