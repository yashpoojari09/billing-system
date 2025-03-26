import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import dotenv from "dotenv";

dotenv.config();

// Ensure Logtail token exists
if (!process.env.TEST_SERVER_BILLING) {
  throw new Error("Logtail token is missing! Check your .env file.");
}
// Initialize Logtail
const logtail = new Logtail(process.env.TEST_SERVER_BILLING);

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
