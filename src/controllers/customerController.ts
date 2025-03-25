import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/error";


const prisma = new PrismaClient();



// CREATE Customer (Only Admin & Superadmin)
export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next (new AppError("Unauthorized - User not available", 401));
   }
   const { name, email } = req.body;

    // ✅ Get tenant data from the request (set by validateTenant middleware)
    const {id:tenantId}= (req as any).tenant;

    if (!name || !email) {
      return next(new AppError("Name and email are required", 400));
    }

    // ✅ Create customer linked to the tenant
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        tenantId,
      },
    });

   res.status(201).json(customer);
 } catch (error) {
   next(error);
 }
};

// READ Customers under Tenant (Only Admin & Manager)
export const getCustomers = async (req: Request, res: Response, next: NextFunction ): Promise<void> => {
    if (!req.user) {
        return next(new AppError("Unauthorized", 401));
       
    }
  
    try {
    

    // ✅ Get tenant data from the request (set by validateTenant middleware)
    const {id:tenantId}= (req as any).tenant;
    
      const customers = await prisma.customer.findMany({
        where: { tenantId },
      });
  
      res.json(customers);
      return;
    } catch (error) {
      next(error
      );
    }
  };
  

  // DELETE Customer Under Tenant (Only Superadmin)
  export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Request Params:", req.params); // 🔹 Debugging Step

    // ✅ Get tenant data from the request (set by validateTenant middleware)
    const {id:tenantId}= (req as any).tenant;
    const { customerId } = req.params; // ✅ Extract both parameters

        // 🔹 Ensure customerId is defined
    if (!customerId) {
      return next(new AppError("Customer ID is required", 400));
    }

    // 🔹 Ensure tenantId is defined
    if (!tenantId) {
      return next(new AppError("Tenant ID is required", 400));
    }

    // Check if the customer exists under the correct tenant
    const customer = await prisma.customer.findFirst({
      where: { id:customerId, tenantId }, // ✅ Ensures customer belongs to the correct tenant
    });

    if (!customer) {
      return next(new AppError("Customer not found under this tenant", 404));
    }

    // Delete the customer
    await prisma.customer.delete({ where: {id:customerId, tenantId} });
  
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      next(error
      );
    }
  };