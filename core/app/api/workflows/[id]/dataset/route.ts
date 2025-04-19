import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import prisma from '@/app/lib/prisma';

// Handle file uploads for datasets
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const formData = await req.formData();

    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), '..', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Generate a unique filename
    const filename = `${Date.now()}-${file.name}`;
    const filePath = join(uploadDir, filename);

    // Write the file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file metadata to database
    const datasetFile = await prisma.datasetFile.create({
      data: {
        filename: file.name,
        contentType: file.type,
        size: file.size,
        path: `uploads/${workflowId}/${filename}`,
      },
    });

    return NextResponse.json({
      success: true,
      fileId: datasetFile.id,
      filename: datasetFile.filename,
      size: datasetFile.size,
      uploadedAt: datasetFile.uploadedAt,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Get files - either a single file by ID or all files
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    // If no fileId is provided, return all dataset files
    if (!fileId) {
      const datasetFiles = await prisma.datasetFile.findMany({
        orderBy: {
          uploadedAt: 'desc',
        },
      });

      return NextResponse.json({
        files: datasetFiles,
        count: datasetFiles.length,
      });
    }

    // If fileId is provided, return the specific file
    const datasetFile = await prisma.datasetFile.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!datasetFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json(datasetFile);
  } catch (error) {
    console.error('Error retrieving file(s):', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file(s)' },
      { status: 500 }
    );
  }
}
