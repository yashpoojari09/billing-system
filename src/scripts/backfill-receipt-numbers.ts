// scripts/backfill-receipt-numbers.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    where: { receiptNumber: null },
  });

  for (const invoice of invoices) {
    const newReceipt = `INV-${new Date().getFullYear()}-${invoice.id.slice(0, 6).toUpperCase()}`;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { receiptNumber: newReceipt },
    });

    console.log(`✅ Updated invoice ${invoice.id} with receipt ${newReceipt}`);
  }

  console.log(`🎉 Done. Backfilled ${invoices.length} invoices.`);
}

main()
  .catch((e) => {
    console.error("❌ Error backfilling:", e);
  })
  .finally(() => prisma.$disconnect());
