import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type CategoryResponse = {
  success: boolean;
  message?: string;
  category?: any;
  categories?: any[];
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
  res: NextApiResponse<CategoryResponse>
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
        message: "Only admins can delete categories",
      });
    }

    try {
      const { id } = req.query;
      const categoryId = Array.isArray(id) ? id[0] : id;

      if (!categoryId) {
        return res.status(400).json({
          success: false,
          message: "Category ID is required",
        });
      }

      // First, check if there are any assets using this category
      const { data: assets, error: assetsError } = await supabaseAdmin
        .from('assets')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1);

      if (assetsError) {
        console.error('Error checking category usage:', assetsError);
        return res.status(500).json({
          success: false,
          message: "Error checking category usage",
        });
      }

      if (assets && assets.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category: it is being used by one or more assets",
        });
      }

      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to delete category",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error('Error in DELETE /api/categories/[id]:', error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  // Handle PUT request for updating category
  if (req.method === 'PUT') {
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update categories",
      });
    }

    try {
      const { id } = req.query;
      const categoryId = Array.isArray(id) ? id[0] : id;
      const { name } = req.body;

      if (!categoryId) {
        return res.status(400).json({
          success: false,
          message: "Category ID is required",
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      const { data: category, error } = await supabaseAdmin
        .from('categories')
        .update({ name: name.trim() })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to update category",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category,
      });
    } catch (error) {
      console.error('Error in PUT /api/categories/[id]:', error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  // Handle GET request for a single category
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
      const categoryId = Array.isArray(id) ? id[0] : id;

      if (!categoryId) {
        return res.status(400).json({
          success: false,
          message: "Category ID is required",
        });
      }

      const { data: category, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) {
        console.error('Error fetching category:', error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to fetch category",
        });
      }

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      return res.status(200).json({
        success: true,
        category,
      });
    } catch (error) {
      console.error('Error in GET /api/categories/[id]:', error);
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
