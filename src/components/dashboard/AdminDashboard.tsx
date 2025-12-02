import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Button from "@/components/buttons/Button";
import Input from "@/components/inputs/Input";
import { AdminDashboardSkeleton } from "@/components/skeletons";
import { useToast } from "@/context/ToastContext";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

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
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Edit states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Loading states for delete operations
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});
  const [modalConfig, setModalConfig] = useState({
    title: 'Confirm Action',
    message: 'Are you sure you want to perform this action?',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  
  const pendingAction = useRef<{ type: string; id: string } | null>(null);
  
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

  const { addToast } = useToast();
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      addToast('Category name cannot be empty', 'error');
      return;
    }
    
    const token = localStorage.getItem("access_token");
    setIsCreatingCategory(true);
    
    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategory }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewCategory("");
        setShowCategoryForm(false);
        setEditingCategory(null);
        loadCategories();
        addToast(
          editingCategory 
            ? 'Category updated successfully' 
            : 'Category created successfully', 
          'success'
        );
      } else {
        addToast(data.message || 'Failed to save category', 'error');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      addToast('An error occurred while saving the category', 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };
  
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory(category.name);
    setShowCategoryForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    setModalConfig({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    pendingAction.current = { type: 'deleteCategory', id: categoryId };
    setShowConfirmModal(true);
  };
  
  const executePendingAction = async () => {
    if (!pendingAction.current) return;
    
    const { type, id } = pendingAction.current;
    const token = localStorage.getItem("access_token");
    
    try {
      switch (type) {
        case 'deleteCategory':
          setDeletingCategoryId(id);
          const categoryResponse = await fetch(`/api/categories/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (categoryResponse.ok) {
            addToast('Category deleted successfully', 'success');
            loadCategories();
          } else {
            const data = await categoryResponse.json();
            addToast(data.message || 'Failed to delete category', 'error');
          }
          setDeletingCategoryId(null);
          break;
          
        case 'deleteDepartment':
          setDeletingDepartmentId(id);
          const deptResponse = await fetch(`/api/departments/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (deptResponse.ok) {
            addToast('Department deleted successfully', 'success');
            loadDepartments();
          } else {
            const data = await deptResponse.json();
            addToast(data.message || 'Failed to delete department', 'error');
          }
          setDeletingDepartmentId(null);
          break;
          
        case 'deleteUser':
          setDeletingUserId(id);
          const userResponse = await fetch(`/api/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (userResponse.ok) {
            addToast('User deleted successfully', 'success');
            loadUsers();
          } else {
            const data = await userResponse.json();
            addToast(data.message || 'Failed to delete user', 'error');
          }
          setDeletingUserId(null);
          break;
          
        case 'deleteAsset':
          setDeletingAssetId(id);
          const assetResponse = await fetch(`/api/assets/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (assetResponse.ok) {
            addToast('Asset deleted successfully', 'success');
            loadAssets();
          } else {
            const data = await assetResponse.json();
            addToast(data.message || 'Failed to delete asset', 'error');
          }
          setDeletingAssetId(null);
          break;
      }
    } catch (error) {
      console.error(`Error in ${type}:`, error);
      addToast(`An error occurred while processing your request`, 'error');
    } finally {
      pendingAction.current = null;
    }
  };
  
  const handleConfirm = () => {
    setShowConfirmModal(false);
    executePendingAction();
  };
  
  const handleCancel = () => {
    setShowConfirmModal(false);
    pendingAction.current = null;
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.trim()) {
      addToast('Department name cannot be empty', 'error');
      return;
    }
    
    const token = localStorage.getItem("access_token");
    setIsCreatingDepartment(true);
    
    try {
      const url = editingDepartment
        ? `/api/departments/${editingDepartment.id}`
        : '/api/departments';
      const method = editingDepartment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newDepartment }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewDepartment("");
        setShowDepartmentForm(false);
        setEditingDepartment(null);
        loadDepartments();
        addToast(
          editingDepartment 
            ? 'Department updated successfully' 
            : 'Department created successfully', 
          'success'
        );
      } else {
        addToast(data.message || 'Failed to save department', 'error');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      addToast('An error occurred while saving the department', 'error');
    } finally {
      setIsCreatingDepartment(false);
    }
  };
  
  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setNewDepartment(department.name);
    setShowDepartmentForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDeleteDepartment = (departmentId: string) => {
    setModalConfig({
      title: 'Delete Department',
      message: 'Are you sure you want to delete this department? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    pendingAction.current = { type: 'deleteDepartment', id: departmentId };
    setShowConfirmModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newUserName.trim()) {
      addToast('Name cannot be empty', 'error');
      return;
    }
    if (!newUserEmail.trim()) {
      addToast('Email cannot be empty', 'error');
      return;
    }
    if (!editingUser && !newUserPassword) {
      addToast('Password cannot be empty', 'error');
      return;
    }
    
    const token = localStorage.getItem("access_token");
    setIsCreatingUser(true);
    
    try {
      const url = editingUser 
        ? `/api/users/${editingUser.id}`
        : '/api/users/create';
      const method = editingUser ? 'PUT' : 'POST';
      
      const userData: any = {
        name: newUserName,
        email: newUserEmail,
        userType: newUserType,
      };
      
      // Only include password for new users or if it's being updated
      if (!editingUser || newUserPassword) {
        userData.password = newUserPassword;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserType("user");
        setShowUserForm(false);
        setEditingUser(null);
        loadUsers();
        addToast(
          editingUser 
            ? 'User updated successfully' 
            : 'User created successfully', 
          'success'
        );
      } else {
        addToast(data.message || `Failed to ${editingUser ? 'update' : 'create'} user`, 'error');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      addToast(`An error occurred while ${editingUser ? 'updating' : 'creating'} the user`, 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUserName(user.name);
    setNewUserEmail(user.email);
    setNewUserType(user.user_type as any);
    setNewUserPassword('');
    setShowUserForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDeleteUser = (userId: string) => {
    setModalConfig({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    pendingAction.current = { type: 'deleteUser', id: userId };
    setShowConfirmModal(true);
  };
  
  const resetUserForm = () => {
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserType("user");
    setEditingUser(null);
    setShowUserForm(false);
  };

  const [isDeletingAsset, setIsDeletingAsset] = useState<string | null>(null);

  const handleDeleteAsset = (assetId: string) => {
    setModalConfig({
      title: 'Delete Asset',
      message: 'Are you sure you want to delete this asset? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    pendingAction.current = { type: 'deleteAsset', id: assetId };
    setShowConfirmModal(true);
  };

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmationModal
        isOpen={showConfirmModal}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-stone-800">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h4>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setNewCategory('');
                  }}
                  className="text-stone-500 hover:text-stone-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <Input
                  label="Category Name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  required
                  autoFocus
                />
                <div className="flex space-x-3">
                  <Button 
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isCreatingCategory}
                  >
                    {isCreatingCategory 
                      ? (editingCategory ? 'Updating...' : 'Creating...') 
                      : (editingCategory ? 'Update Category' : 'Create Category')}
                  </Button>
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditingCategory(null);
                      setNewCategory('');
                    }}
                    disabled={isCreatingCategory}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg border border-stone-300/20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length === 0 ? (
                <div className="col-span-full py-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-stone-900">No categories</h3>
                  <p className="mt-1 text-sm text-stone-500">Get started by creating a new category.</p>
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="group relative p-4 border border-stone-200 rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <h4 className="font-medium text-stone-800 pr-8">{category.name}</h4>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-1 text-stone-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        title="Edit category"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deletingCategoryId === category.id}
                        className="p-1 text-stone-500 hover:text-red-600 rounded-full hover:bg-red-50 ml-1"
                        title="Delete category"
                      >
                        {deletingCategoryId === category.id ? (
                          <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
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
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-stone-800">
                  {editingDepartment ? 'Edit Department' : 'Create New Department'}
                </h4>
                <button
                  onClick={() => {
                    setShowDepartmentForm(false);
                    setEditingDepartment(null);
                    setNewDepartment('');
                  }}
                  className="text-stone-500 hover:text-stone-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <Input
                  label="Department Name"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Enter department name"
                  required
                  autoFocus
                />
                <div className="flex space-x-3">
                  <Button 
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isCreatingDepartment}
                  >
                    {isCreatingDepartment 
                      ? (editingDepartment ? 'Updating...' : 'Creating...') 
                      : (editingDepartment ? 'Update Department' : 'Create Department')}
                  </Button>
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowDepartmentForm(false);
                      setEditingDepartment(null);
                      setNewDepartment('');
                    }}
                    disabled={isCreatingDepartment}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg border border-stone-300/20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.length === 0 ? (
                <div className="col-span-full py-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-stone-900">No departments</h3>
                  <p className="mt-1 text-sm text-stone-500">Get started by creating a new department.</p>
                </div>
              ) : (
                departments.map((department) => (
                  <div
                    key={department.id}
                    className="group relative p-4 border border-stone-200 rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <h4 className="font-medium text-stone-800 pr-8">{department.name}</h4>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditDepartment(department)}
                        className="p-1 text-stone-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                        title="Edit department"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department.id)}
                        disabled={deletingDepartmentId === department.id}
                        className="p-1 text-stone-500 hover:text-red-600 rounded-full hover:bg-red-50 ml-1"
                        title="Delete department"
                      >
                        {deletingDepartmentId === department.id ? (
                          <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
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
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-stone-800">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h4>
                <button
                  onClick={resetUserForm}
                  className="text-stone-500 hover:text-stone-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <Input
                  label="Full Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                  required
                  autoFocus
                />
                <Input
                  label="Email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  disabled={!!editingUser}
                />
                <Input
                  label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  required={!editingUser}
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
                <div className="flex space-x-3 pt-2">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="flex-1"
                    disabled={isCreatingUser}
                  >
                    {isCreatingUser 
                      ? (editingUser ? 'Updating...' : 'Creating...') 
                      : (editingUser ? 'Update User' : 'Create User')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={resetUserForm}
                    disabled={isCreatingUser}
                  >
                    Cancel
                  </Button>
                </div>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-300/20">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-stone-50 group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-stone-900">{user.name}</div>
                            <div className="text-stone-500 text-xs">
                              {user.user_type === 'admin' ? 'Administrator' : 'Standard User'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.user_type === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.user_type === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-stone-500 hover:text-blue-600"
                            title="Edit user"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            className="text-stone-500 hover:text-red-600"
                            title="Delete user"
                          >
                            {deletingUserId === user.id ? (
                              <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
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
