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
    const { asset_id, owner_phone, warranty_period_months, serial_number } = req.body;

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
        date_purchased,
        created_by,
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

    // Prepare warranty registration data according to Python API spec
    const warrantyData = {
      manufacturer: "N/A", // Can be added to asset form in future
      owner_email: asset.users?.[0]?.email || "",
      owner_name: asset.users?.[0]?.name || "Unknown",
      owner_phone: owner_phone || "",
      product_name: asset.name,
      purchase_date: asset.date_purchased,
      serial_number: serial_number && serial_number.trim() ? serial_number : asset.id, // Use asset ID as fallback
      warranty_period_months: warranty_period_months || 12, // Default 12 months
    };

    // Send warranty registration to Python web app endpoint
    const pythonWebAppUrl = process.env.PYTHON_WEBAPP_URL || "http://localhost:5001";
    
    const pythonResponse = await fetch(`${pythonWebAppUrl}/api/devices/register`, {
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
