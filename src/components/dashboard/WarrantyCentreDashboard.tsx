import { useState, useEffect } from "react";
import Button from "@/components/buttons/Button";

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

export default function WarrantyCentreDashboard() {
  const [devices, setDevices] = useState<WarrantyDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/warranties/devices");
      if (!response.ok) {
        throw new Error("Failed to fetch warranty devices");
      }

      const data = await response.json();
      setDevices(data.devices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDevices = devices.filter(
    (device) =>
      device.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.owner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWarrantyStatus = (registrationDate: string, warrantyMonths: number) => {
    const regDate = new Date(registrationDate);
    const expiryDate = new Date(regDate);
    expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);
    
    const now = new Date();
    const daysRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { status: "Expired", color: "text-red-600", bgColor: "bg-red-50" };
    } else if (daysRemaining < 30) {
      return { status: "Expiring Soon", color: "text-amber-600", bgColor: "bg-amber-50" };
    } else {
      return { status: "Active", color: "text-green-600", bgColor: "bg-green-50" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading warranty devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-stone-800">Registered Warranties</h2>
        <Button variant="primary" size="md" onClick={loadDevices}>
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-stone-300/20 p-4">
        <input
          type="text"
          placeholder="Search by product name, owner, email, or serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-stone-300 rounded-lg bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Devices Table */}
      <div className="bg-white rounded-lg border border-stone-300/20 p-6">
        {filteredDevices.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <p>
              {devices.length === 0
                ? "No warranty devices registered yet."
                : "No devices match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-300/20">
              <thead className="bg-stone-50 border-b border-stone-300/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Manufacturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Warranty Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-300/20">
                {filteredDevices.map((device) => {
                  const status = getWarrantyStatus(
                    device.registration_date,
                    device.warranty_period_months
                  );
                  return (
                    <tr key={device.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                        {device.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {device.manufacturer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {device.owner_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {device.owner_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-stone-500">
                        {device.serial_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {new Date(device.purchase_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {device.warranty_period_months} months
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${status.color}`}>
                        {status.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-stone-300/20 p-4">
          <p className="text-sm text-stone-600 mb-2">Total Registered</p>
          <p className="text-2xl font-bold text-stone-900">{devices.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-stone-300/20 p-4">
          <p className="text-sm text-stone-600 mb-2">Active Warranties</p>
          <p className="text-2xl font-bold text-green-600">
            {devices.filter(
              (d) =>
                new Date(d.registration_date).getTime() +
                  d.warranty_period_months * 30 * 24 * 60 * 60 * 1000 >
                new Date().getTime()
            ).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-stone-300/20 p-4">
          <p className="text-sm text-stone-600 mb-2">Expired Warranties</p>
          <p className="text-2xl font-bold text-red-600">
            {devices.filter(
              (d) =>
                new Date(d.registration_date).getTime() +
                  d.warranty_period_months * 30 * 24 * 60 * 60 * 1000 <=
                new Date().getTime()
            ).length}
          </p>
        </div>
      </div>
    </div>
  );
}
