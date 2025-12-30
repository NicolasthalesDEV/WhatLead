import { prisma } from "@wacrm/db";
import bcrypt from "bcryptjs";

async function main() {
  // Company + User owner
  const company = await prisma.company.upsert({
    where: { slug: "pixelcode" },
    update: {},
    create: {
      name: "PixelCode",
      slug: "pixelcode",
    },
  });

  const hash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "owner@pixelcode.dev" },
    update: {},
    create: {
      companyId: company.id,
      email: "owner@pixelcode.dev",
      hash,
      name: "Owner",
      role: "OWNER"
    },
  });

  // Funnel stages
  const stages = ["Novo", "Qualificado", "Negociação", "Aguard. Pgto", "Pago"];
  for (let i = 0; i < stages.length; i++) {
    await prisma.funnelStage.upsert({
      where: { id: `${company.id}-${i}` },
      update: {},
      create: {
        id: `${company.id}-${i}`,
        companyId: company.id,
        name: stages[i],
        order: i,
        default: i === 0,
      },
    });
  }

  // Products basic
  await prisma.product.create({
    data: {
      companyId: company.id,
      title: "Painel LED 20W",
      slug: "painel-led-20w",
      description: "Iluminação branca neutra 4000K",
      prices: { create: { amount: 4990 } }
    }
  });

  console.log("Seed OK");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
