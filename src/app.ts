// src/app.ts
import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import authRoutes from "./routes/auth.routes";
import "./middlewares/auth";
import tenantRoutes from "./routes/tenants";
import { errorHandler } from "./middlewares/error";
import logger from "./utils/logger";
import cookieParser from "cookie-parser";
import cors from "cors";
// import path from "path";

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://billing-system-frontend-three.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(passport.initialize());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);

app.get("/", (_req, res) => {
  res.send({ message: "Multi-Tenant Billing API is running" });
});

app.get("/test-log", (_req, res) => {
  logger.info("📢 Test log from Vercel");
  res.send({ message: "Log sent to Logtail" });
});

app.get("/test-env", (_req, res) => {
  res.json({ TEST_SERVER_BILLING: process.env.TEST_SERVER_BILLING });
});

app.use(errorHandler);

export default app;
