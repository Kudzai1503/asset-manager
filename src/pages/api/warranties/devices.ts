import type { NextApiRequest, NextApiResponse } from "next";

type WarrantyDevice = {
  id: number;
  manufacturer: string;
  owner_email: string;
  owner_name: string;
  owner_phone: string;
  product_name: string;
  purchase_date: string;
  registration_date: string;
  serial_number: string;
  warranty_period_months: number;
};

type DevicesResponse = {
  success: boolean;
  message?: string;
  devices?: WarrantyDevice[];
  count?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DevicesResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const pythonWebAppUrl = process.env.PYTHON_WEBAPP_URL || "https://server12.eport.ws";
    
    const pythonResponse = await fetch(`${pythonWebAppUrl}/api/devices`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json().catch(() => ({}));
      console.error("Python app error:", errorData);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch warranty devices",
      });
    }

    const pythonData = await pythonResponse.json();

    return res.status(200).json({
      success: true,
      devices: pythonData.data || [],
      count: pythonData.count || 0,
    });
  } catch (error) {
    console.error("Error fetching warranty devices:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
}
