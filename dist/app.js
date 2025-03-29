"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
require("./middlewares/auth"); // Initialize passport strategy
// import customerRoutes from "./routes/customers";
const tenants_1 = __importDefault(require("./routes/tenants"));
const error_1 = require("./middlewares/error");
// import inventoryRoutes from "./routes/inventory";
// import taxationRoutes from "./routes/taxation";
const logger_1 = __importDefault(require("./utils/logger"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(passport_1.default.initialize());
app.use((0, cookie_parser_1.default)()); // ✅ Enables cookie parsing
// Global Error Handler
app.use(error_1.errorHandler);
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/tenants", tenants_1.default);
// app.use("/api/customers", customerRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/taxation", taxationRoutes);
logger_1.default.info("Server is Starting...");
// Health check route
app.get("/", (_req, res) => {
    res.send({ message: "Multi-Tenant Billing API is running" });
});
// Example logging route
app.get("/test-log", (_req, res) => {
    logger_1.default.info("📢 Test log from Vercel");
    res.send({ message: "Log sent to Logtail" });
});
app.get("/test-env", (_req, res) => {
    res.json({ TEST_SERVER_BILLING: process.env.TEST_SERVER_BILLING });
});
exports.default = app;
//# sourceMappingURL=app.js.map