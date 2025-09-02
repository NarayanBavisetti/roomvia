export default function FlatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[5/3] bg-gray-50 relative">
        {/* Room type badge skeleton */}
        <div className="absolute top-3 left-3">
          <div className="h-4 w-12 bg-gray-300 rounded-full" />
        </div>
        {/* Save button skeleton */}
        <div className="absolute top-3 right-3">
          <div className="h-7 w-7 bg-gray-300 rounded-lg" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-3 space-y-2.5">
        {/* Title and location skeleton */}
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="flex items-center space-x-1.5">
            <div className="h-3 w-3 bg-gray-200 rounded-full" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        
        {/* Price skeleton */}
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        
        {/* Tags skeleton */}
        <div className="flex gap-1">
          <div className="h-5 bg-purple-100 rounded-full w-12" />
          <div className="h-5 bg-purple-100 rounded-full w-16" />
          <div className="h-5 bg-purple-100 rounded-full w-10" />
        </div>
        
        {/* Buttons skeleton */}
        <div className="flex gap-2">
          <div className="h-7 bg-purple-100 rounded-lg flex-1" />
          <div className="h-7 bg-gray-200 rounded-lg flex-1" />
        </div>
      </div>
    </div>
  )
}