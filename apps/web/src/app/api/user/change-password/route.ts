import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog, verifyAuth } from '@/lib/auth';
import { prisma } from '@wacrm/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// POST /api/user/change-password - Change user password
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validation schema
    const schema = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
      confirmPassword: z.string().min(1, 'Confirm password is required'),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = result.data;

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Get user with password hash
    const userProfile = await prisma.user.findUnique({
      where: { id: user.uid },
      select: {
        id: true,
        hash: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userProfile.hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.uid },
      data: {
        hash: newHash,
      },
    });

    await createAuditLog({
      userId: user.uid,
      companyId: user.companyId,
      action: 'PASSWORD_CHANGED',
      resource: 'User',
      resourceId: user.uid,
      metadata: { method: 'user_initiated' },
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
