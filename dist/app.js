"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
require("./middlewares/auth");
const tenants_1 = __importDefault(require("./routes/tenants"));
const error_1 = require("./middlewares/error");
const logger_1 = __importDefault(require("./utils/logger"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = [
    'https://billing-system-frontend-three.vercel.app',
    'http://localhost:3000'
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        else {
            return callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
app.use((0, cookie_parser_1.default)());
app.use("/api/auth", auth_routes_1.default);
app.use("/api/tenants", tenants_1.default);
app.use('/receipts', express_1.default.static(path_1.default.join(__dirname, 'public/receipts')));
app.get("/", (_req, res) => {
    res.send({ message: "Multi-Tenant Billing API is running" });
});
app.get("/test-log", (_req, res) => {
    logger_1.default.info("📢 Test log from Vercel");
    res.send({ message: "Log sent to Logtail" });
});
app.get("/test-env", (_req, res) => {
    res.json({ TEST_SERVER_BILLING: process.env.TEST_SERVER_BILLING });
});
app.use(error_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map