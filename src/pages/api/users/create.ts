import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type CreateUserResponse = {
  success: boolean;
  message?: string;
  user?: any;
};

async function verifyAdmin(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return null;
  }

  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (userData?.user_type !== "admin") {
    return null;
  }

  return user;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateUserResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
  }

  const user = await verifyAdmin(req);
  if (!user) {
    return res.status(403).json({
      success: false,
      message: "Only admins can create users",
    });
  }

  try {
    const { name, email, password, userType } = req.body;

    if (!name || !email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (userType !== "admin" && userType !== "user") {
      return res.status(400).json({
        success: false,
        message: "Invalid user type",
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
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
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        user_type: userType,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return res.status(500).json({
        success: false,
        message: "Failed to create user account",
      });
    }

    // Create user record in users table
    const { data: userData, error: dbError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        name: name,
        user_type: userType,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to create user record",
      });
    }

    return res.status(201).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
}

