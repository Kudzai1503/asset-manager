import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type DeleteResponse = {
  success: boolean;
  message?: string;
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

  if (!user || !supabaseAdmin) return null;

  // Check if user is admin
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
  res: NextApiResponse<DeleteResponse>
) {
  if (req.method !== "DELETE") {
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
      message: "Only admins can delete assets",
    });
  }

  try {
    const { id } = req.query;
    const assetId = Array.isArray(id) ? id[0] : id;

    if (!assetId) {
      return res.status(400).json({
        success: false,
        message: "Asset ID is required",
      });
    }

    const { error } = await supabaseAdmin
      .from("assets")
      .delete()
      .eq("id", assetId);

    if (error) {
      console.error("Error deleting asset:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete asset",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
}

