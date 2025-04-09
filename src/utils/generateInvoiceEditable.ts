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
  deliveryDate?: Date; // Added deliveryDate as an optional property
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

    // Fonts
    doc.font('Helvetica');

    // Header - Business Info + QR Code
    doc
      .fontSize(18)
      .fillColor('#001e38')
      .text(settings.businessName, 50, 50);

    doc
      .fontSize(10)
      .fillColor('black')
      .text(settings.address, { continued: false })
      .text(`Phone: ${settings.phone}`)
      .text(`GSTIN: ${settings.gstin}`);

    if (settings.upiId) {
      const qrData = `upi://pay?pa=${settings.upiId}&pn=${settings.businessName}&cu=INR&am=${invoice.totalPrice}`;
      const qrCode = await QRCode.toDataURL(qrData);
      doc.image(qrCode, doc.page.width - 120, 50, { width: 70 });
    }

    doc.moveDown(2);

    // Title
    doc
      .fontSize(20)
      .fillColor('#001e38')
      .text('INVOICE RECEIPT', { align: 'center' });
    doc.moveDown();

    // Invoice Metadata
    doc
      .fontSize(12)
      .fillColor('black')
      .text(`Receipt No: ${invoice.receiptNumber}`)
      .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);

    if (invoice.deliveryDate) {
      doc.text(`Delivery Date: ${new Date(invoice.deliveryDate).toLocaleDateString()}`);
    }

    doc.moveDown(1.5);

    // Customer Info
    doc
      .fontSize(13)
      .fillColor('#001e38')
      .text('Customer Details', { underline: true });

    doc
      .fontSize(12)
      .fillColor('black')
      .text(`Name: ${invoice.customer.name}`)
      .text(`Email: ${invoice.customer.email}`)
      .text(`Phone: ${invoice.customer.phone}`);

    doc.moveDown(1.5);

    // Table Headers
    const tableTop = doc.y;
    const startX = 50;
    const colWidths = [30, 140, 40, 60, 60, 60, 70];

    const drawTableHeader = () => {
      const headers = ['#', 'Product', 'Qty', 'Price', 'Tax %', 'Tax Amt', 'Total'];
      doc.fontSize(12).font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, {
          width: colWidths[i],
          align: 'center',
        });
      });
      doc.moveTo(startX, tableTop + 15)
        .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
        .stroke();
    };

    drawTableHeader();

    // Table Rows
    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(11);

    invoice.items.forEach((item, index) => {
      const row = [
        `${index + 1}`,
        item.product?.name || 'Unnamed',
        item.quantity.toString(),
        `₹${item.price.toFixed(2)}`,
        item.taxRate ? `${(item.taxRate * 100).toFixed(2)}%` : '—',
        item.taxAmount ? `₹${item.taxAmount.toFixed(2)}` : '—',
        `₹${item.totalPrice.toFixed(2)}`,
      ];

      row.forEach((text, i) => {
        doc.text(text, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
          width: colWidths[i],
          align: i === 1 ? 'left' : 'center',
        });
      });

      y += 20;
    });

    doc.moveDown(1);

    // Totals
    const cgst = invoice.totalTax / 2;
    const sgst = invoice.totalTax / 2;
    doc
      .fontSize(12)
      .text(`CGST: ₹${cgst.toFixed(2)}`, { align: 'right' })
      .text(`SGST: ₹${sgst.toFixed(2)}`, { align: 'right' })
      .text(`Total Tax: ₹${invoice.totalTax.toFixed(2)}`, { align: 'right' })
      .text(`Grand Total: ₹${invoice.totalPrice.toFixed(2)}`, { align: 'right' });

    doc.moveDown();

    // Amount in words
    const inWords = toWords(invoice.totalPrice);
    doc
      .fontSize(11)
      .text(`Amount in Words: ${inWords} rupees only`, { align: 'left' });

    // Terms & Conditions
    if (settings.terms) {
      doc.moveDown(2);
      doc
        .fontSize(10)
        .fillColor('#555555')
        .text('Terms & Conditions:', { underline: true })
        .text(settings.terms);
    }

    doc.end();
  });
};
