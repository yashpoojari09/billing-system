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
  
      return { accessToken, refreshToken};
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
    if (!user) return next(new AppError("Invalid Email Id", 401));

    // 🔹 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new AppError("Invalid credentials", 401));

    // 🔹 Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
 // 🔹 Delete old refresh tokens for this user
 await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

 // 🔹 Store new refresh token in DB
 await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken } });

 // 🔹 Set refresh token in an HTTP-only cookie
 res.cookie("refreshToken", refreshToken, {
   httpOnly: true,
   secure: true, 
   sameSite: "strict",
   path: "/auth/refresh",
 });

 res.json({ message: "Login successful", accessToken, user });
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
    const { refreshToken } = req.cookies;
    if (!refreshToken) return next(new AppError("Refresh token required", 401));

    // 🔹 Check if refresh token exists in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      res.clearCookie("refreshToken", { path: "/auth/refresh" });
      return next(new AppError("Invalid refresh token", 403));
    }
       // 🔹 Verify token
       let decoded;
       try {
         decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
       } catch (err) {
         res.clearCookie("refreshToken", { path: "/auth/refresh" });
         return next(new AppError("Invalid or expired refresh token", 403));
       }
   
       // 🔹 Generate new tokens
       const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);
   
       // 🔹 Remove old refresh token and store the new one
       await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
       await prisma.refreshToken.create({ data: { userId: decoded.id, token: newRefreshToken } });
   
       // 🔹 Set new refresh token in HTTP-only cookie
       res.cookie("refreshToken", newRefreshToken, {
         httpOnly: true,
         secure: true, // Only send over HTTPS
         sameSite: "strict",
         path: "/auth/refresh",
       });
   
       res.json({ accessToken });
     } catch (error) {
       next(error);
     }
   };

// ✅ LOGOUT USER (Revoke Refresh Token)
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken} = req.body;
    if (!refreshToken) return next(new AppError("Refresh token is required", 400));

    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    res.clearCookie("refreshToken", { path: "/auth/refresh" });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
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




export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET as string, { expiresIn: "1h" });

    // Hash the token for security
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Store the token and expiration in DB
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      },
    });

    // Send the reset link via email
    const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `<p>Click the link below to reset your password:</p>
            <a href="${resetLink}">${resetLink}</a>`,
    });

    return res.status(200).json({ message: "Password reset link sent to email." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// get Reset Token
export const resetToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
     res.status(400).json({ message: "Token is missing or invalid." });
     return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;

    if (!decoded || typeof decoded !== "object" || !decoded.email) {
       res.status(400).json({ message: "Invalid or expired token." });
       return;
    }

    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
       res.status(400).json({ message: "Invalid or expired token." });
       return;
    }

    // Compare hashed token
    const isMatch = await bcrypt.compare(token, user.resetToken);

    if (!isMatch || new Date() > user.resetTokenExpiry) {
       res.status(400).json({ message: "Invalid or expired token." });
       return;
    }

     res.status(200).json({ message: "Valid token." });
     return;
  } catch (error) {
    console.error("JWT Verification Error:", error);
     res.status(400).json({ message: "Invalid or expired token." });
     return;
  }
};




/// ✅ POST Controller - Reset Password
export const resetPassword = async (req: Request, res: Response, next: NextFunction):Promise<any> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return next(new AppError("Token and new password are required.", 400));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    } catch (error) {
      return next(new AppError("Invalid or expired token. Please request a new reset link.", 400));
    }

    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    console.log("User details:", user);
    const isTokenValid = user.resetToken && await bcrypt.compare(token, user.resetToken);
if (!user.resetToken || !isTokenValid) {
  return next(new AppError("Invalid or expired token. Please request a new reset link.", 400));
}

 // ✅ Fix: Check if the token is expired
 if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
  return next(new AppError("Reset token has expired. Please request a new one.", 400));
}
    if (newPassword !== confirmPassword) {
      return next(new AppError("New password and confirm password do not match.", 400));
    }

    if (newPassword.length < 8) {
      return next(new AppError("Password must be at least 8 characters long.", 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: decoded.email },
      data: { password: hashedPassword, resetToken: null },
    });

    // ✅ **Fix: Add return to stop execution after success**
    return res.status(200).json({ success: true, message: "Password reset successful. Redirecting to login..." });

  } catch (error) {
    return next(error);
  }
};
