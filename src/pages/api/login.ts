import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

type LoginRequest = {
  email: string;
  password: string;
  userType?: "admin" | "user";
};

type LoginResponse = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    userType: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  // Check if Supabase is configured
  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error. Please check environment variables.",
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error. Missing Supabase credentials.",
    });
  }

  // Create a client for authentication
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { email, password, userType }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Authenticate user with Supabase
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    });

    if (authError) {
      // Handle specific auth errors
      if (authError.message.includes("Invalid login credentials")) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
      
      return res.status(401).json({
        success: false,
        message: authError.message || "Authentication failed",
      });
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    // Get user data from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, name, user_type")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData) {
      console.error("User data error:", userError);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user information",
      });
    }

    // Optional: Verify user type matches (if provided)
    if (userType && userData.user_type !== userType) {
      // Sign out the user since type doesn't match
      await supabaseAuth.auth.signOut();
      return res.status(403).json({
        success: false,
        message: `Access denied. This account is registered as ${userData.user_type}, not ${userType}.`,
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        userType: userData.user_type,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in || 3600,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
}

