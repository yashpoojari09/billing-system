import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { AppError } from "./error";
import passport from "../config/passport";

const prisma = new PrismaClient();

// Middleware to protect routes
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("jwt", { session: false }, (err: Error | null, user: any) => {
    if (err || !user) {
      logger.warn(`Unauthorized access attempt from IP: ${req.ip}`);
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    logger.info(`User ${user.email} authenticated successfully`);
    return next();
  })(req, res, next);
};

// Middleware to validate tenant

export const validateTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId } = req.params; // Tenant ID from URL params
    if (!tenantId) {
      return next(new AppError("Tenant ID is required in the URL", 400));
  }

  // Validate if tenant ID is in correct format (UUID)
  const uuidRegex = /^[0-9a-fA-F-]{36}$/;
  if (!uuidRegex.test(tenantId)) {
      return next(new AppError("Invalid Tenant ID format", 400));
  }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id:tenantId },
    });
   

    if (!tenant) {
      res.status(404).json({ message: "Tenant not found" });
      return;
    }

    // Attach tenant data to request for further use
    (req as any).tenant = tenant;
    next();
  } catch (error) {
    console.error("Error validating tenant:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
