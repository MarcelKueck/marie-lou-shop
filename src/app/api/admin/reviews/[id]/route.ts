import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews, REVIEW_STATUS } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PATCH - Update review status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminResponse } = body;
    
    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (approved or rejected) is required' },
        { status: 400 }
      );
    }
    
    // Check if review exists
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
    });
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    const now = new Date();
    const updates: Partial<typeof reviews.$inferInsert> = {
      status: status as typeof REVIEW_STATUS.APPROVED | typeof REVIEW_STATUS.REJECTED,
    };
    
    if (status === 'approved') {
      updates.approvedAt = now;
    }
    
    if (adminResponse !== undefined) {
      updates.adminResponse = adminResponse;
      updates.adminRespondedAt = now;
    }
    
    await db.update(reviews)
      .set(updates)
      .where(eq(reviews.id, id));
    
    console.log(`Review ${id} status changed to ${status}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if review exists
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
    });
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    await db.delete(reviews).where(eq(reviews.id, id));
    
    console.log(`Review ${id} deleted`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
