import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/error";

const prisma = new PrismaClient();

// CREATE Tax Rule (Admin & Superadmin)
export const createTaxRule = async (req: Request, res: Response, next: NextFunction) => {
   
  try {
    if (!req.user) {
      next(new AppError("Unauthorized - User not allowed", 401));
      return;
    }
    const { taxRate, region } = req.body;
    // 🔹 Ensure required fields are provided
    if (!taxRate || !region) {
      return next(new AppError("Tax rate and region are required", 400));
    }
 // Validate Tenant using middleware
 const {id:tenantId} = (req as any).tenant;
  // 🔹 Ensure tenantId is available
  if (!tenantId) {
    return next(new AppError("Tenant ID is required", 400));
  }

    const tax = await prisma.taxation.create({ data: { taxRate: taxRate/100, region, tenantId } });

    res.status(201).json(tax);
  } catch (error) {
    next(error);
  }
};

// READ Tax Rules (Admin & Manager)
export const getTaxRules = async (req: Request, res: Response, next: NextFunction ) => {
  
  try {
    if (!req.user) {
      next(new AppError("Unauthorized - User not allowed", 401));
      return;
    }
 // Validate Tenant using middleware
 const {id:tenantId} = (req as any).tenant;
 
 const taxes = await prisma.taxation.findMany({ where: { tenantId } });

    res.json(taxes);
  } catch (error) {
    next(error);
  }
};

// ✅ Update Tax Rule
export const updateTaxRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: tenantId } = (req as any).tenant;
    const { taxId } = req.params;
    const { taxRate, region } = req.body;

    if (!taxRate || !region) {
      return next(new AppError("Tax rate and region are required for update", 400));
    }

    const tax = await prisma.taxation.updateMany({
      where: { id: taxId, tenantId }, // Ensures tax rule belongs to the correct tenant
      data: { taxRate, region },
    });

    if (tax.count === 0) {
      return next(new AppError("Tax rule not found or you don't have permission", 404));
    }

    res.status(200).json({ message: "Tax rule updated successfully" });
  } catch (error) {
    next(error);
  }
};

// DELETE Tax Rule (Superadmin)
export const deleteTaxRule = async (req: Request, res: Response, next:NextFunction) => {
  try {
     // Validate Tenant using middleware
    const {id:tenantId} = (req as any).tenant;
    const { taxId } = req.params;
   // 🔹 Ensure taxId is provided
   if (!taxId) {
    return next(new AppError("Tax ID is required", 400));
  }
      // ✅ Check if the taxation entry exists under the correct tenant
      const taxEntry = await prisma.taxation.findFirst({
        where: { id: taxId, tenantId },
      });
      if (!taxEntry) {
        return next(new AppError("Tax entry not found under this tenant", 404));
      }
  
      // ✅ Delete the taxation entry
      await prisma.taxation.delete({
        where: { id: taxId, tenantId },
      });

    res.json({ message: "Tax rule deleted successfully" });
  } catch (error) {
    next(error);
    
  }
};
