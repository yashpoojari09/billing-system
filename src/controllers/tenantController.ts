import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/error";

// import { generateInvoicePDF } from "src/utils/generateInvoicePDF";


const prisma = new PrismaClient();

// CREATE Tenant (Only Superadmin)
export const createTenant = async (req: Request, res: Response, next:NextFunction): Promise<void>  => {
  try {
    const { name, category} = req.body;
    if (!name || !category) {
      return next(new AppError("Name and category are required", 400));
    }
    const existingTenant = await prisma.tenant.findUnique({ where: { name } });
    if (existingTenant) {
      return next(new AppError("Tenant with this name already exists", 400));
    }

    const tenant = await prisma.tenant.create({
      data: { name, category},
    });

    res.status(201).json(tenant);
  } catch (error) {
    next(error);
  }
};

// GET All Tenants (Superadmin Only)
export const getAllTenants = async (_req: Request, res: Response, next:NextFunction): Promise<void> => {
  try {
    const tenants = await prisma.tenant.findMany();
    res.json(tenants);
  } catch (error) {
    next(error);
  }
};

// GET Tenant By ID (Admin & Superadmin)
export const getTenantById = async (req: Request, res: Response, next: NextFunction): Promise<void>  => {
  try {
    const { id:tenantId } = (req as any).tenant
    const tenant = await prisma.tenant.findUnique({ where: { id:tenantId } });

    if (!tenantId) {
      return next(new AppError("Tenant not found", 404));}

    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

// UPDATE Tenant (Admin & Superadmin)
export const updateTenant = async (req: Request, res: Response, next: NextFunction): Promise<void>  => {
  try {
    const { id:tenantId } = (req as any).tenant
    const { name, category } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id:tenantId },
      data: { name, category},
    });

    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

// DELETE Tenant (Only Superadmin)
export const deleteTenant = async (req: Request, res: Response, next: NextFunction): Promise<void>  => {
  try {
    const { id:tenantId } = (req as any).tenant

    await prisma.tenant.delete({ where: { id:tenantId } });

    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    next(error
    );
  }
};

// Tenant

/**
 * @route POST /api/customers/invoice
 * @desc Create a invoice for a customer with multiple products
 */
import nodemailer from 'nodemailer';

import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email (e.g., Gmail)
    pass: process.env.EMAIL_PASS, // Your email password or App Password
  },
});


