import Link from "next/link";

const modules = [
  {
    title: "Sticker Generator",
    description:
      "Create stunning, print-ready stickers powered by AI. Describe your idea and watch it come to life.",
    href: "/sticker-generator",
    emoji: "🎨",
    status: "Active" as const,
    gradient: "from-violet-500 to-fuchsia-500",
    bgGradient:
      "from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  {
    title: "Mockup Generator",
    description:
      "Place your stickers on realistic product mockups — mugs, laptops, notebooks, and more.",
    href: "/mockup-generator",
    emoji: "📦",
    status: "Coming Soon" as const,
    gradient: "from-sky-500 to-cyan-500",
    bgGradient:
      "from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
  },
  {
    title: "Admin Dashboard",
    description:
      "Manage users, monitor token usage, and configure system-wide settings.",
    href: "/dashboard",
    emoji: "🛡️",
    status: "Coming Soon" as const,
    gradient: "from-amber-500 to-orange-500",
    bgGradient:
      "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  {
    title: "AMZ Content Curator",
    description:
      "Craft high-converting Amazon product listings with AI-optimized titles, bullets, and descriptions.",
    href: "/content-curator",
    emoji: "📝",
    status: "Active" as const,
    gradient: "from-orange-500 to-rose-500",
    bgGradient:
      "from-orange-50 to-rose-50 dark:from-orange-950/40 dark:to-rose-950/40",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 px-6 py-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Hero */}
      <header className="mb-16 max-w-2xl space-y-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
          AI Sticker Studio
        </h1>
        <p className="text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
          Your all-in-one platform for AI&#8209;powered sticker design,
          mockup generation, and creative workflow management.
        </p>
      </header>

      {/* Module Cards */}
      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className={`group relative flex flex-col rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${mod.bgGradient} ${mod.borderColor}`}
          >
            {/* Status Badge */}
            <span
              className={`mb-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                mod.status === "Active"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {mod.status === "Active" && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
              )}
              {mod.status}
            </span>

            {/* Content */}
            <span className="mb-2 text-3xl">{mod.emoji}</span>
            <h2 className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">
              {mod.title}
            </h2>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {mod.description}
            </p>

            {/* Arrow indicator */}
            <span className="mt-4 inline-flex items-center text-sm font-medium text-zinc-400 transition-colors group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
              Open module
              <svg
                className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
        Powered by Google Gemini AI &middot; Built with Next.js &amp; Tailwind CSS
      </footer>
    </div>
  );
}
