"use strict";
// import PDFDocument from 'pdfkit';
// import QRCode from 'qrcode';
// import { toWords } from 'number-to-words';
// import { Invoice, InvoiceItem, Customer, Inventory, TenantSettings } from '@prisma/client';
// interface InvoiceItemWithProduct extends InvoiceItem {
//   product: Inventory;
// }
// interface InvoiceWithDetails extends Invoice {
//   items: InvoiceItemWithProduct[];
//   customer: Customer;
//   deliveryDate?: Date; // Added deliveryDate as an optional property
// }
// export const generateInvoicePDF = async (
//   invoice: InvoiceWithDetails,
//   settings: TenantSettings
// ): Promise<Buffer> => {
//   return new Promise(async (resolve) => {
//     const doc = new PDFDocument({ margin: 50 });
//     const buffers: Buffer[] = [];
//     doc.on('data', (chunk) => buffers.push(chunk));
//     doc.on('end', () => resolve(Buffer.concat(buffers)));
//     // Business Info
//     doc.fontSize(16).text(settings.businessName, { align: 'left' });
//     doc.fontSize(12).text(settings.address);
//     doc.text(`Phone: ${settings.phone}`);
//     doc.text(`GSTIN: ${settings.gstin}`);
//     doc.moveDown();
//     // QR Code for payment (top-right)
//     if (settings.upiId) {
//       const upiLink = `upi://pay?pa=${settings.upiId}&pn=${settings.businessName}&cu=INR&am=${invoice.totalPrice}`;
//       const qrImage = await QRCode.toDataURL(upiLink);
//       doc.image(qrImage, doc.page.width - 120, 40, { width: 80 });
//     }
//     // Invoice Title
//     doc.fontSize(22).text('Invoice Receipt', { align: 'center' });
//     doc.moveDown();
//     // Invoice Metadata
//     doc.fontSize(12).text(`Receipt No: ${invoice.receiptNumber}`);
//     doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
//     if (invoice.deliveryDate) {
//       doc.text(`Delivery Date: ${new Date(invoice.deliveryDate).toLocaleDateString()}`);
//     }
//     doc.moveDown();
//     // Customer Info
//     doc.fontSize(14).text('Customer Details:');
//     doc.fontSize(12).text(`Name: ${invoice.customer.name}`);
//     doc.text(`Email: ${invoice.customer.email}`);
//     doc.text(`Phone: ${invoice.customer.phone}`);
//     doc.moveDown();
//     // Table
//     const tableTop = doc.y;
//     const columnWidths = [30, 100, 40, 60, 60, 60, 60];
//     const startX = doc.x;
//     doc.fontSize(13);
//     doc.text('No.', startX, tableTop, { width: columnWidths[0], align: 'center' });
//     doc.text('Product', startX + columnWidths[0], tableTop, { width: columnWidths[1], align: 'left' });
//     doc.text('Qty', startX + columnWidths[0] + columnWidths[1], tableTop, { width: columnWidths[2], align: 'center' });
//     doc.text('Price', startX + columnWidths[0] + columnWidths[1] + columnWidths[2], tableTop, { width: columnWidths[3], align: 'right' });
//     doc.text('Tax %', startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], tableTop, { width: columnWidths[4], align: 'right' });
//     doc.text('Tax Amt', startX + columnWidths.slice(0, 5).reduce((a, b) => a + b, 0), tableTop, { width: columnWidths[5], align: 'right' });
//     doc.text('Total', startX + columnWidths.slice(0, 6).reduce((a, b) => a + b, 0), tableTop, { width: columnWidths[6], align: 'right' });
//     doc.moveTo(startX, tableTop + 15)
//       .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), tableTop + 15)
//       .stroke();
//     // Items
//     let rowY = tableTop + 20;
//     doc.fontSize(12);
//     invoice.items.forEach((item, i) => {
//       const total = `₹${item.totalPrice.toLocaleString('en-IN')}`;
//       const taxRate = item.taxRate ? `${(item.taxRate * 100).toFixed(2)}%` : '—';
//       const taxAmt = item.taxAmount ? `₹${item.taxAmount.toLocaleString('en-IN')}` : '—';
//       const price = `₹${item.price.toLocaleString('en-IN')}`;
//       doc.text(`${i + 1}`, startX, rowY, { width: columnWidths[0], align: 'center' });
//       doc.text(item.product?.name || 'Unnamed', startX + columnWidths[0], rowY, { width: columnWidths[1] });
//       doc.text(item.quantity.toString(), startX + columnWidths[0] + columnWidths[1], rowY, { width: columnWidths[2], align: 'center' });
//       doc.text(price, startX + columnWidths[0] + columnWidths[1] + columnWidths[2], rowY, { width: columnWidths[3], align: 'right' });
//       doc.text(taxRate, startX + columnWidths.slice(0, 4).reduce((a, b) => a + b, 0), rowY, { width: columnWidths[4], align: 'right' });
//       doc.text(taxAmt, startX + columnWidths.slice(0, 5).reduce((a, b) => a + b, 0), rowY, { width: columnWidths[5], align: 'right' });
//       doc.text(total, startX + columnWidths.slice(0, 6).reduce((a, b) => a + b, 0), rowY, { width: columnWidths[6], align: 'right' });
//       rowY += 20;
//     });
//     // Totals
//     const cgst = invoice.totalTax / 2;
//     const sgst = invoice.totalTax / 2;
//     doc.moveDown();
//     doc.fontSize(13).text(`CGST: ₹${cgst.toFixed(2)}`, { align: 'right' });
//     doc.text(`SGST: ₹${sgst.toFixed(2)}`, { align: 'right' });
//     doc.text(`Total Tax: ₹${invoice.totalTax.toLocaleString('en-IN')}`, { align: 'right' });
//     doc.text(`Grand Total: ₹${invoice.totalPrice.toLocaleString('en-IN')}`, { align: 'right' });
//     // Amount in words
//     const words = toWords(invoice.totalPrice);
//     doc.moveDown().fontSize(12).text(`Amount in Words: ${words} rupees only`, { align: 'left' });
//     // Terms
//     if (settings.terms) {
//       doc.moveDown(2);
//       doc.x = doc.page.margins.left; // reset to left margin
//       doc.fontSize(10).text('Terms & Conditions:', { align: 'left' });
//       doc.moveDown(0.5);
//       doc.text(settings.terms, {
//         align: 'left',
//         width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
//       });
//     }
//     doc.end();
//   });
// };
//# sourceMappingURL=generateInvoiceEditable.js.map