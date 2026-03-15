export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 px-6 py-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-amber-950">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          Admin Area
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
          🛡️ Admin Dashboard
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Manage users, monitor token usage, and configure system settings. This section is under development.
        </p>
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 p-12 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            User management and analytics panels will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
