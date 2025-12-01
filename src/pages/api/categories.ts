import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type CategoryResponse = {
  success: boolean;
  message?: string;
  categories?: any[];
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
  res: NextApiResponse<CategoryResponse>
) {
  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
  }

  // GET - List categories (all authenticated users)
  if (req.method === "GET") {
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const { data: categories, error } = await supabaseAdmin
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch categories",
        });
      }

      return res.status(200).json({
        success: true,
        categories: categories || [],
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  // POST - Create category (admin only)
  if (req.method === "POST") {
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Only admins can create categories",
      });
    }

    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      const { data: category, error } = await supabaseAdmin
        .from("categories")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) {
        console.error("Error creating category:", error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to create category",
        });
      }

      return res.status(201).json({
        success: true,
        categories: [category],
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

