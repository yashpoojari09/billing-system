import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/error";


const prisma = new PrismaClient();

// CREATE Inventory Item (Only Admin & Superadmin)
export const createInventoryItem = async (req: Request, res: Response, next:NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Unauthorized - User not allowed", 401));
    }

    // Validate Tenant using middleware

    // ✅ Get tenant data from the request (set by validateTenant middleware)
    const {id:tenantId}= (req as any).tenant;
        if (!tenantId) {
        return next(new AppError("Tenant validation failed", 400));
    }

    const { name, stock, price, taxId} = req.body; // Fields for new inventory item

    // Optional but recommended: validate taxId belongs to the same tenant
if (taxId) {
  const tax = await prisma.taxation.findUnique({
    where: { id: taxId },
  });

  if (!tax || tax.tenantId !== tenantId) {
    return next(new AppError("Invalid tax ID or tax does not belong to tenant", 400));
  }
}

    // Create inventory item linked to the tenant
    const newItem = await prisma.inventory.create({
        data: {
            name,
            stock,
            price,
            tenantId: tenantId, // Ensure it's linked to the correct tenant
            taxId,
        },
    });

    res.status(201).json(newItem);
} catch (error) {
    console.error("Error creating inventory:", error);
    return next(new AppError("Server error while creating inventory", 500));
}
};

// GET All Inventory (Admin & Manager)
export const getInventory = async (req: Request, res: Response, next:NextFunction) => {
    if (!req.user) {
        return next(new AppError("Unauthorized - User not allowed", 401));
    }
  try {

    // ✅ Get tenant data from the request (set by validateTenant middleware)
    const     tenant =(req as any).tenant


     if (!tenant) {
         return next(new AppError("Tenant validation failed", 400));
     }

     // Fetch inventory only for the specific tenant
     const items = await prisma.inventory.findMany({
         where: { tenantId: tenant.id},
         include: {
          tax: true, // includes taxRate and region
        },
     });


    res.json(items);
  } catch (error) {
    next(error);
  }
};

// UPDATE Inventory Item (Admin & Superadmin)
export const updateInventoryItem = async (req: Request, res: Response, next:NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError("Unauthorized - User not allowed", 401));
  }
  // Validate Tenant using middleware
  const tenant = (req as any).tenant;
  if (!tenant) {
      return next(new AppError("Tenant validation failed", 400));
  }

  const { inventoryId } = req.params; // Get inventory item ID from params
  const { name, stock, price, taxId } = req.body; // Fields to update

  // Check if inventory item exists and belongs to the correct tenant
  const existingItem = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { tax: true }, // Include tax information

  });

  if (!existingItem) {
      return next(new AppError("Inventory item not found", 404));
  }

  if (existingItem.tenantId !== tenant.id) {
      return next(new AppError("Forbidden - Inventory item does not belong to this tenant", 403));
  }

   // Update inventory item
   const updatedItem = await prisma.inventory.update({
    where: { id: inventoryId },
    data: { name, stock, price, taxId },
});

    res.json(updatedItem);
  } catch (error) {
    next(error
    );
  }
};

// DELETE Inventory Item (Only Superadmin)
export const deleteInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError("Unauthorized - User not allowed", 401));
  }

  // Validate Tenant using middleware
  const tenant = (req as any).tenant;
  if (!tenant) {
      return next(new AppError("Tenant validation failed", 400));
  }

  const { inventoryId } = req.params; // Get inventory item ID from params

  // Check if inventory item exists and belongs to the correct tenant
  const existingItem = await prisma.inventory.findUnique({
      where: { id: inventoryId },
  });

  if (!existingItem) {
      return next(new AppError("Inventory item not found", 404));
  }

  if (existingItem.tenantId !== tenant.id) {
      return next(new AppError("Forbidden - Inventory item does not belong to this tenant", 403));
  }

  // Delete inventory item
  await prisma.inventory.delete({
      where: { id: inventoryId },
  });

  res.json({ message: "Inventory item deleted successfully" });
} catch (error) {
  console.error("Error deleting inventory:", error);
  return next(new AppError("Server error while deleting inventory", 500));
}
};