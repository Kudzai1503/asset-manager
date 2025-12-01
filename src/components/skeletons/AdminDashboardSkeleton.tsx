import Skeleton from "./Skeleton";
import TableSkeleton from "./TableSkeleton";

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width={200} height={32} />
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b border-stone-200">
        <div className="flex space-x-8">
          {["Assets", "Categories", "Departments", "Users"].map((tab, i) => (
            <Skeleton key={i} variant="text" width={100} height={40} />
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <TableSkeleton rows={5} columns={7} />
    </div>
  );
}

