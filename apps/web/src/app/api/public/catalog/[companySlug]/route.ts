import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";

export async function GET(
  _req: NextRequest, 
  { params }: { params: Promise<{ companySlug: string }> }
) {
  const { companySlug } = await params;
  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

  const products = await prisma.product.findMany({
    where: { companyId: company.id, active: true },
    include: { prices: { where: { active: true }, orderBy: { createdAt: "desc" }, take: 1 } }
  });
  return NextResponse.json({ company: { name: company.name, slug: company.slug }, products });
}
