import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type UsersResponse = {
  success: boolean;
  message?: string;
  users?: any[];
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
  res: NextApiResponse<UsersResponse>
) {
  if (req.method !== "GET") {
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
      message: "Only admins can view users",
    });
  }

  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, user_type, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }

    return res.status(200).json({
      success: true,
      users: users || [],
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
}

