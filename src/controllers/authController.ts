import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/error";
import nodemailer from "nodemailer"

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Use env variable
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your_refresh_secret";



const ACCESS_TOKEN_EXPIRY = "6h"; // Short-lived token
const REFRESH_TOKEN_EXPIRY = "1d"; // Long-lived token


// ✅ Function to generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  const resetToken = jwt.sign({ id:userId}, JWT_SECRET!, {
    expiresIn: "1h",
  });
      return { accessToken, refreshToken, resetToken};
};

// ✅ REGISTER USER
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, tenantId } = req.body;

    // 🔹 Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return next(new AppError("User already exists", 400));

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Create new user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, tenantId },
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    next(error);
  }
};

// ✅ LOGIN USER
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 🔹 Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(new AppError("Invalid credentials", 401));

    // 🔹 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new AppError("Invalid credentials", 401));

    // 🔹 Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

   // 🔹 Store refresh token in DB
   console.log("Generated Refresh Token:", refreshToken);

   const createdToken = await prisma.refreshToken.create({
     data: { userId: user.id, token: refreshToken },
   });

   console.log("Stored Refresh Token in DB:", createdToken);

    res.json({ message: "Login successful", accessToken, refreshToken, user });
  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE USER (Only Admin & Superadmin)
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, password, role, tenantId } = req.body;

    // 🔹 Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return next(new AppError("User not found", 404));

    // 🔹 Check if tenant exists (if updating tenant)
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) return next(new AppError("Tenant not found", 404));
    }

    // 🔹 Hash new password if provided
    const updatedData: any = { name, email, role, tenantId };
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    // 🔹 Update user
    const updatedUser = await prisma.user.update({ where: { id }, data: updatedData });

    res.json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError("Refresh token required", 401));

    // 🔹 Check if refresh token exists in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) return next(new AppError("Invalid refresh token", 403));

    // 🔹 Verify token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { id: string };
    if (!decoded) return next(new AppError("Invalid token", 403));

    // 🔹 Generate new access token
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

    // 🔹 Update refresh token in DB (optional, for better security)
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { token: newRefreshToken },
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
};

// ✅ LOGOUT USER (Revoke Refresh Token)
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken} = req.body;
    if (!refreshToken) return next(new AppError("Refresh token is required", 400));

    // 🔹 Delete refresh token from DB
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// // Forgot Password Token
// export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
//   const { email } = req.body;

//   if (!email) {
//      res.status(400).json({ error: "Email is required" });
//      return;
//   }

//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user)  res.status(404).json({ error: "User not found" })

//     // Generate reset token
//     const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });

//     // Store Token in Database
//     await prisma.user.update({
//       where: { email },
//       data: { resetToken },
//     });

//     // Send Email
//     const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
//     await sendResetEmail(email, resetUrl);

//     res.json({ message: "Password reset link sent to your email." });
//   } catch (errorhttp://localhost:3000/) {
//     res.status(500).json({ error: "Something went wrong!" });
//   }
// };

// // Helper Function to Send Email
// const sendResetEmail = async (email: string, resetUrl: string) => {
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: `"Billing System" <no-reply@billing.com>`,
//     to: email,
//     subject: "Password Reset Request",
//     html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
//   });
// };

// ✅ GET Controller - Verify Reset Token
// ✅ Verify Reset Token
export const resetToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params; // Extract token from URL

  try {
    const decoded = jwt.verify(token,JWT_SECRET) as { email: string };
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
       res.status(400).json({ message: "Invalid or expired token." });
       return;
    }

    res.status(200).json({ message: "Valid token." });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token." });
  }
};

//Post  Reset Password
export const resetPassword = async (req: Request, res: Response):Promise<void>=> {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
     res.status(400).json({ error: "Token and new password are required" });
     return;
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.resetToken !== token) {
       res.status(400).json({ error: "Invalid or expired token" });
       return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null },
    });

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    res.status(500).json({ error: "Invalid or expired token" });
  }
};

import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email (e.g., Gmail)
    pass: process.env.EMAIL_PASS, // Your email password or App Password
  },
});

export const forgotPassword = async (req: Request, res: Response):Promise<any> => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a reset token (JWT)
    const resetToken = jwt.sign({ email }, JWT_SECRET, {
      expiresIn: "1h", // The token expires in 1 hour
    });

    // Send the reset link to the user's email
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    return res.status(200).json({ message: "Password reset link sent to email." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong." });
  }}