import { useState } from "react";
import Button from "@/components/buttons/Button";

interface Asset {
  id: string;
  name: string;
  category: string;
  department: string;
  date_purchased: string;
  cost: number;
}

interface AssetDetailsModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onRegisterWarranty: (assetId: string) => Promise<void>;
}

export default function AssetDetailsModal({
  asset,
  isOpen,
  onClose,
  onRegisterWarranty,
}: AssetDetailsModalProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen || !asset) {
    return null;
  }

  const handleRegisterWarranty = async () => {
    setError("");
    setSuccess(false);
    setIsRegistering(true);

    try {
      await onRegisterWarranty(asset.id);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register warranty");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-stone-800">Asset Details</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Asset Name
            </label>
            <p className="text-stone-800 font-medium">{asset.name}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <p className="text-stone-800">{asset.category}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <p className="text-stone-800">{asset.department}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Date Purchased
            </label>
            <p className="text-stone-800">
              {new Date(asset.date_purchased).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Cost
            </label>
            <p className="text-stone-800 font-medium">${asset.cost.toFixed(2)}</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
            Warranty registered successfully!
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isRegistering}
          >
            Close
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleRegisterWarranty}
            disabled={isRegistering || success}
          >
            {isRegistering ? "Registering..." : "Register Warranty"}
          </Button>
        </div>
      </div>
    </div>
  );
}
