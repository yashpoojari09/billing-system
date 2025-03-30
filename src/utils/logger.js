"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = require("winston");
var node_1 = require("@logtail/node");
var winston_2 = require("@logtail/winston");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var logtail = new node_1.Logtail(process.env.BETTERSTACK_SOURCE_TOKEN, {
    endpoint: process.env.BETTERSTACK_INGESTING_HOST
});
// Ensure Logtail token exists
if (!process.env.BETTERSTACK_SOURCE_TOKEN) {
    throw new Error("Logtail token is missing! Check your .env file.");
}
// Initialize Logtail
// const logtail = new Logtail('HXb2cYczfFn8EDsFYECnU3eX');
// Define log format
var logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(function (_a) {
    var timestamp = _a.timestamp, level = _a.level, message = _a.message;
    return "".concat(timestamp, " [").concat(level.toUpperCase(), "]: ").concat(message);
}));
// Create logger
var logger = winston_1.default.createLogger({
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