export const createInvoice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, phone, products } = req.body;

    

    if (!name || !email || !phone || !products || products.length === 0) {
      return res.status(400).json({ error: "All fields are required, including products." });
    }

     // ✅ Get tenant data from the request (set by validateTenant middleware)
     const {id:tenantId}= (req as any).tenant;

     if (!tenantId) {
      console.error("❌ tenantId missing in request");
      return res.status(400).json({ error: "Invalid tenant" });
    }
    // Check if the customer exists, else create a new customer
    let customer = await prisma.customer.findFirst({
      where: { email, tenantId },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          email,
          phone,
          tenantId,
        },
      });
    }

    let totalBase = 0;
    let totalTax = 0;
    let totalPrice = 0;

    let invoiceItems = [];

    for (const product of products) {
      const { productId, quantity } = product;

      // Check if product exists in inventory
      const inventoryItem = await prisma.inventory.findUnique({
        where: { id: productId },
                include: { tax: true },

      });
      if (!inventoryItem) {
        return res.status(404).json({ error: `Product with ID ${productId} not found.` });
      }

      console.log("✅ Found tax:", inventoryItem.tax);


     
      if (inventoryItem.stock < quantity) {
        return res.status(400).json({ error: `Not enough stock for ${inventoryItem.name}.` });
      }

      const taxRate = inventoryItem.tax?.taxRate || 0;
      const price = inventoryItem.price;
      const baseTotal = price * quantity;
      const taxAmount = baseTotal * taxRate;
      const itemTotalPrice = baseTotal + taxAmount;
      totalPrice += itemTotalPrice;

      if (inventoryItem.price == null) {
        console.error("❌ Missing price for inventory item:", inventoryItem.id);
        return res.status(500).json({ error: "Product has no price in inventory." });
      }
    
      totalBase += baseTotal;
      totalTax += taxAmount;
  
      invoiceItems.push({
        productId,
        quantity,
        price,
        totalPrice: itemTotalPrice,
        taxRate,
        taxAmount,
      });

      // Update inventory stock
      await prisma.inventory.update({
        where: { id: productId },
        data: { stock: { decrement: quantity }, updatedAt: new Date() },
      });
    }
    const receiptNumber = `INV-${Date.now()}`; // or use something like `RCPT-${uuidv4()}`


    // Create invoice record
    const newInvoice = await prisma.invoice.create({
      data: {
        customerId: customer.id,
        tenantId,
        totalPrice,
        totalTax,
        receiptNumber,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      res.status(404).send('Tenant settings not found.');
      return;
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(newInvoice, settings);

    await transporter.sendMail({
      from: `"${settings.businessName}" <${process.env.EMAIL_USER}>`,
      to: newInvoice.customer.email,
      subject: `Invoice ${newInvoice.receiptNumber} from ${settings.businessName}`,
      html: `
        <p>Hi ${newInvoice.customer.name},</p>
        <p>Thank you for your business. Please find your invoice attached.</p>
        <p>Regards,<br>${settings.businessName}</p>
      `,
      attachments: [
        {
          filename: `${newInvoice.receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    return res.status(201).json({
      message: "invoice created successfully!",
      invoice: newInvoice,
      invoiceId: newInvoice.id,
      receiptNumber: newInvoice.receiptNumber,
      receiptUrl: `/receipt/${newInvoice.receiptNumber}`,
    });

  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

import { generateInvoicePDF } from "../pdf/generateInvoicePDF";

export const recieptRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, receiptNumber } = { 
      ...req.params, 
      ...req.query 
    };

    const invoice = await prisma.invoice.findFirst({
      where: { tenantId: tenantId as string, receiptNumber: receiptNumber as string },
      include: {
        items:{
          include: {
            product: true, // 👈 include product relation
          },
        },
        customer: true,
      },
    });
    console.log("🔎 Comparing with tenantId:", tenantId, "and receiptNumber:", receiptNumber);

    if (!invoice) {
       res.status(404).send('Invoice not found.');
       return;
    }

    // 2. Fetch tenant settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenantId as string },
    });

    if (!settings) {
      res.status(404).send('Tenant settings not found.');
      return;
    }

    const pdfBuffer = await generateInvoicePDF(invoice, settings);


  

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${receiptNumber}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).send('Error generating PDF');
  }
};

// controllers/invoiceController.ts
export const listInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: tenantId } = (req as any).tenant;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const offset = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
      where: { tenantId },
      skip: offset,
      take: limit,
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    }),      prisma.invoice.count({ where: { tenantId } }),
    ]);

    const formatted = invoices.map((invoice) => ({
      id: invoice.id,
      receiptNumber: invoice.receiptNumber,
      customerName: invoice.customer.name,
      amount: invoice.totalPrice.toFixed(2),
      date: invoice.createdAt.toISOString().split('T')[0],
      downloadUrl: `/receipt/${invoice.receiptNumber}?tenantId=${tenantId}`, // 🔗 Add query param for tenantId
    }));

    res.json({invoices:formatted, total});
  } catch (error) {
    console.error('Error listing invoices:', error);
    res.status(500).json({ error: 'Failed to list invoices' });
  }
};


///Invoice Preview
export const previewInvoice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, phone, products } = req.body;

    if (!name || !email || !phone || !products || products.length === 0) {
      return res.status(400).json({ error: "All fields are required, including products." });
    }

    // Get tenant data from the request (set by validateTenant middleware)
    const { id: tenantId } = (req as any).tenant;

    // We'll simulate invoice calculation here (without updating inventory)
    let totalPrice = 0;
    let totalTax = 0;
    let invoiceItems = [];

    for (const product of products) {
      const { productId, quantity } = product;

      // Fetch product from inventory
      const inventoryItem = await prisma.inventory.findUnique({
        where: { id: productId },
        // Removed 'tax' as it does not exist in the Inventory model
        include: {},

      });

      if (!inventoryItem) {
        return res.status(404).json({ error: `Product with ID ${productId} not found.` });
      }

      if (inventoryItem.stock < quantity) {
        return res.status(400).json({ error: `Not enough stock for ${inventoryItem.name}.` });
      }

      // Calculate product total price and tax
      const productTotalPrice = inventoryItem.price * quantity;
      const taxInfo = await prisma.taxation.findFirst({ where: { tenantId } });
      const taxRate = taxInfo ? taxInfo.taxRate : 0;
      const productTax = (taxRate / 100) * productTotalPrice;

      totalPrice += productTotalPrice;
      totalTax += productTax;

      invoiceItems.push({
        productId,
        productName: inventoryItem.name,
        quantity,
        price: inventoryItem.price,
        totalPrice: productTotalPrice,
      });
    }

    // Generate a preview invoice number (for display only)
    const invoiceNumber = `PREVIEW-${Date.now()}`;

    // Build preview invoice object
    const invoicePreview = {
      invoiceNumber,
      createdAt: new Date(), // current date/time
      customer: { name, email, phone },
      items: invoiceItems,
      totalPrice,
      totalTax,
      grandTotal: totalPrice + totalTax,
    };

    return res.status(200).json({ invoicePreview });
  } catch (error) {
    console.error("Error previewing invoice:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Tenant settings controller


export const getTenantSettings = async (req: Request, res: Response) => {
  try {
    const { id:tenantId } = (req as any).tenant
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tenant settings' });
  }
};

export const updateTenantSettings = async (req: Request, res: Response):Promise<void> => {
  const { businessName, address, gstin, phone, invoiceTemplate} = req.body;
  const { tenantId } = req.params;
  console.log("🔧 Body:", req.body);
console.log("🔧 Params:", req.params);

  if (!tenantId) {
     res.status(400).json({ error: "Missing tenantId in URL" });
     return;
  }


  try {

    const updated = await prisma.tenantSettings.upsert({
      where: { tenantId},
      create: {
        tenantId,
        businessName,
        address,
        gstin,
        phone,
        invoiceTemplate
      
      },
      update: {
        businessName,
        address,
        gstin,
        phone,
        invoiceTemplate
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error updating tenant settings' });
  }
};
