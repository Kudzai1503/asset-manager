import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type UserResponse = {
  success: boolean;
  message?: string;
  user?: any;
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
  res: NextApiResponse<UserResponse>
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
        message: "Only admins can delete users",
      });
    }

    try {
      const { id } = req.query;
      const userId = Array.isArray(id) ? id[0] : id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Prevent deleting your own account
      if (userId === user.id) {
        return res.status(400).json({
          success: false,
          message: "You cannot delete your own account",
        });
      }

      // Check if user has any assets assigned
      const { data: assets, error: assetsError } = await supabaseAdmin
        .from('assets')
        .select('id')
        .eq('assigned_to', userId)
        .limit(1);

      if (assetsError) {
        console.error('Error checking user assets:', assetsError);
        return res.status(500).json({
          success: false,
          message: "Error checking user assets",
        });
      }

      if (assets && assets.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete user: they have assets assigned to them",
        });
      }

      // Delete the user from auth and database
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error('Error deleting user from auth:', deleteError);
        return res.status(500).json({
          success: false,
          message: deleteError.message || "Failed to delete user from authentication",
        });
      }

      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) {
        console.error('Error deleting user from database:', dbError);
        return res.status(500).json({
          success: false,
          message: dbError.message || "Failed to delete user from database",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error('Error in DELETE /api/users/[id]:', error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  // Handle PUT request for updating user
  if (req.method === 'PUT') {
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update users",
      });
    }

    try {
      const { id } = req.query;
      const userId = Array.isArray(id) ? id[0] : id;
      const { name, email, user_type, department_id } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const updates: any = {};
      
      if (name && name.trim()) updates.name = name.trim();
      if (email && email.trim()) updates.email = email.trim();
      if (user_type) updates.user_type = user_type;
      if (department_id) updates.department_id = department_id;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields to update",
        });
      }

      // Update user in auth if email is being changed
      if (updates.email) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          email: updates.email,
        });

        if (authError) {
          console.error('Error updating user in auth:', authError);
          return res.status(500).json({
            success: false,
            message: authError.message || "Failed to update user email in authentication",
          });
        }
      }

      // Update user in database
      const { data: updatedUser, error: dbError } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (dbError) {
        console.error('Error updating user in database:', dbError);
        return res.status(500).json({
          success: false,
          message: dbError.message || "Failed to update user in database",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error in PUT /api/users/[id]:', error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }

  // Handle GET request for a single user
  if (req.method === 'GET') {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Only admins can view user details",
      });
    }

    try {
      const { id } = req.query;
      const userId = Array.isArray(id) ? id[0] : id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({
          success: false,
          message: error.message || "Failed to fetch user",
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Don't return sensitive information
      const { password, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Error in GET /api/users/[id]:', error);
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
