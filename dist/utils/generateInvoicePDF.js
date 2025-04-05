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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePDF = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const path_1 = __importDefault(require("path"));
const generateInvoicePDF = (invoice) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = `receipt-${invoice.receiptNumber}.pdf`;
    const filePath = path_1.default.resolve(__dirname, `../public/receipts/${fileName}`);
    const createdAt = invoice.createdAt
        ? new Date(invoice.createdAt)
        : new Date();
    const formattedDate = createdAt.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    });
    const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 2rem; }
        </style>
      </head>
      <body>
        <h1>Invoice #${invoice.receiptNumber}</h1>
        <p>Created: ${formattedDate}</p>
        <p>Customer: ${invoice.customer.name} (${invoice.customer.email})</p>
        <p>Total: $${invoice.totalPrice.toFixed(2)}</p>
        <p>Tax: $${invoice.totalTax.toFixed(2)}</p>
        <hr />
        <h2>Items:</h2>
        <ul>
          ${invoice.items.map((item) => `
            <li>${item.quantity} x ${item.productId} @ $${item.price.toFixed(2)}</li>
          `).join('')}
        </ul>
      </body>
    </html>
  `;
    const browser = yield puppeteer_1.default.launch();
    const page = yield browser.newPage();
    yield page.setContent(htmlContent, { waitUntil: "networkidle0" });
    yield page.pdf({ path: filePath, format: "A4" });
    yield browser.close();
    return `/receipts/${fileName}`; // Public-facing path
});
exports.generateInvoicePDF = generateInvoicePDF;
//# sourceMappingURL=generateInvoicePDF.js.map