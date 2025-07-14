import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@dailysync/database';

// GET /api/reports/meeting/[id] - Get a specific meeting report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const meetingReport = await prisma.meetingReport.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!meetingReport) {
      return NextResponse.json(
        { success: false, error: 'Meeting report not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this meeting report
    if (meetingReport.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meetingReport
    });

  } catch (error) {
    console.error('Error fetching meeting report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/meeting/[id] - Update a specific meeting report
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate the meeting report exists
    const existingReport = await prisma.meetingReport.findUnique({
      where: { id }
    });

    if (!existingReport) {
      return NextResponse.json(
        { success: false, error: 'Meeting report not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this meeting report
    if (existingReport.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the meeting report
    const updatedReport = await prisma.meetingReport.update({
      where: { id },
      data: {
        title: body.title,
        notes: body.notes,
        outcome: body.outcome,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        isAssigned: body.isAssigned,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedReport,
      message: 'Meeting report updated successfully'
    });

  } catch (error) {
    console.error('Error updating meeting report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/meeting/[id] - Delete a specific meeting report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate the meeting report exists
    const existingReport = await prisma.meetingReport.findUnique({
      where: { id }
    });

    if (!existingReport) {
      return NextResponse.json(
        { success: false, error: 'Meeting report not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this meeting report
    if (existingReport.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete the meeting report
    await prisma.meetingReport.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Meeting report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meeting report:', error);
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete meeting report: it is referenced by other records' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
