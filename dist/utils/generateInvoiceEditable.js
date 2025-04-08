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
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
const number_to_words_1 = require("number-to-words");
const generateInvoicePDF = (invoice, settings) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = new pdfkit_1.default({ margin: 50 });
        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        // Business Info
        doc.fontSize(16).text(settings.businessName, { align: 'left' });
        doc.fontSize(12).text(settings.address);
        doc.text(`Phone: ${settings.phone}`);
        doc.text(`GSTIN: ${settings.gstin}`);
        doc.moveDown();
        // QR Code for payment (top-right)
        if (settings.upiId) {
            const upiLink = `upi://pay?pa=${settings.upiId}&pn=${settings.businessName}&cu=INR&am=${invoice.totalPrice}`;
            const qrImage = yield qrcode_1.default.toDataURL(upiLink);
            doc.image(qrImage, doc.page.width - 120, 40, { width: 80 });
        }
        // Invoice Title
        doc.fontSize(22).text('Invoice Receipt', { align: 'center' });
        doc.moveDown();
        // Invoice Metadata
        doc.fontSize(12).text(`Receipt No: ${invoice.receiptNumber}`);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
        if (invoice.deliveryDate) {
            doc.text(`Delivery Date: ${new Date(invoice.deliveryDate).toLocaleDateString()}`);
        }
        doc.moveDown();
        // Customer Info
        doc.fontSize(14).text('Customer Details:');
        doc.fontSize(12).text(`Name: ${invoice.customer.name}`);
        doc.text(`Email: ${invoice.customer.email}`);
        doc.text(`Phone: ${invoice.customer.phone}`);
        doc.moveDown();
        // Table
        const tableTop = doc.y;
        const columnWidths = [30, 100, 40, 60, 60, 60, 60];
        const startX = doc.x;
        doc.fontSize(13);
        doc.text('No.', startX, tableTop, { width: columnWidths[0], align: 'center' });
        doc.text('Product', startX + columnWidths[0], tableTop, { width: columnWidths[1], align: 'left' });
        doc.text('Qty', startX + columnWidths[0] + columnWidths[1], tableTop, { width: columnWidths[2], align: 'center' });
        doc.text('Price', startX + columnWidths[0] + columnWidths[1] + columnWidths[2], tableTop, { width: columnWidths[3], align: 'right' });
        doc.text('Tax %', startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], tableTop, { width: columnWidths[4], align: 'right' });
        doc.text('Tax Amt', startX + columnWidths.slice(0, 5).reduce((a, b) => a + b, 0), tableTop, { width: columnWidths[5], align: 'right' });
        doc.text('Total', startX + columnWidths.slice(0, 6).reduce((a, b) => a + b, 0), tableTop, { width: columnWidths[6], align: 'right' });
        doc.moveTo(startX, tableTop + 15)
            .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), tableTop + 15)
            .stroke();
        // Items
        let rowY = tableTop + 20;
        doc.fontSize(12);
        invoice.items.forEach((item, i) => {
            var _a;
            const total = `₹${item.totalPrice.toLocaleString('en-IN')}`;
            const taxRate = item.taxRate ? `${(item.taxRate * 100).toFixed(2)}%` : '—';
            const taxAmt = item.taxAmount ? `₹${item.taxAmount.toLocaleString('en-IN')}` : '—';
            const price = `₹${item.price.toLocaleString('en-IN')}`;
            doc.text(`${i + 1}`, startX, rowY, { width: columnWidths[0], align: 'center' });
            doc.text(((_a = item.product) === null || _a === void 0 ? void 0 : _a.name) || 'Unnamed', startX + columnWidths[0], rowY, { width: columnWidths[1] });
            doc.text(item.quantity.toString(), startX + columnWidths[0] + columnWidths[1], rowY, { width: columnWidths[2], align: 'center' });
            doc.text(price, startX + columnWidths[0] + columnWidths[1] + columnWidths[2], rowY, { width: columnWidths[3], align: 'right' });
            doc.text(taxRate, startX + columnWidths.slice(0, 4).reduce((a, b) => a + b, 0), rowY, { width: columnWidths[4], align: 'right' });
            doc.text(taxAmt, startX + columnWidths.slice(0, 5).reduce((a, b) => a + b, 0), rowY, { width: columnWidths[5], align: 'right' });
            doc.text(total, startX + columnWidths.slice(0, 6).reduce((a, b) => a + b, 0), rowY, { width: columnWidths[6], align: 'right' });
            rowY += 20;
        });
        // Totals
        const cgst = invoice.totalTax / 2;
        const sgst = invoice.totalTax / 2;
        doc.moveDown();
        doc.fontSize(13).text(`CGST: ₹${cgst.toFixed(2)}`, { align: 'right' });
        doc.text(`SGST: ₹${sgst.toFixed(2)}`, { align: 'right' });
        doc.text(`Total Tax: ₹${invoice.totalTax.toLocaleString('en-IN')}`, { align: 'right' });
        doc.text(`Grand Total: ₹${invoice.totalPrice.toLocaleString('en-IN')}`, { align: 'right' });
        // Amount in words
        const words = (0, number_to_words_1.toWords)(invoice.totalPrice);
        doc.moveDown().fontSize(12).text(`Amount in Words: ${words} rupees only`, { align: 'left' });
        // Terms
        if (settings.terms) {
            doc.moveDown(2);
            doc.fontSize(10).text(`Terms & Conditions:\n${settings.terms}`);
        }
        doc.end();
    }));
});
exports.generateInvoicePDF = generateInvoicePDF;
//# sourceMappingURL=generateInvoiceEditable.js.map