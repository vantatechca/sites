import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-6">
        <h1 className="text-6xl font-bold text-white tracking-tight mb-4">
          SITEFORGE
        </h1>
        <p className="text-[#2D5A8C] text-xl mb-2">
          Agency Website Builder, Project Tracker &amp; Branded Client Portal
        </p>
        <p className="text-gray-400 text-sm mb-12">
          Demo Mode — Explore the full application with mock data
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <Link
            href="/agency"
            className="group relative overflow-hidden rounded-xl bg-[#2D5A8C] px-6 py-4 text-white font-medium transition-all hover:bg-[#3A6FA0] hover:shadow-lg hover:shadow-[#2D5A8C]/20"
          >
            <div className="text-lg mb-1">Agency Dashboard</div>
            <div className="text-sm text-blue-200 opacity-80">
              Internal team view
            </div>
          </Link>

          <Link
            href="/portal/demo-project"
            className="group relative overflow-hidden rounded-xl bg-white/10 border border-white/20 px-6 py-4 text-white font-medium transition-all hover:bg-white/15 hover:shadow-lg"
          >
            <div className="text-lg mb-1">Client Portal</div>
            <div className="text-sm text-gray-300 opacity-80">
              Client-facing view
            </div>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: "Projects", value: "150" },
            { label: "Service Tiers", value: "3" },
            { label: "Team Size", value: "10-25" },
            { label: "Source Files", value: "124" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {[
            ["Dashboard", "/agency"],
            ["Projects", "/agency/projects"],
            ["Pipeline", "/agency/pipeline"],
            ["Team", "/agency/team"],
            ["Check-ins", "/agency/checkins"],
            ["Analytics", "/agency/analytics"],
            ["Settings", "/agency/settings"],
          ].map(([name, href]) => (
            <Link
              key={name}
              href={href}
              className="px-3 py-1.5 text-sm rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
