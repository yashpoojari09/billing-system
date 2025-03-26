import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import dotenv from "dotenv"
dotenv.config();
const logtail = new Logtail(process.env.TEST_SERVER_BILLING!  );


// Ensure Logtail token exists
if (!process.env.TEST_SERVER_BILLING) {
  throw new Error("Logtail token is missing! Check your .env file.");
}
// Initialize Logtail
// const logtail = new Logtail('HXb2cYczfFn8EDsFYECnU3eX');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);


// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [new winston.transports.Console(), new LogtailTransport(logtail)],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exception.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'rejections.log' }),
  ],

});
process.on("exit", async () => {
  await logtail.flush();
});


export default logger;
