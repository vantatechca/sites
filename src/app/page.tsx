import Link from "next/link";
import {
  Hammer,
  ArrowRight,
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute right-1/3 top-1/2 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      {/* Top nav */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-200">
            <Hammer className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">
            SiteForge
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white/60 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-500 hover:shadow-lg"
          >
            Create account
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/60 px-3 py-1 text-[11px] font-medium text-indigo-700 shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3 w-3" />
          AI-powered project management for agencies
        </div>

        <h1 className="mt-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
          Build, track, and{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            delight clients
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
          The all-in-one platform for digital agencies — manage projects,
          collaborate with clients, and deliver beautiful websites faster than ever.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-500 hover:shadow-xl"
          >
            Get started — it&apos;s free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-6 py-3 text-sm font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
          >
            Sign in to existing account
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          No credit card required · Free during demo period
        </p>

        {/* Feature cards */}
        <div className="mt-20 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: LayoutDashboard,
              title: "Beautiful Dashboards",
              description:
                "Track every project from intake to launch with intuitive visualizations.",
              color: "from-indigo-500 to-blue-500",
            },
            {
              icon: MessageSquare,
              title: "Client Collaboration",
              description:
                "Branded portals where clients view progress, approve work, and chat with your team.",
              color: "from-violet-500 to-fuchsia-500",
            },
            {
              icon: TrendingUp,
              title: "Smart Analytics",
              description:
                "AI-powered insights help you spot bottlenecks and ship projects on time.",
              color: "from-emerald-500 to-teal-500",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/40 bg-white/60 p-6 text-left shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/80 hover:shadow-lg"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-md`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/50 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-gray-500">
          <p>© 2026 SiteForge. Crafted for modern agencies.</p>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="hover:text-gray-700">
              Sign in
            </Link>
            <Link href="/sign-up" className="hover:text-gray-700">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
