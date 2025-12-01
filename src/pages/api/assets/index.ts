import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type AssetResponse = {
  success: boolean;
  message?: string;
  assets?: any[];
  asset?: any;
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

  if (!user) {
    return null;
  }

  // Get user type
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .single();

  return { user, userType: userData?.user_type || "user" };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssetResponse>
) {
  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // GET - List assets
  if (req.method === "GET") {
    try {
      let query = supabaseAdmin
        .from("assets")
        .select(`
          *,
          categories:category_id (name),
          departments:department_id (name),
          users:created_by (name)
        `)
        .order("created_at", { ascending: false });

      // If user is not admin, only show their assets
      if (auth.userType !== "admin") {
        query = query.eq("created_by", auth.user.id);
      }

      const { data: assets, error } = await query;

      if (error) {
        console.error("Error fetching assets:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch assets",
        });
      }

      // Transform the data to flatten nested objects
      const transformedAssets = assets?.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        category: asset.categories?.name || "N/A",
        department: asset.departments?.name || "N/A",
        date_purchased: asset.date_purchased,
        cost: parseFloat(asset.cost),
        created_by: asset.created_by,
        created_by_name: asset.users?.name || "Unknown",
      })) || [];

      return res.status(200).json({
        success: true,
        assets: transformedAssets,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  // POST - Create asset
  if (req.method === "POST") {
    try {
      const { name, category_id, department_id, date_purchased, cost } = req.body;

      if (!name || !category_id || !department_id || !date_purchased || cost === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const { data: asset, error } = await supabaseAdmin
        .from("assets")
        .insert({
          name,
          category_id,
          department_id,
          date_purchased,
          cost: parseFloat(cost),
          created_by: auth.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating asset:", error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to create asset",
        });
      }

      return res.status(201).json({
        success: true,
        asset,
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

