import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const logtail = new Logtail('test_server_billing');

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
