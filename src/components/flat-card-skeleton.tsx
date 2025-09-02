export default function FlatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-gray-200" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        
        {/* Price skeleton */}
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        
        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-16" />
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-6 bg-gray-200 rounded w-14" />
        </div>
        
        {/* Buttons skeleton */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-gray-200 rounded flex-1" />
          <div className="h-8 bg-gray-200 rounded flex-1" />
        </div>
      </div>
    </div>
  )
}