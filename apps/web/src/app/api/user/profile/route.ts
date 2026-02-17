import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@wacrm/db';
import { z } from 'zod';

// GET /api/user/profile - Get current user profile
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.uid },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatarUrl: null,
        preferences: null,
        emailVerified: false,
        twoFactorEnabled: false,
        lastLoginAt: null,
        createdAt: profile.createdAt,
        company: profile.company,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/user/profile - Update current user profile
export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validation schema
    const schema = z.object({
      name: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { name, email } = result.data;

    // Get current user to check email
    const currentUser = await prisma.user.findUnique({
      where: { id: user.uid },
      select: { email: true },
    });

    // Check if email is being changed and if it's already in use
    if (email && currentUser && email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.uid) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const updatedUser = await prisma.user.update({
      where: { id: user.uid },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: null,
        preferences: null,
        emailVerified: false,
        twoFactorEnabled: false,
        lastLoginAt: null,
        createdAt: updatedUser.createdAt,
        company: updatedUser.company,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
