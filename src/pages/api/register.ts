import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";

type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  userType: "admin" | "user";
};

type RegisterResponse = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    userType: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
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

  // At this point, supabaseAdmin is guaranteed to be non-null
  const supabase = supabaseAdmin;

  try {
    const { name, email, password, userType }: RegisterRequest = req.body;

    // Validate input
    if (!name || !email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
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

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Validate user type
    if (userType !== "admin" && userType !== "user") {
      return res.status(400).json({
        success: false,
        message: "Invalid user type",
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name,
        user_type: userType,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return res.status(500).json({
        success: false,
        message: "Failed to create user account",
      });
    }

    if (!authData.user) {
      return res.status(500).json({
        success: false,
        message: "Failed to create user account",
      });
    }

    // Create user record in users table
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        name: name,
        user_type: userType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // If user was created in auth but failed in db, we should clean up
      // In production, you might want to handle this more gracefully
      return res.status(500).json({
        success: false,
        message: "Failed to create user record",
      });
    }

    // Success response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        userType: userData.user_type,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
}

