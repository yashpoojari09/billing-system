import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import authRoutes from "./routes/auth.routes";
import "./middlewares/auth"; // Initialize passport strategy
// import customerRoutes from "./routes/customers";
import tenantRoutes from "./routes/tenants";
import { errorHandler } from "./middlewares/error";
// import inventoryRoutes from "./routes/inventory";
// import taxationRoutes from "./routes/taxation";




dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Global Error Handler
app.use(errorHandler);




// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
// app.use("/api/customers", customerRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/taxation", taxationRoutes);



// Health check route
app.get("/", (req, res) => {
    res.send({ message: "Multi-Tenant Billing API is running" });
});
    
export default app;
