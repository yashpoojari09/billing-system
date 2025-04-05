"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/backfill-receipt-numbers.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const invoices = yield prisma.invoice.findMany({
            where: { receiptNumber: null },
        });
        for (const invoice of invoices) {
            const newReceipt = `INV-${new Date().getFullYear()}-${invoice.id.slice(0, 6).toUpperCase()}`;
            yield prisma.invoice.update({
                where: { id: invoice.id },
                data: { receiptNumber: newReceipt },
            });
            console.log(`✅ Updated invoice ${invoice.id} with receipt ${newReceipt}`);
        }
        console.log(`🎉 Done. Backfilled ${invoices.length} invoices.`);
    });
}
main()
    .catch((e) => {
    console.error("❌ Error backfilling:", e);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=backfill-receipt-numbers.js.map