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
exports.previewInvoice = exports.createInvoice = exports.deleteTenant = exports.updateTenant = exports.getTenantById = exports.getAllTenants = exports.createTenant = void 0;
const client_1 = require("@prisma/client");
const error_1 = require("../middlewares/error");
const generateInvoicePDF_1 = require("src/utils/generateInvoicePDF");
const prisma = new client_1.PrismaClient();
// CREATE Tenant (Only Superadmin)
const createTenant = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category } = req.body;
        if (!name || !category) {
            return next(new error_1.AppError("Name and category are required", 400));
        }
        const existingTenant = yield prisma.tenant.findUnique({ where: { name } });
        if (existingTenant) {
            return next(new error_1.AppError("Tenant with this name already exists", 400));
        }
        const tenant = yield prisma.tenant.create({
            data: { name, category },
        });
        res.status(201).json(tenant);
    }
    catch (error) {
        next(error);
    }
});
exports.createTenant = createTenant;
// GET All Tenants (Superadmin Only)
const getAllTenants = (_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenants = yield prisma.tenant.findMany();
        res.json(tenants);
    }
    catch (error) {
        next(error);
    }
});
exports.getAllTenants = getAllTenants;
// GET Tenant By ID (Admin & Superadmin)
const getTenantById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: tenantId } = req.tenant;
        const tenant = yield prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenantId) {
            return next(new error_1.AppError("Tenant not found", 404));
        }
        res.json(tenant);
    }
    catch (error) {
        next(error);
    }
});
exports.getTenantById = getTenantById;
// UPDATE Tenant (Admin & Superadmin)
const updateTenant = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: tenantId } = req.tenant;
        const { name, category } = req.body;
        const tenant = yield prisma.tenant.update({
            where: { id: tenantId },
            data: { name, category },
        });
        res.json(tenant);
    }
    catch (error) {
        next(error);
    }
});
exports.updateTenant = updateTenant;
// DELETE Tenant (Only Superadmin)
const deleteTenant = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: tenantId } = req.tenant;
        yield prisma.tenant.delete({ where: { id: tenantId } });
        res.json({ message: "Tenant deleted successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTenant = deleteTenant;
// Tenant
/**
 * @route POST /api/customers/invoice
 * @desc Create a invoice for a customer with multiple products
 */
const createInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, phone, products } = req.body;
        if (!name || !email || !phone || !products || products.length === 0) {
            return res.status(400).json({ error: "All fields are required, including products." });
        }
        // ✅ Get tenant data from the request (set by validateTenant middleware)
        const { id: tenantId } = req.tenant;
        // Check if the customer exists, else create a new customer
        let customer = yield prisma.customer.findFirst({
            where: { email, tenantId },
        });
        if (!customer) {
            customer = yield prisma.customer.create({
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
            const inventoryItem = yield prisma.inventory.findUnique({
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
            const taxInfo = yield prisma.taxation.findFirst({
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
            yield prisma.inventory.update({
                where: { id: productId },
                data: { stock: { decrement: quantity }, updatedAt: new Date() },
            });
        }
        const receiptNumber = `INV-${Date.now()}`; // or use something like `RCPT-${uuidv4()}`
        // Create invoice record
        const newInvoice = yield prisma.invoice.create({
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
            },
        });
        // Step 2: Fetch invoice with customer details for PDF
        const invoiceWithCustomer = yield prisma.invoice.findUnique({
            where: { id: newInvoice.id },
            include: {
                customer: true,
                items: true,
            },
        });
        // Step 3: Generate PDF
        let pdfUrl = "";
        try {
            pdfUrl = yield (0, generateInvoicePDF_1.generateInvoicePDF)(invoiceWithCustomer);
        }
        catch (err) {
            console.error("PDF generation failed:", err);
        }
        return res.status(201).json({
            message: "invoice created successfully!",
            invoice: newInvoice,
            invoiceId: newInvoice.id,
            receiptNumber: newInvoice.receiptNumber,
            receiptUrl: pdfUrl,
        });
    }
    catch (error) {
        console.error("Error creating invoice:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.createInvoice = createInvoice;
///Invoice Preview
const previewInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, phone, products } = req.body;
        if (!name || !email || !phone || !products || products.length === 0) {
            return res.status(400).json({ error: "All fields are required, including products." });
        }
        // Get tenant data from the request (set by validateTenant middleware)
        const { id: tenantId } = req.tenant;
        // We'll simulate invoice calculation here (without updating inventory)
        let totalPrice = 0;
        let totalTax = 0;
        let invoiceItems = [];
        for (const product of products) {
            const { productId, quantity } = product;
            // Fetch product from inventory
            const inventoryItem = yield prisma.inventory.findUnique({
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
            const taxInfo = yield prisma.taxation.findFirst({ where: { tenantId } });
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
    }
    catch (error) {
        console.error("Error previewing invoice:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.previewInvoice = previewInvoice;
//# sourceMappingURL=tenantController.js.map