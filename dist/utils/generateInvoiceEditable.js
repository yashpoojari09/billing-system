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
        // Header Section: Business Info
        doc.fontSize(16).text(settings.businessName, { align: 'left' });
        doc.fontSize(12).text(settings.address);
        doc.text(`Phone: ${settings.phone}`);
        doc.text(`GSTIN: ${settings.gstin}`);
        // QR Code (top-right)
        if (settings.upiId) {
            const upiLink = `upi://pay?pa=${settings.upiId}&pn=${settings.businessName}&cu=INR&am=${invoice.totalPrice}`;
            const qrImage = yield qrcode_1.default.toDataURL(upiLink);
            doc.image(qrImage, doc.page.width - 120, 50, { width: 80 });
        }
        doc.moveDown(1.5);
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
        doc.fontSize(14).text('Customer Details:', { underline: true });
        doc.fontSize(12).text(`Name: ${invoice.customer.name}`);
        doc.text(`Email: ${invoice.customer.email}`);
        doc.text(`Phone: ${invoice.customer.phone}`);
        doc.moveDown();
        // Table Header
        const tableTop = doc.y;
        const colWidths = [30, 120, 40, 60, 50, 60, 70];
        const startX = doc.x;
        doc.fontSize(13);
        const headers = ['No.', 'Product', 'Qty', 'Price', 'Tax %', 'Tax Amt', 'Total'];
        headers.forEach((header, i) => {
            const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(header, x, tableTop, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
        });
        doc.moveTo(startX, tableTop + 15)
            .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
            .stroke();
        // Table Rows
        let rowY = tableTop + 20;
        doc.fontSize(11);
        invoice.items.forEach((item, i) => {
            var _a;
            if (rowY > doc.page.height - 100) {
                doc.addPage();
                rowY = doc.y;
            }
            const values = [
                `${i + 1}`,
                ((_a = item.product) === null || _a === void 0 ? void 0 : _a.name) || 'Unnamed',
                `${item.quantity}`,
                `₹${item.price.toLocaleString('en-IN')}`,
                item.taxRate ? `${(item.taxRate * 100).toFixed(2)}%` : '—',
                item.taxAmount ? `₹${item.taxAmount.toLocaleString('en-IN')}` : '—',
                `₹${item.totalPrice.toLocaleString('en-IN')}`,
            ];
            values.forEach((val, j) => {
                const x = startX + colWidths.slice(0, j).reduce((a, b) => a + b, 0);
                doc.text(val, x, rowY, { width: colWidths[j], align: j === 1 ? 'left' : 'right' });
            });
            rowY += 20;
        });
        // Totals
        const cgst = invoice.totalTax / 2;
        const sgst = invoice.totalTax / 2;
        doc.moveDown(1.5);
        doc.fontSize(13);
        doc.text(`CGST: ₹${cgst.toFixed(2)}`, { align: 'right' });
        doc.text(`SGST: ₹${sgst.toFixed(2)}`, { align: 'right' });
        doc.text(`Total Tax: ₹${invoice.totalTax.toLocaleString('en-IN')}`, { align: 'right' });
        doc.text(`Grand Total: ₹${invoice.totalPrice.toLocaleString('en-IN')}`, { align: 'right' });
        // Amount in Words
        const words = (0, number_to_words_1.toWords)(invoice.totalPrice);
        doc.moveDown().fontSize(12).text(`Amount in Words: ${words} rupees only`);
        // Terms Section — move to new page if space is less
        if (settings.terms) {
            if (doc.y > doc.page.height - 150)
                doc.addPage();
            doc.moveDown(2);
            doc.fontSize(10).text('Terms & Conditions:', { underline: true });
            doc.text(settings.terms);
        }
        doc.end();
    }));
});
exports.generateInvoicePDF = generateInvoicePDF;
//# sourceMappingURL=generateInvoiceEditable.js.map