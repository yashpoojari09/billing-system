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
exports.updateCustomer = exports.getCustomerById = exports.deleteCustomer = exports.getCustomers = exports.createCustomer = void 0;
const client_1 = require("@prisma/client");
const error_1 = require("../middlewares/error");
const prisma = new client_1.PrismaClient();
// CREATE Customer (Only Admin & Superadmin)
const createCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new error_1.AppError("Unauthorized - User not available", 401));
        }
        const { name, email, phone } = req.body;
        if (!name || !email || !phone) {
            return next(new error_1.AppError("Name and email are required", 400));
        }
        // ✅ Get tenant data from the request (set by validateTenant middleware)
        const { id: tenantId } = req.tenant;
        // ✅ Create customer linked to the tenant
        const customer = yield prisma.customer.create({
            data: {
                name,
                email,
                phone,
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
const getCustomers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return next(new error_1.AppError("Unauthorized", 401));
    }
    try {
        const { id: tenantId } = req.tenant;
        const { search } = req.query;
        if (search && typeof search === "string" && search.trim()) {
            console.log("🔍 Searching for customers by:", search.trim().toLowerCase());
            const customers = yield prisma.customer.findMany({
                where: {
                    tenantId,
                    OR: [
                        { name: { contains: search.trim(), mode: "insensitive" } },
                        { email: { contains: search.trim(), mode: "insensitive" } },
                        { phone: { contains: search.trim(), mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                }
            });
            if (!customers.length) {
                return next(new error_1.AppError("No customers found with this search term", 404));
            }
            res.status(200).json(customers);
            return;
        }
        console.log("📋 Fetching all customers under tenant:", tenantId);
        const customers = yield prisma.customer.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
        });
        res.status(200).json(customers);
    }
    catch (error) {
        console.error("❌ Error in getCustomers:", error);
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
// GET Customer by ID (Only Admin & Manager)
const getCustomerById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new error_1.AppError("Unauthorized", 401));
        }
        // Validate Tenant using middleware
        const tenant = req.tenant;
        if (!tenant) {
            return next(new error_1.AppError("Tenant validation failed", 400));
        }
        const { customerId } = req.params; // Get Customer ID from params
        // Check if customer exists and belongs to the correct tenant
        const customer = yield prisma.customer.findFirst({
            where: { id: customerId, tenantId: tenant.id },
        });
        if (!customer) {
            return next(new error_1.AppError("Customer not found under this tenant", 404));
        }
        res.json(customer);
    }
    catch (error) {
        next(error);
    }
});
exports.getCustomerById = getCustomerById;
// UPDATE customer Item (Admin & Superadmin)
const updateCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return next(new error_1.AppError("Unauthorized - User not allowed", 401));
        }
        // Validate Tenant using middleware
        const tenant = req.tenant;
        if (!tenant) {
            return next(new error_1.AppError("Tenant validation failed", 400));
        }
        const { customerId } = req.params; // Get Cutomer ID from params
        const { name, email, phone } = req.body; // Fields to update
        // Check if customer item exists and belongs to the correct tenant
        const existingCustomer = yield prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!existingCustomer) {
            return next(new error_1.AppError("customer item not found", 404));
        }
        if (existingCustomer.tenantId !== tenant.id) {
            return next(new error_1.AppError("Forbidden - customer item does not belong to this tenant", 403));
        }
        // Update customer item
        const updatedCustomer = yield prisma.customer.update({
            where: { id: customerId },
            data: { name, email, phone },
        });
        res.json(updatedCustomer);
    }
    catch (error) {
        next(error);
    }
});
exports.updateCustomer = updateCustomer;
//# sourceMappingURL=customerController.js.map