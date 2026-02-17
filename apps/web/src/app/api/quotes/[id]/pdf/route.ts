import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@wacrm/db';
import { generatePdf, generateQuoteHtml } from '@/lib/pdf';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await verifyAuth(req);
    
    if (!claims) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Fetch quote with all relations
    const quote = await prisma.quote.findUnique({
      where: {
        id,
        companyId: claims.companyId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    // Fetch company info
    const company = await prisma.company.findUnique({
      where: { id: claims.companyId },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Generate HTML from template
    const html = generateQuoteHtml(quote, company);

    // Generate PDF
    const pdfBuffer = await generatePdf({
      html,
      filename: `orcamento-${quote.id}.pdf`,
    });

    // Return PDF with proper headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="orcamento-${quote.id.slice(-8)}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar PDF do orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PDF', details: error.message },
      { status: 500 }
    );
  }
}
