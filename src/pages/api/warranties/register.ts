import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type WarrantyResponse = {
  success: boolean;
  message?: string;
  data?: any;
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

  if (!user || !supabaseAdmin) return null;

  return user;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WarrantyResponse>
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

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const { asset_id } = req.body;

    if (!asset_id) {
      return res.status(400).json({
        success: false,
        message: "Asset ID is required",
      });
    }

    // Fetch the asset details
    const { data: asset, error: assetError } = await supabaseAdmin
      .from("assets")
      .select(`
        id,
        name,
        category_id,
        department_id,
        date_purchased,
        cost,
        created_by,
        categories:category_id (name),
        departments:department_id (name),
        users:created_by (name, email)
      `)
      .eq("id", asset_id)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Verify that the current user owns this asset
    if (asset.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only register warranty for your own assets",
      });
    }

    // Prepare warranty registration data
    const warrantyData = {
      asset_id: asset.id,
      asset_name: asset.name,
      category: asset.categories?.[0]?.name || "N/A",
      department: asset.departments?.[0]?.name || "N/A",
      date_purchased: asset.date_purchased,
      cost: asset.cost,
      user_id: asset.created_by,
      user_name: asset.users?.[0]?.name || "Unknown",
      user_email: asset.users?.[0]?.email || "Unknown",
      registration_date: new Date().toISOString(),
    };

    // Send warranty registration to Python web app endpoint
    const pythonWebAppUrl = process.env.PYTHON_WEBAPP_URL;
    if (!pythonWebAppUrl) {
      console.error("Python web app URL not configured");
      return res.status(500).json({
        success: false,
        message: "Warranty service temporarily unavailable",
      });
    }

    const pythonResponse = await fetch(`${pythonWebAppUrl}/warranty/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(warrantyData),
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json().catch(() => ({}));
      console.error("Python app error:", errorData);
      return res.status(500).json({
        success: false,
        message: "Failed to register warranty with warranty service",
      });
    }

    const pythonData = await pythonResponse.json();

    return res.status(200).json({
      success: true,
      message: "Warranty registered successfully",
      data: pythonData,
    });
  } catch (error) {
    console.error("Error registering warranty:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
}
