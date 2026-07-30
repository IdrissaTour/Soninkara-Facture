export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fadeIn p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      {/* Banner Skeleton */}
      <div className="h-44 w-full rounded-3xl bg-slate-200 animate-pulse" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>

      {/* Chart & Activity Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}
