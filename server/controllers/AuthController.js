import prisma from "../Models/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "../services/emailService.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const validRoles = ["PROPOSER", "GUIDE", "GUIDE_GM", "TRAINING_OFFICER", "HR_GM"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    if (role === "GUIDE_GM" && !department) {
      return res.status(400).json({ success: false, message: "Department is required for Guide General Manager" });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.is_verified) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (existingUser) {
      // Overwrite/update unverified user
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          role,
          department: role === "GUIDE_GM" ? department : null,
          otp,
          otp_expiry: otpExpiry,
          is_verified: false,
        },
      });
    } else {
      // Create new unverified user
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          department: role === "GUIDE_GM" ? department : null,
          otp,
          otp_expiry: otpExpiry,
          is_verified: false,
        },
      });
    }

    // Send OTP Email with max 4s timeout so the UI never freezes
    try {
      await Promise.race([
        sendOTPEmail(email, otp, name),
        new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 4000))
      ]);
    } catch (err) {
      console.error('[EMAIL ERROR]', err);
    }

    return res.status(200).json({
      success: true,
      otpRequired: true,
      message: "Verification OTP has been sent to your email.",
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Email is not verified. Please register again to verify your email.",
        unverified: true,
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
      process.env.JWT_SECRET || "student_intern_approval_secret_key_12345",
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (user.is_verified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP code" });
    }

    // Check OTP expiry
    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please sign up again to receive a new OTP." });
    }

    // Mark user as verified
    await prisma.user.update({
      where: { email },
      data: {
        is_verified: true,
        otp: null,
        otp_expiry: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
