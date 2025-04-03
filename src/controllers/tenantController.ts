import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/error";


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

export const createInvoice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, phone, products } = req.body;

    

    if (!name || !email || !phone || !products || products.length === 0) {
      return res.status(400).json({ error: "All fields are required, including products." });
    }

     // ✅ Get tenant data from the request (set by validateTenant middleware)
     const {id:tenantId}= (req as any).tenant;

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

    let totalPrice = 0;
    let totalTax = 0;
    let invoiceItems = [];

    for (const product of products) {
      const { productId, quantity } = product;

      // Check if product exists in inventory
      const inventoryItem = await prisma.inventory.findUnique({
        where: { id: productId },
      });

      if (!inventoryItem) {
        return res.status(404).json({ error: `Product with ID ${productId} not found.` });
      }

      if (inventoryItem.stock < quantity) {
        return res.status(400).json({ error: `Not enough stock for ${inventoryItem.name}.` });
      }

      // Calculate product total price and tax
      const productTotalPrice = inventoryItem.price * quantity;

      // Fetch applicable tax rate for this tenant
      const taxInfo = await prisma.taxation.findFirst({
        where: { tenantId },
      });
      const taxRate = taxInfo ? taxInfo.taxRate : 0;
      const productTax = (taxRate / 100) * productTotalPrice;

      totalPrice += productTotalPrice;
      totalTax += productTax;

      // Add invoice item
      invoiceItems.push({
        productId,
        quantity,
        price: inventoryItem.price,
        totalPrice: productTotalPrice,
      });

      // Update inventory stock
      await prisma.inventory.update({
        where: { id: productId },
        data: { stock: { decrement: quantity }, updatedAt: new Date() },
      });
    }

    // Create invoice record
    const newInvoice = await prisma.invoice.create({
      data: {
        customerId: customer.id,
        tenantId,
        totalPrice,
        totalTax,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json({
      message: "invoice created successfully!",
      invoice: newInvoice,
    });

  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
