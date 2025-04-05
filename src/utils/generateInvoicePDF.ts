import PDFDocument from 'pdfkit';
import { Invoice, InvoiceItem, Customer, Inventory } from '@prisma/client';

interface InvoiceItemWithProduct extends InvoiceItem {
  product: Inventory;
}

interface InvoiceWithDetails extends Invoice {
  items: InvoiceItemWithProduct[];
  customer: Customer;
}

export const generateInvoicePDF = (invoice: InvoiceWithDetails): Promise<Buffer> => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    // Title
    doc.fontSize(22).text(`Invoice Receipt`, { align: 'center' });
    doc.moveDown();

    // Invoice Metadata
    doc.fontSize(12).text(`Receipt No: ${invoice.receiptNumber}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleString()}`);
    doc.moveDown();

    // Customer Info
    doc.fontSize(14).text(`Customer Details:`);
    doc.fontSize(12).text(`Name: ${invoice.customer.name}`);
    doc.text(`Email: ${invoice.customer.email}`);
    doc.text(`Phone: ${invoice.customer.phone}`);
    doc.moveDown();

    // Table Header
    const tableTop = doc.y;
    const columnWidths = [40, 200, 60, 100, 100];
    const startX = doc.x;

    doc.fontSize(13).text(`No.`, startX, tableTop);
    doc.text(`Product`, startX + columnWidths[0], tableTop);
    doc.text(`Qty`, startX + columnWidths[0] + columnWidths[1], tableTop);
    doc.text(`Price`, startX + columnWidths[0] + columnWidths[1] + columnWidths[2], tableTop);
    doc.text(`Total`, startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], tableTop);

    // Draw header underline
    doc.moveTo(startX, tableTop + 15)
      .lineTo(startX + columnWidths.reduce((a, b) => a + b), tableTop + 15)
      .stroke();

    // Table rows
    let rowY = tableTop + 20;
    doc.fontSize(12);
    invoice.items.forEach((item, index) => {
      const productName = item.product?.name || 'Unnamed Product';
      const price = `₹${item.price.toLocaleString('en-IN')}`;
      const total = `₹${item.totalPrice.toLocaleString('en-IN')}`;

      doc.text(`${index + 1}`, startX, rowY);
      doc.text(productName, startX + columnWidths[0], rowY, { width: columnWidths[1] - 10 });
      doc.text(item.quantity.toString(), startX + columnWidths[0] + columnWidths[1], rowY);
      doc.text(price, startX + columnWidths[0] + columnWidths[1] + columnWidths[2], rowY);
      doc.text(total, startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], rowY);

      // Optional: draw row line
      doc.moveTo(startX, rowY + 15)
        .lineTo(startX + columnWidths.reduce((a, b) => a + b), rowY + 15)
        .strokeColor('#cccccc')
        .stroke();

      rowY += 20;
    });

    // Totals
    doc.moveDown(2);
    doc.fontSize(13);
    doc.text(`Total Price: ₹${invoice.totalPrice.toLocaleString('en-IN')}`, { align: 'right' });
    doc.text(`Total Tax: ₹${invoice.totalTax.toLocaleString('en-IN')}`, { align: 'right' });

    doc.end();
  });
};
