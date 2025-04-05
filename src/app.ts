import express from "express";
// Removed duplicate import of cors
import dotenv from "dotenv";
import passport from "passport";
import authRoutes from "./routes/auth.routes";
import "./middlewares/auth"; // Initialize passport strategy
// import customerRoutes from "./routes/customers";
import tenantRoutes from "./routes/tenants";
import { errorHandler } from "./middlewares/error";
// import inventoryRoutes from "./routes/inventory";
// import taxationRoutes from "./routes/taxation";
import logger from "./utils/logger"
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";


dotenv.config();

const app = express();

const allowedOrigins = [
  'https://billing-system-frontend-three.vercel.app',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
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
  })
);


// Middleware
app.use(express.json());
app.use(passport.initialize());
app.use(cookieParser()); // ✅ Enables cookie parsing
app.use('/receipts', express.static(path.join(__dirname, 'public/receipts')));



// Global Error Handler
app.use(errorHandler);



// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
// app.use("/api/customers", customerRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/taxation", taxationRoutes);


logger.info("Server is Starting...")
// Health check route
app.get("/", (_req, res) => {
    res.send({ message: "Multi-Tenant Billing API is running" });
});

// Example logging route
app.get("/test-log", (_req, res) => {
    logger.info("📢 Test log from Vercel");
    res.send({ message: "Log sent to Logtail" });
  });

  app.get("/test-env", (_req, res) => {
    res.json({ TEST_SERVER_BILLING: process.env.TEST_SERVER_BILLING });
  });
    
export default app;
