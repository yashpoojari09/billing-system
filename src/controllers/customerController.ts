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
   const { name, email, phone} = req.body;
   if (!name || !email || !phone) {
    return next(new AppError("Name and email are required", 400));
  }


    // ✅ Get tenant data from the request (set by validateTenant middleware)
    const {id:tenantId}= (req as any).tenant;

   
    // ✅ Create customer linked to the tenant
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
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

  // GET Customer by ID (Only Admin & Manager)
  export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError("Unauthorized", 401));
      }

      // Validate Tenant using middleware
      const tenant = (req as any).tenant;
      if (!tenant) {
        return next(new AppError("Tenant validation failed", 400));
      }

      const { customerId } = req.params; // Get Customer ID from params

      // Check if customer exists and belongs to the correct tenant
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId: tenant.id },
      });

      if (!customer) {
        return next(new AppError("Customer not found under this tenant", 404));
      }

      res.json(customer);
    } catch (error) {
      next(error);
    }
  };

  // UPDATE customer Item (Admin & Superadmin)
  export const updateCustomer = async (req: Request, res: Response, next:NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Unauthorized - User not allowed", 401));
    }
    // Validate Tenant using middleware
    const tenant = (req as any).tenant;
    if (!tenant) {
        return next(new AppError("Tenant validation failed", 400));
    }
  
    const { customerId } = req.params; // Get Cutomer ID from params
    const { name, email, phone} = req.body; // Fields to update
  
    // Check if customer item exists and belongs to the correct tenant
    const existingCustomer= await prisma.customer.findUnique({
        where: { id: customerId },
    });
  
    if (!existingCustomer) {
        return next(new AppError("customer item not found", 404));
    }
  
    if (existingCustomer.tenantId !== tenant.id) {
        return next(new AppError("Forbidden - customer item does not belong to this tenant", 403));
    }
  
     // Update customer item
     const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: { name, email, phone },
  });
  
      res.json(updatedCustomer);
    } catch (error) {
      next(error
      );
    }
  };


  export const emailHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: tenantId } = (req as any).tenant; // Extract tenant from middleware
        const { email } = req.query;

        if (typeof email !== "string" || !email.trim()) {
            res.status(400).json({ message: "A valid email query parameter is required." });
            return;
        }

        console.log("🔹 Searching for customer:");
        console.log("➡️ Tenant ID:", tenantId);
        console.log("➡️ Email:", email.trim().toLowerCase());

        const customers = await prisma.customer.findMany({
            where: {
                tenantId,
                email: {
                    equals: email.trim().toLowerCase(),
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
        });

        if (customers.length === 0) {
            console.error(`❌ Customer not found for email: ${email} under tenant: ${tenantId}`);
            res.status(404).json({ error: "Customer not found under this tenant." });
            return;
        }

        console.log("✅ Customer found:", customers);
        res.status(200).json(customers);
    } catch (error: any) {
        console.error("🚨 Error fetching customer:", error.message);
        res.status(500).json({ error: "Internal Server Error." });
    }
};