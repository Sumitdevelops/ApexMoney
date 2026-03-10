import bcrypt from 'bcrypt'
import { User } from '../models/user.model.js'
import { Expense } from '../models/expense.model.js'
import { Income } from '../models/income.model.js'
import { FinancialGoal } from '../models/financialGoal.model.js'
import { Subscription } from '../models/subscription.model.js'
import { AIInsight } from '../models/aiInsight.model.js'
import { BillReminder } from '../models/billReminder.model.js'
import { Resend } from 'resend'

// Send OTP email via Resend HTTP API (works reliably from cloud platforms like Render)
const sendOTPEmail = async (toEmail, otp) => {
   if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service is not configured. RESEND_API_KEY is missing.");
   }

   const resend = new Resend(process.env.RESEND_API_KEY);

   console.log('Sending OTP email via Resend to:', toEmail);

   const { data, error } = await resend.emails.send({
      from: 'ApexMoney <onboarding@resend.dev>',
      to: toEmail,
      subject: 'ApexMoney Password Reset OTP',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
         <h2 style="color:#7c3aed">ApexMoney</h2>
         <p>Your OTP for resetting your password is:</p>
         <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f3f4f6;border-radius:12px;margin:16px 0">${otp}</div>
         <p style="color:#6b7280;font-size:14px">This code is valid for 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>`,
   });

   if (error) {
      console.error('Resend API error:', error);
      throw new Error(error.message || 'Failed to send email via Resend');
   }

   console.log('OTP email sent successfully via Resend, ID:', data?.id);
   return data;
};

export const Signup = async (req, res) => {
   console.log("Received signup request with body:", req.body)
   const { name, email, password } = req.body
   try {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
         return res.status(400).json({ message: "Email already registered" })
      }
      const hashedPassword = await bcrypt.hash(password, 10)

      if (!hashedPassword) {
         return res.status(500).json({ message: "password not hashed" })

      }

      const newUser = await User.create({
         name,
         email,
         password: hashedPassword
      })

      req.session.userId = newUser?._id

      const userToReturn = await User.findById(newUser._id).select("-password");

      // Explicitly save session to MongoStore before responding
      // This prevents race conditions where the next request arrives before the session is persisted
      await new Promise((resolve, reject) => {
         req.session.save((err) => {
            if (err) reject(err);
            else resolve();
         });
      });

      return res.status(200).json({ User: userToReturn, message: "user registered" })
   } catch (error) {
      console.log("signup error:", error);
      return res.status(500).json({ message: "Unable to Signup" })

   }

}

export const login = async (req, res) => {
   const { email, password } = req.body
   try {
      if (!email || !password) {
         return res.status(400).json({ message: "Both fields are required" })
      }

      const user = await User.findOne({ email })
      if (!user) {
         return res.status(401).json({ message: "User not registered" })
      }

      const isPasswordCorrect = await bcrypt.compare(password, user?.password)

      if (isPasswordCorrect === false) {
         return res.status(400).json({ message: "password incorrect" })

      }
      const loggedInUser = await User.findById(user._id).select("-password")
      req.session.userId = user?._id

      // Explicitly save session to MongoStore before responding
      // This prevents race conditions where the next request arrives before the session is persisted
      await new Promise((resolve, reject) => {
         req.session.save((err) => {
            if (err) reject(err);
            else resolve();
         });
      });

      return res.status(200).json({ User: loggedInUser, message: 'User LoggedIn successfully' })

   } catch (error) {
      console.log("login error: ", error);
      return res.status(500).json({ message: "unexpected login issue" })

   }
}

export const logout = (req, res) => {
   if (req.session) {
      req.session.destroy((err) => {

         if (err) {
            return res.status(500).json({ message: "internal server error" })
         }
         res.clearCookie('sessionId')
         return res.status(200).json({ message: "User logged out successfully" })


      })
   } else {
      return res.status(400).json({ message: "no session available" })
   }
}

export const changePassword = async (req, res) => {
   try {
      if (!req.session.userId) {
         return res.status(400).json({ message: "user not logged in" })
      }
      const { oldPassword, newPassword } = req.body
      if (oldPassword === newPassword) {
         return res.status(400).json({ message: "please give different passwords" })
      }
      if (!oldPassword || !newPassword) {
         return res.status(400).json({ message: "Please give both the fields" })
      }

      const user = await User.findById(req.session.userId)

      const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password)

      if (!isPasswordCorrect) {
         return res.status(400).json({ message: "incorrect old password" })
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 10)
      await User.findByIdAndUpdate(
         user._id,
         {
            $set: { password: newHashedPassword }
         },
         {
            new: true
         }
      )

      return res.status(200).json({ message: "password changed successfully" })

   } catch (error) {
      console.log("password change error", error);
      return res.status(500).json({ message: 'internal server error' })

   }
}

export const checkUserSession = async (req, res) => {
   console.log('--- Check User Session Debug ---');
   console.log('Session ID:', req.sessionID);
   console.log('Session Content:', JSON.stringify(req.session));
   console.log('Session userId:', req.session.userId);

   if (!req.session.userId) {
      console.warn('Session check failed: No userId found in session.');
      return res.status(401).json({ message: "User not logged in" })
   }

   try {
      const user = await User.findById(req.session.userId).select("-password")

      if (!user) {
         console.error('Session check failed: User ID in session does not exist in database:', req.session.userId);
         return res.status(400).json({ message: "user not found while checking session" })
      }

      console.log('Session check successful for user:', user.email);
      return res.status(200).json({ user: user, message: "Session available" })
   } catch (error) {
      console.error('Session check error:', error);
      return res.status(500).json({ message: "Internal server error during session check" });
   }
}

export const requestPasswordReset = async (req, res) => {
   try {
      const { email } = req.body;
      if (!email) {
         return res.status(400).json({ message: "Email is required" });
      }
      const user = await User.findOne({ email });
      if (!user) {
         return res.status(404).json({ message: "User not found" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      user.resetPasswordOTP = otp;
      user.resetPasswordExpires = expires;
      await user.save();

      // Send OTP via Resend HTTP API
      await sendOTPEmail(email, otp);

      return res.status(200).json({ message: "OTP sent to email" });
   } catch (error) {
      console.error("requestPasswordReset error:", error);
      return res.status(500).json({ message: error.message || "Unable to send OTP. Please try again later." });
   }
};

export const verifyOTP = async (req, res) => {
   try {
      const { email, otp } = req.body;
      if (!email || !otp) {
         return res.status(400).json({ message: "Email and OTP are required" });
      }

      const user = await User.findOne({ email });
      if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
         return res.status(400).json({ message: "No reset request found for this user" });
      }

      if (user.resetPasswordOTP !== otp) {
         return res.status(400).json({ message: "Invalid OTP" });
      }

      if (user.resetPasswordExpires < new Date()) {
         return res.status(400).json({ message: "OTP has expired" });
      }

      return res.status(200).json({ message: "OTP verified successfully" });
   } catch (error) {
      console.log("verifyOTP error:", error);
      return res.status(500).json({ message: "Unable to verify OTP" });
   }
};

export const resetPasswordWithOTP = async (req, res) => {
   try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
         return res.status(400).json({ message: "Email, OTP and new password are required" });
      }

      const user = await User.findOne({ email });
      if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
         return res.status(400).json({ message: "No reset request found for this user" });
      }

      if (user.resetPasswordOTP !== otp) {
         return res.status(400).json({ message: "Invalid OTP" });
      }

      if (user.resetPasswordExpires < new Date()) {
         return res.status(400).json({ message: "OTP has expired" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetPasswordOTP = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(200).json({ message: "Password reset successfully" });
   } catch (error) {
      console.log("resetPasswordWithOTP error:", error);
      return res.status(500).json({ message: "Unable to reset password" });
   }
};

export const deleteAccount = async (req, res) => {
   try {
      const userId = req.session.userId;
      if (!userId) {
         return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Delete all related data in parallel
      await Promise.all([
         Expense.deleteMany({ userId }),
         Income.deleteMany({ userId }),
         FinancialGoal.deleteMany({ userId }),
         Subscription.deleteMany({ userId }),
         AIInsight.deleteMany({ userId }),
         BillReminder.deleteMany({ userId }),
      ]);

      // Delete user document
      await User.findByIdAndDelete(userId);

      // Destroy session
      req.session.destroy((err) => {
         if (err) {
            console.error("Session destroy error during account deletion:", err);
         }
         res.clearCookie('connect.sid');
         res.clearCookie('sessionId');
         return res.status(200).json({ success: true, message: "Account and all data deleted successfully" });
      });
   } catch (error) {
      console.error("deleteAccount error:", error);
      return res.status(500).json({ success: false, message: "Failed to delete account" });
   }
};

export const exportData = async (req, res) => {
   try {
      const userId = req.session.userId;
      if (!userId) {
         return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const user = await User.findById(userId);
      if (!user) {
         return res.status(404).json({ success: false, message: "User not found" });
      }

      // Fetch all user data (filtered by userId)
      const [expenses, income, goals, subscriptions, aiInsights] = await Promise.all([
         Expense.find({ userId }).lean(),
         Income.find({ userId }).lean(),
         FinancialGoal.find({ userId }).lean(),
         Subscription.find({ userId }).lean(),
         AIInsight.find({ userId }).lean(),
      ]);

      const exportData = {
         user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            preferences: user.preferences,
         },
         expenses,
         income,
         goals,
         subscriptions,
         aiInsights,
         exportedAt: new Date().toISOString(),
      };

      res.set('Content-Type', 'application/json');
      res.set('Content-Disposition', `attachment; filename="apexmoney-export-${Date.now()}.json"`);
      return res.status(200).json(exportData);
   } catch (error) {
      console.error("exportData error:", error);
      return res.status(500).json({ success: false, message: "Failed to export data" });
   }
};
