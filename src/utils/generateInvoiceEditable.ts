import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { toWords } from 'number-to-words';
import { Invoice, InvoiceItem, Customer, Inventory, TenantSettings } from '@prisma/client';

interface InvoiceItemWithProduct extends InvoiceItem {
  product: Inventory;
}

interface InvoiceWithDetails extends Invoice {
  items: InvoiceItemWithProduct[];
  customer: Customer;
  deliveryDate?: Date;
}

export const generateInvoicePDF = async (
  invoice: InvoiceWithDetails,
  settings: TenantSettings
): Promise<Buffer> => {
  return new Promise(async (resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

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
      const qrImage = await QRCode.toDataURL(upiLink);
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
      if (rowY > doc.page.height - 100) {
        doc.addPage();
        rowY = doc.y;
      }

      const values = [
        `${i + 1}`,
        item.product?.name || 'Unnamed',
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
    const words = toWords(invoice.totalPrice);
    doc.moveDown().fontSize(12).text(`Amount in Words: ${words} rupees only`);

    // Terms Section — move to new page if space is less
    if (settings.terms) {
      if (doc.y > doc.page.height - 150) doc.addPage();
      doc.moveDown(2);
      doc.fontSize(10).text('Terms & Conditions:', { underline: true });
      doc.text(settings.terms);
    }

    doc.end();
  });
};
