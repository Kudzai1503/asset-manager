import Skeleton from "./Skeleton";

interface CardGridSkeletonProps {
  count?: number;
}

export default function CardGridSkeleton({ count = 6 }: CardGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 border border-stone-200 rounded-lg bg-white"
        >
          <Skeleton variant="text" width="80%" height={20} />
        </div>
      ))}
    </div>
  );
}

