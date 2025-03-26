import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import dotenv from "dotenv";

dotenv.config();


const logtailToken = process.env.TEST_SERVER_BILLING || "TEST_SERVER_BILLING";
// Initialize Logtail
const logtail = new Logtail(logtailToken );

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);


// Create logger
const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [new winston.transports.Console(), new LogtailTransport(logtail)],

});

export default logger;
