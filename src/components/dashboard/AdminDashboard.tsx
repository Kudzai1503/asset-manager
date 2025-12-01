import { useState, useEffect } from "react";
import Button from "@/components/buttons/Button";
import Input from "@/components/inputs/Input";

type Asset = {
  id: string;
  name: string;
  category: string;
  department: string;
  date_purchased: string;
  cost: number;
  created_by: string;
  created_by_name?: string;
};

type Category = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  user_type: string;
};

export default function AdminDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "assets" | "categories" | "departments" | "users"
  >("assets");

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserType, setNewUserType] = useState<"admin" | "user">("user");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAssets(),
        loadCategories(),
        loadDepartments(),
        loadUsers(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssets = async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch("/api/assets", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      setAssets(data.assets || []);
    }
  };

  const loadCategories = async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch("/api/categories", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      setCategories(data.categories || []);
    }
  };

  const loadDepartments = async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch("/api/departments", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      setDepartments(data.departments || []);
    }
  };

  const loadUsers = async () => {
    const token = localStorage.getItem("access_token");
    const response = await fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      setUsers(data.users || []);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newCategory }),
    });

    if (response.ok) {
      setNewCategory("");
      setShowCategoryForm(false);
      loadCategories();
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const response = await fetch("/api/departments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newDepartment }),
    });

    if (response.ok) {
      setNewDepartment("");
      setShowDepartmentForm(false);
      loadDepartments();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const response = await fetch("/api/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        userType: newUserType,
      }),
    });

    if (response.ok) {
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserType("user");
      setShowUserForm(false);
      loadUsers();
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    const token = localStorage.getItem("access_token");
    const response = await fetch(`/api/assets/${assetId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      loadAssets();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-stone-800">Admin Dashboard</h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="-mb-px flex space-x-8">
          {(["assets", "categories", "departments", "users"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-stone-900 text-stone-900"
                    : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </nav>
      </div>

      {/* Assets Tab */}
      {activeTab === "assets" && (
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-semibold text-stone-800 mb-4">All Assets</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Date Purchased
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-stone-500">
                      No assets found
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {asset.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {asset.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {new Date(asset.date_purchased).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        ${asset.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {asset.created_by_name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-stone-800">Categories</h3>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCategoryForm(!showCategoryForm)}
            >
              {showCategoryForm ? "Cancel" : "Create Category"}
            </Button>
          </div>

          {showCategoryForm && (
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <Input
                  label="Category Name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
                <Button type="submit" variant="primary" fullWidth>
                  Create Category
                </Button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length === 0 ? (
                <p className="text-stone-500">No categories found</p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 border border-stone-200 rounded-lg"
                  >
                    <h4 className="font-medium text-stone-800">{category.name}</h4>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-stone-800">Departments</h3>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowDepartmentForm(!showDepartmentForm)}
            >
              {showDepartmentForm ? "Cancel" : "Create Department"}
            </Button>
          </div>

          {showDepartmentForm && (
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <Input
                  label="Department Name"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Enter department name"
                  required
                />
                <Button type="submit" variant="primary" fullWidth>
                  Create Department
                </Button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.length === 0 ? (
                <p className="text-stone-500">No departments found</p>
              ) : (
                departments.map((department) => (
                  <div
                    key={department.id}
                    className="p-4 border border-stone-200 rounded-lg"
                  >
                    <h4 className="font-medium text-stone-800">{department.name}</h4>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-stone-800">Users</h3>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowUserForm(!showUserForm)}
            >
              {showUserForm ? "Cancel" : "Create User"}
            </Button>
          </div>

          {showUserForm && (
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <form onSubmit={handleCreateUser} className="space-y-4">
                <Input
                  label="Full Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">
                    User Type
                  </label>
                  <div className="bg-amber-100 p-1 rounded-lg flex">
                    <button
                      type="button"
                      onClick={() => setNewUserType("user")}
                      className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        newUserType === "user"
                          ? "bg-white text-stone-800 shadow-sm"
                          : "text-stone-600 hover:text-stone-800"
                      }`}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserType("admin")}
                      className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        newUserType === "admin"
                          ? "bg-white text-stone-800 shadow-sm"
                          : "text-stone-600 hover:text-stone-800"
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="primary" fullWidth>
                  Create User
                </Button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-stone-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 capitalize">
                          {user.user_type}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

