import Skeleton from "./Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="space-y-2">
              <Skeleton variant="text" width={120} height={24} />
              <Skeleton variant="text" width={150} height={16} />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton variant="text" width={60} height={16} />
              <Skeleton variant="rectangular" width={80} height={36} />
            </div>
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton variant="text" width={200} height={32} />

        {/* Tabs Skeleton */}
        <div className="border-b border-stone-200">
          <div className="flex space-x-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="text" width={80} height={40} />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-stone-300/20 p-6">
          <div className="space-y-4">
            <Skeleton variant="text" width={150} height={24} />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton variant="text" width="25%" height={20} />
                  <Skeleton variant="text" width="25%" height={20} />
                  <Skeleton variant="text" width="25%" height={20} />
                  <Skeleton variant="text" width="25%" height={20} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

