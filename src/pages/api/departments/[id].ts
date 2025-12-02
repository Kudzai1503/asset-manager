import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type DepartmentResponse = {
  success: boolean;
  message?: string;
  department?: any;
  departments?: any[];
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

  // Handle DELETE request
  if (req.method === 'DELETE') {
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete departments",
      });
    }

    try {
      const { id } = req.query;
      const departmentId = Array.isArray(id) ? id[0] : id;

      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "Department ID is required",
        });
      }

      // First, check if there are any users or assets using this department
      const [{ data: users }, { data: assets }] = await Promise.all([
        supabaseAdmin
          .from('users')
          .select('id')
          .eq('department_id', departmentId)
          .limit(1),
        supabaseAdmin
          .from('assets')
          .select('id')
          .eq('department_id', departmentId)
          .limit(1)
      ]);

      if (users && users.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete department: it is assigned to one or more users",
        });
      }

      if (assets && assets.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete department: it is assigned to one or more assets",
        });
      }

      const { error } = await supabaseAdmin
        .from('departments')
        .delete()
        .eq('id', departmentId);

      if (error) {
        console.error('Error deleting department:', error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to delete department",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      console.error('Error in DELETE /api/departments/[id]:', error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  // Handle PUT request for updating department
  if (req.method === 'PUT') {
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update departments",
      });
    }

    try {
      const { id } = req.query;
      const departmentId = Array.isArray(id) ? id[0] : id;
      const { name } = req.body;

      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "Department ID is required",
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Department name is required",
        });
      }

      const { data: department, error } = await supabaseAdmin
        .from('departments')
        .update({ name: name.trim() })
        .eq('id', departmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating department:', error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to update department",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Department updated successfully",
        department,
      });
    } catch (error) {
      console.error('Error in PUT /api/departments/[id]:', error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  // Handle GET request for a single department
  if (req.method === 'GET') {
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const { id } = req.query;
      const departmentId = Array.isArray(id) ? id[0] : id;

      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "Department ID is required",
        });
      }

      const { data: department, error } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('id', departmentId)
        .single();

      if (error) {
        console.error('Error fetching department:', error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to fetch department",
        });
      }

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      return res.status(200).json({
        success: true,
        department,
      });
    } catch (error) {
      console.error('Error in GET /api/departments/[id]:', error);
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
