import { useState, useEffect } from "react";
import Button from "@/components/buttons/Button";
import Input from "@/components/inputs/Input";
import { UserDashboardSkeleton } from "@/components/skeletons";
import AssetDetailsModal from "@/components/modals/AssetDetailsModal";

type Asset = {
  id: string;
  name: string;
  category: string;
  department: string;
  date_purchased: string;
  cost: number;
};

type Category = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

interface UserDashboardProps {
  userId: string;
}

export default function UserDashboard( ) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetDetails, setShowAssetDetails] = useState(false);

  // Form state
  const [assetName, setAssetName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [datePurchased, setDatePurchased] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadAssets(), loadCategories(), loadDepartments()]);
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

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!assetName || !selectedCategory || !selectedDepartment || !datePurchased || !cost) {
      setError("Please fill in all fields");
      return;
    }

    const token = localStorage.getItem("access_token");
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: assetName,
        category_id: selectedCategory,
        department_id: selectedDepartment,
        date_purchased: datePurchased,
        cost: parseFloat(cost),
      }),
    });

    if (response.ok) {
      // Reset form
      setAssetName("");
      setSelectedCategory("");
      setSelectedDepartment("");
      setDatePurchased("");
      setCost("");
      setShowCreateForm(false);
      loadAssets();
    } else {
      const data = await response.json();
      setError(data.message || "Failed to create asset");
    }
  };

  const handleViewAssetDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetDetails(true);
  };

  const handleRegisterWarranty = async (assetId: string) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch("/api/warranties/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        asset_id: assetId,
        owner_phone: "",
        warranty_period_months: 12,
        serial_number: assetId, // Use asset ID as serial number
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to register warranty");
    }

    // Reload assets after warranty registration
    loadAssets();
  };

  if (isLoading) {
    return <UserDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-stone-800">My Assets</h2>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => window.location.href = '/warranty-centre'}
          >
            Warranty Centre
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : "Create Asset"}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg border border-stone-300/20 p-6">
          <h3 className="text-lg font-semibold text-stone-800 mb-4">
            Create New Asset
          </h3>
          {error && (
            <div className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <Input
              label="Asset Name"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Enter asset name"
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                required
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Date Purchased"
              type="date"
              value={datePurchased}
              onChange={(e) => setDatePurchased(e.target.value)}
              required
            />
            <Input
              label="Cost"
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              required
            />
            <Button type="submit" variant="primary" fullWidth>
              Create Asset
            </Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-stone-300/20 p-6">
        {assets.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <p>No assets found. Create your first asset to get started.</p>
          </div>
        ) : (
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-300/20">
                {assets.map((asset) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewAssetDetails(asset)}
                        className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssetDetailsModal
        asset={selectedAsset}
        isOpen={showAssetDetails}
        onClose={() => {
          setShowAssetDetails(false);
          setSelectedAsset(null);
        }}
        onRegisterWarranty={handleRegisterWarranty}
      />
    </div>
  );
}

