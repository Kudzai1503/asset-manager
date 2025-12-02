import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Button from "@/components/buttons/Button";
import Input from "@/components/inputs/Input";
import { AdminDashboardSkeleton } from "@/components/skeletons";

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

type TabType = "assets" | "categories" | "departments" | "users";

const isValidTab = (tab: string | string[] | undefined): tab is TabType => {
  return ["assets", "categories", "departments", "users"].includes(tab as string);
};

export default function AdminDashboard() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  
  // Get active tab from URL query parameter or default to 'assets'
  const activeTab = isValidTab(router.query.tab) ? router.query.tab : "assets";

  // Update URL when tab changes
  const setActiveTab = (tab: TabType) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab },
    }, undefined, { shallow: true });
  };

  // Form states - reset when tab changes
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);

  // Reset form states when tab changes
  useEffect(() => {
    setShowCategoryForm(false);
    setShowDepartmentForm(false);
    setShowUserForm(false);
  }, [activeTab]);

  // Calculate stats
  const totalAssetValue = assets.reduce((sum, asset) => sum + (asset.cost || 0), 0);
  const numCategories = categories.length;
  const numDepartments = departments.length;

  // Filter assets based on search and filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = searchTerm === '' || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || asset.category === selectedCategory;
    const matchesDepartment = !selectedDepartment || asset.department === selectedDepartment;
    
    return matchesSearch && matchesCategory && matchesDepartment;
  });

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedDepartment('');
  };
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
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-stone-800">Admin Dashboard</h2>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
            <div className="text-stone-500 text-sm font-medium">Total Assets</div>
            <div className="text-2xl font-bold text-stone-800">{assets.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
            <div className="text-stone-500 text-sm font-medium">Total Asset Value</div>
            <div className="text-2xl font-bold text-stone-800">
              ${totalAssetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
            <div className="text-stone-500 text-sm font-medium">Categories</div>
            <div className="text-2xl font-bold text-stone-800">{numCategories}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
            <div className="text-stone-500 text-sm font-medium">Departments</div>
            <div className="text-2xl font-bold text-stone-800">{numDepartments}</div>
          </div>
        </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="-mb-px flex space-x-8">
          {(["assets", "categories", "departments", "users"] as const).map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 ${
                    isActive
                      ? "border-stone-900 text-stone-900"
                      : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {tab}
                </button>
              );
            }
          )}
        </nav>
      </div>

      {/* Assets Tab */}
      {activeTab === "assets" && (
        <div className="bg-white rounded-lg border border-stone-300/20 p-6">
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold text-stone-800">All Assets</h3>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:space-x-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1 md:max-w-xs">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-stone-500 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 md:max-w-xs">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-stone-500 text-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="secondary"
                onClick={resetFilters}
                className="whitespace-nowrap"
              >
                Clear Filters
              </Button>
            </div>
            
            {/* Results count */}
            <div className="text-sm text-stone-500">
              Showing {filteredAssets.length} of {assets.length} assets
            </div>
          </div>
          
          <div className="mt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-300/20 border border-stone-300/20 rounded-lg">
              <thead className="bg-stone-50 border-b border-stone-300/20">
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
              <tbody className="bg-white divide-y divide-stone-300/20">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-stone-500">
                      No assets found
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
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
            <div className="bg-white rounded-lg border border-stone-300/20 p-6">
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

          <div className="bg-white rounded-lg border border-stone-300/20 p-6">
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
            <div className="bg-white rounded-lg border border-stone-300/20 p-6">
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

          <div className="bg-white rounded-lg border border-stone-300/20 p-6">
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
            <div className="bg-white rounded-lg border border-stone-300/20 p-6">
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

          <div className="bg-white rounded-lg border border-stone-300/20 p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-300/20 border border-stone-300/20 rounded-lg">
                <thead className="bg-stone-50 border-b border-stone-300/20">
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
                <tbody className="bg-white divide-y divide-stone-300/20">
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
    </div>
  );
}

