"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const node_1 = require("@logtail/node");
const winston_2 = require("@logtail/winston");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const logtail = new node_1.Logtail(process.env.BETTERSTACK_SOURCE_TOKEN, {
    endpoint: process.env.BETTERSTACK_INGESTING_HOST
});
// Ensure Logtail token exists
if (!process.env.BETTERSTACK_SOURCE_TOKEN) {
    throw new Error("Logtail token is missing! Check your .env file.");
}
// Initialize Logtail
// const logtail = new Logtail('HXb2cYczfFn8EDsFYECnU3eX');
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
}));
// Create logger
const logger = winston_1.default.createLogger({
    level: 'info',
    format: logFormat,
    transports: [new winston_1.default.transports.Console(), new winston_2.LogtailTransport(logtail)],
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: 'exception.log' }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({ filename: 'rejections.log' }),
    ],
});
exports.default = logger;
//# sourceMappingURL=logger.js.map