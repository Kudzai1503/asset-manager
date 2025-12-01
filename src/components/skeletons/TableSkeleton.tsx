import Skeleton from "./Skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-stone-50 border-b border-stone-200 px-6 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" height={16} width="20%" />
          ))}
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-stone-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} variant="text" height={20} width="20%" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

