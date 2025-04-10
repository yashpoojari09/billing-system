import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import handlebars from 'handlebars';
import { toWords } from 'number-to-words';

import { Invoice as BaseInvoice, TenantSettings } from '@prisma/client';

interface Invoice extends BaseInvoice {
    deliveryDate?: Date;
}




export const generateInvoicePDF = async (
    invoice: Invoice,
    settings: TenantSettings
): Promise<Buffer> => {
    let browser;

    try {
      console.log('Generating PDF for invoice:', settings.invoiceTemplate);
      
        const template = handlebars.compile(settings.invoiceTemplate)
        const data = {
            invoice: {
                ...invoice,
                date: new Date(invoice.createdAt).toLocaleDateString(),
                deliveryDate: invoice.deliveryDate
                    ? new Date(invoice.deliveryDate).toLocaleDateString()
                    : null,
                cgst: (invoice.totalTax / 2).toFixed(2),
                sgst: (invoice.totalTax / 2).toFixed(2),
                amountInWords: toWords(invoice.totalPrice).toUpperCase() + ' ONLY',
            },
           
        };

        const compiledHtml = template(data);

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setContent(compiledHtml, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' },
        });

        return Buffer.from(pdf);
    } catch (err) {
        console.error('❌ Error generating PDF:', err);
        throw err;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
