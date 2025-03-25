import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

// ✅ Extend the Request interface to include user object properly
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      role: Role;
      tenantId: string
    };
  }
}

// ✅ Middleware to check user role
export const authorizeRoles = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized- User not available" });
      return; // 🔹 Ensure execution stops
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: Access denied" });
      return; // 🔹 Ensure execution stops
    }

    next(); // ✅ If user is authorized, continue execution
  };
};
