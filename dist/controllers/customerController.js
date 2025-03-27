"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.getCustomers = exports.createCustomer = void 0;
const client_1 = require("@prisma/client");
const error_1 = require("../middlewares/error");
const prisma = new client_1.PrismaClient();
// CREATE Customer (Only Admin & Superadmin)
const createCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new error_1.AppError("Unauthorized - User not available", 401));
        }
        const { name, email } = req.body;
        // ✅ Get tenant data from the request (set by validateTenant middleware)
        const { id: tenantId } = req.tenant;
        if (!name || !email) {
            return next(new error_1.AppError("Name and email are required", 400));
        }
        // ✅ Create customer linked to the tenant
        const customer = yield prisma.customer.create({
            data: {
                name,
                email,
                tenantId,
            },
        });
        res.status(201).json(customer);
    }
    catch (error) {
        next(error);
    }
});
exports.createCustomer = createCustomer;
// READ Customers under Tenant (Only Admin & Manager)
const getCustomers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return next(new error_1.AppError("Unauthorized", 401));
    }
    try {
        // ✅ Get tenant data from the request (set by validateTenant middleware)
        const { id: tenantId } = req.tenant;
        const customers = yield prisma.customer.findMany({
            where: { tenantId },
        });
        res.json(customers);
        return;
    }
    catch (error) {
        next(error);
    }
});
exports.getCustomers = getCustomers;
// DELETE Customer Under Tenant (Only Superadmin)
const deleteCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Request Params:", req.params); // 🔹 Debugging Step
        // ✅ Get tenant data from the request (set by validateTenant middleware)
        const { id: tenantId } = req.tenant;
        const { customerId } = req.params; // ✅ Extract both parameters
        // 🔹 Ensure customerId is defined
        if (!customerId) {
            return next(new error_1.AppError("Customer ID is required", 400));
        }
        // 🔹 Ensure tenantId is defined
        if (!tenantId) {
            return next(new error_1.AppError("Tenant ID is required", 400));
        }
        // Check if the customer exists under the correct tenant
        const customer = yield prisma.customer.findFirst({
            where: { id: customerId, tenantId }, // ✅ Ensures customer belongs to the correct tenant
        });
        if (!customer) {
            return next(new error_1.AppError("Customer not found under this tenant", 404));
        }
        // Delete the customer
        yield prisma.customer.delete({ where: { id: customerId, tenantId } });
        res.json({ message: "Customer deleted successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteCustomer = deleteCustomer;
//# sourceMappingURL=customerController.js.map