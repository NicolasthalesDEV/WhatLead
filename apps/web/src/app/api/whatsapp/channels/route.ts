import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth, createAuditLog } from "@/lib/auth";
import crypto from "crypto";
import { z } from "zod";

// Schema de validação
const CreateChannelSchema = z.object({
  phoneNumberId: z.string().min(1, "Phone Number ID é obrigatório"),
  waAccessToken: z.string().min(1, "Access Token é obrigatório"),
  waBusinessId: z.string().min(1, "Business Account ID é obrigatório"),
  displayName: z.string().optional(),
});

const UpdateChannelSchema = z.object({
  phoneNumberId: z.string().optional(),
  waAccessToken: z.string().optional(),
  waBusinessId: z.string().optional(),
  displayName: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// GET /api/whatsapp/channels - Listar canais da empresa
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.ok) {
      return authResult.res;
    }

    const channels = await prisma.whatsChannel.findMany({
      where: {
        companyId: authResult.companyId,
      },
      select: {
        id: true,
        phoneNumberId: true,
        waBusinessId: true,
        displayName: true,
        status: true,
        createdAt: true,
        // NÃO retornar o token por segurança
        waAccessToken: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("Error fetching WhatsApp channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/channels - Criar novo canal
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.ok) {
      return authResult.res;
    }

    const body = await req.json();
    const validatedData = CreateChannelSchema.parse(body);

    // Verificar se já existe um canal com este phoneNumberId
    const existing = await prisma.whatsChannel.findUnique({
      where: {
        phoneNumberId: validatedData.phoneNumberId,
      },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json(
          { error: "Este número já está cadastrado e ativo no sistema" },
          { status: 400 }
        );
      }
      // Canal inativo: reativar com as novas credenciais (sem bloquear re-adição)
    }

    // Testar as credenciais antes de salvar
    try {
      const testResponse = await fetch(
        `https://graph.facebook.com/${process.env.WA_API_VERSION || 'v25.0'}/${validatedData.phoneNumberId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${validatedData.waAccessToken}`,
          },
        }
      );

      if (!testResponse.ok) {
        return NextResponse.json(
          { 
            error: "Credenciais inválidas. Verifique o Phone Number ID e Access Token",
            details: await testResponse.text()
          },
          { status: 400 }
        );
      }

      const phoneInfo = await testResponse.json();

      // Reativar canal inativo com novas credenciais OU criar novo
      const channel = existing
        ? await prisma.whatsChannel.update({
            where: { id: existing.id },
            data: {
              companyId: authResult.companyId,
              waAccessToken: validatedData.waAccessToken,
              waBusinessId: validatedData.waBusinessId,
              displayName: validatedData.displayName || phoneInfo.display_phone_number || phoneInfo.verified_name || "WhatsApp",
              status: "ACTIVE",
            },
            select: {
              id: true,
              phoneNumberId: true,
              waBusinessId: true,
              displayName: true,
              status: true,
              createdAt: true,
            },
          })
        : await prisma.whatsChannel.create({
            data: {
              id: crypto.randomUUID(),
              companyId: authResult.companyId,
              phoneNumberId: validatedData.phoneNumberId,
              waAccessToken: validatedData.waAccessToken,
              waBusinessId: validatedData.waBusinessId,
              displayName: validatedData.displayName || phoneInfo.display_phone_number || phoneInfo.verified_name || "WhatsApp",
              status: "ACTIVE",
            },
            select: {
              id: true,
              phoneNumberId: true,
              waBusinessId: true,
              displayName: true,
              status: true,
              createdAt: true,
            },
          });

      await createAuditLog({
        userId: authResult.userId,
        companyId: authResult.companyId!,
        action: 'WHATSAPP_CHANNEL_CREATE',
        resource: 'whatsChannel',
        resourceId: channel.id,
        req,
      }).catch(() => {});

      return NextResponse.json({ channel }, { status: 201 });
    } catch (apiError: any) {
      console.error("Error validating WhatsApp credentials:", apiError);
      return NextResponse.json(
        { 
          error: "Não foi possível validar as credenciais do WhatsApp",
          details: apiError.message
        },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating WhatsApp channel:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}

// PATCH /api/whatsapp/channels - Atualizar canal ativo
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.ok) {
      return authResult.res;
    }

    const body = await req.json();
    const { channelId, ...updateData } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId é obrigatório" },
        { status: 400 }
      );
    }

    const validatedData = UpdateChannelSchema.parse(updateData);

    // Verificar se o canal existe e pertence à empresa
    const existing = await prisma.whatsChannel.findFirst({
      where: {
        id: channelId,
        companyId: authResult.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Canal não encontrado" },
        { status: 404 }
      );
    }

    // Se estiver atualizando o token, validar as credenciais
    if (validatedData.waAccessToken) {
      const phoneId = validatedData.phoneNumberId || existing.phoneNumberId;
      const token = validatedData.waAccessToken || existing.waAccessToken;

      try {
        const testResponse = await fetch(
          `https://graph.facebook.com/${process.env.WA_API_VERSION || 'v25.0'}/${phoneId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!testResponse.ok) {
          return NextResponse.json(
            { error: "Credenciais inválidas" },
            { status: 400 }
          );
        }
      } catch (apiError) {
        return NextResponse.json(
          { error: "Não foi possível validar as credenciais" },
          { status: 400 }
        );
      }
    }

    // Atualizar o canal
    const updated = await prisma.whatsChannel.update({
      where: { id: channelId },
      data: validatedData,
      select: {
        id: true,
        phoneNumberId: true,
        waBusinessId: true,
        displayName: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ channel: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating WhatsApp channel:", error);
    return NextResponse.json(
      { error: "Failed to update channel" },
      { status: 500 }
    );
  }
}

// DELETE /api/whatsapp/channels?channelId=xxx - Deletar canal
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.ok) {
      return authResult.res;
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o canal existe e pertence à empresa
    const existing = await prisma.whatsChannel.findFirst({
      where: {
        id: channelId,
        companyId: authResult.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Canal não encontrado" },
        { status: 404 }
      );
    }

    // Deletar todas as mensagens do canal e depois o canal (cascade manual)
    await prisma.$transaction([
      prisma.whatsMessage.deleteMany({
        where: { channelId },
      }),
      prisma.whatsChannel.delete({
        where: { id: channelId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting WhatsApp channel:", error);
    return NextResponse.json(
      { error: "Failed to delete channel" },
      { status: 500 }
    );
  }
}
