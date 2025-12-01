import { Skeleton, TableSkeleton } from "./";

export default function UserDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width={150} height={32} />
        <Skeleton variant="rectangular" width={140} height={40} />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}

