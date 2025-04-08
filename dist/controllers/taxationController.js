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
exports.deleteTaxRule = exports.updateTaxRule = exports.getTaxRules = exports.createTaxRule = void 0;
const client_1 = require("@prisma/client");
const error_1 = require("../middlewares/error");
const prisma = new client_1.PrismaClient();
// CREATE Tax Rule (Admin & Superadmin)
const createTaxRule = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            next(new error_1.AppError("Unauthorized - User not allowed", 401));
            return;
        }
        const { taxRate, region } = req.body;
        // 🔹 Ensure required fields are provided
        if (!taxRate || !region) {
            return next(new error_1.AppError("Tax rate and region are required", 400));
        }
        // Validate Tenant using middleware
        const { id: tenantId } = req.tenant;
        // 🔹 Ensure tenantId is available
        if (!tenantId) {
            return next(new error_1.AppError("Tenant ID is required", 400));
        }
        const tax = yield prisma.taxation.create({ data: { taxRate: taxRate / 100, region, tenantId } });
        res.status(201).json(tax);
    }
    catch (error) {
        next(error);
    }
});
exports.createTaxRule = createTaxRule;
// READ Tax Rules (Admin & Manager)
const getTaxRules = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            next(new error_1.AppError("Unauthorized - User not allowed", 401));
            return;
        }
        // Validate Tenant using middleware
        const { id: tenantId } = req.tenant;
        const taxes = yield prisma.taxation.findMany({ where: { tenantId } });
        res.json(taxes);
    }
    catch (error) {
        next(error);
    }
});
exports.getTaxRules = getTaxRules;
// ✅ Update Tax Rule
const updateTaxRule = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: tenantId } = req.tenant;
        const { taxId } = req.params;
        const { taxRate, region } = req.body;
        if (!taxRate || !region) {
            return next(new error_1.AppError("Tax rate and region are required for update", 400));
        }
        const tax = yield prisma.taxation.updateMany({
            where: { id: taxId, tenantId }, // Ensures tax rule belongs to the correct tenant
            data: { taxRate: taxRate / 100, region },
        });
        if (tax.count === 0) {
            return next(new error_1.AppError("Tax rule not found or you don't have permission", 404));
        }
        res.status(200).json({ message: "Tax rule updated successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTaxRule = updateTaxRule;
// DELETE Tax Rule (Superadmin)
const deleteTaxRule = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate Tenant using middleware
        const { id: tenantId } = req.tenant;
        const { taxId } = req.params;
        // 🔹 Ensure taxId is provided
        if (!taxId) {
            return next(new error_1.AppError("Tax ID is required", 400));
        }
        // ✅ Check if the taxation entry exists under the correct tenant
        const taxEntry = yield prisma.taxation.findFirst({
            where: { id: taxId, tenantId },
        });
        if (!taxEntry) {
            return next(new error_1.AppError("Tax entry not found under this tenant", 404));
        }
        // ✅ Delete the taxation entry
        yield prisma.taxation.delete({
            where: { id: taxId, tenantId },
        });
        res.json({ message: "Tax rule deleted successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTaxRule = deleteTaxRule;
//# sourceMappingURL=taxationController.js.map