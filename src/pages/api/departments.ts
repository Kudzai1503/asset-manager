import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type DepartmentResponse = {
  success: boolean;
  message?: string;
  departments?: any[];
};

async function verifyAuth(req: NextApiRequest) {
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

  return user;
}

async function verifyAdmin(req: NextApiRequest) {
  const user = await verifyAuth(req);
  if (!user) return null;

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
  res: NextApiResponse<DepartmentResponse>
) {
  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
  }

  // GET - List departments (all authenticated users)
  if (req.method === "GET") {
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const { data: departments, error } = await supabaseAdmin
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch departments",
        });
      }

      return res.status(200).json({
        success: true,
        departments: departments || [],
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  // POST - Create department (admin only)
  if (req.method === "POST") {
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Only admins can create departments",
      });
    }

    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Department name is required",
        });
      }

      const { data: department, error } = await supabaseAdmin
        .from("departments")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) {
        console.error("Error creating department:", error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to create department",
        });
      }

      return res.status(201).json({
        success: true,
        departments: [department],
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: "Method not allowed",
  });
}

