import puppeteer from "puppeteer";
import path from "path";

export const generateInvoicePDF = async (invoice: any) => {
  const fileName = `receipt-${invoice.receiptNumber}.pdf`;
  const filePath = path.resolve(__dirname, `../public/receipts/${fileName}`);

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
          ${invoice.items.map((item: any) => `
            <li>${item.quantity} x ${item.productId} @ $${item.price.toFixed(2)}</li>
          `).join('')}
        </ul>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  await page.pdf({ path: filePath, format: "A4" });
  await browser.close();

  return `/receipts/${fileName}`; // Public-facing path
};
