"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
// Removed duplicate import of cors
var dotenv_1 = require("dotenv");
var passport_1 = require("passport");
var auth_routes_1 = require("./routes/auth.routes");
require("./middlewares/auth"); // Initialize passport strategy
// import customerRoutes from "./routes/customers";
var tenants_1 = require("./routes/tenants");
var error_1 = require("./middlewares/error");
// import inventoryRoutes from "./routes/inventory";
// import taxationRoutes from "./routes/taxation";
var logger_1 = require("./utils/logger");
var cookie_parser_1 = require("cookie-parser");
var cors_1 = require("cors");
dotenv_1.default.config();
var app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "https://billing-system-frontend-three.vercel.app", // ✅ Replace '*' with frontend URL
    credentials: true, // ✅ Allow credentials (cookies)
    methods: ["GET", "POST", "PUT", "DELETE"], // ✅ Allow necessary methods
    allowedHeaders: ["Content-Type", "Authorization"] // ✅ Allow headers
}));
// Middleware
app.use(express_1.default.json());
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
app.get("/", function (_req, res) {
    res.send({ message: "Multi-Tenant Billing API is running" });
});
// Example logging route
app.get("/test-log", function (_req, res) {
    logger_1.default.info("📢 Test log from Vercel");
    res.send({ message: "Log sent to Logtail" });
});
app.get("/test-env", function (_req, res) {
    res.json({ TEST_SERVER_BILLING: process.env.TEST_SERVER_BILLING });
});
exports.default = app;
