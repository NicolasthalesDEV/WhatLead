import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import { 
  UnauthorizedError, 
  ValidationError, 
  errorResponse 
} from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session.ok) {
      return session.res;
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validações
    if (!currentPassword || !newPassword) {
      throw new ValidationError("Senha atual e nova senha são obrigatórias");
    }

    if (newPassword.length < 8) {
      throw new ValidationError("A nova senha deve ter no mínimo 8 caracteres");
    }

    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { 
        id: true, 
        password: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("Usuário não encontrado");
    }

    // Verificar senha atual
    const isValidPassword = await compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new ValidationError("Senha atual incorreta");
    }

    // Hash da nova senha
    const hashedPassword = await hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        action: "PASSWORD_CHANGE",
        entity: "User",
        entityId: user.id,
        details: {
          email: user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    });
  } catch (error: any) {
    console.error("Failed to change password:", error);
    return errorResponse(error);
  }
}
