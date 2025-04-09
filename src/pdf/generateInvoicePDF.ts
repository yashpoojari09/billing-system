import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
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
  const templatePath = path.join(__dirname, 'invoice-template.hbs');
  const htmlContent = await fs.readFile(templatePath, 'utf8');
  const template = handlebars.compile(htmlContent);

  const data = {
    invoice: {
      ...invoice,
      date: new Date(invoice.createdAt).toLocaleDateString(),
      deliveryDate: invoice.deliveryDate
        ? new Date(invoice.deliveryDate).toLocaleDateString()
        : null,
      cgst: (invoice.totalTax / 2).toFixed(2),
      sgst: (invoice.totalTax / 2).toFixed(2),
      amountInWords: toWords(invoice.totalPrice),
    },
    settings,
  };

  const compiledHtml = template(data);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(compiledHtml, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' },
  });

  await browser.close();
  return Buffer.from(pdf);
};
