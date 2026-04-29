"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Search,
} from "lucide-react"
import { DEPARTMENT_LABELS } from "@/types"
import type { Department } from "@/types"
import {
  useCheckins,
  useCheckinSummary,
  useMyCheckin,
} from "@/hooks/use-checkins"
import { CheckinForm } from "@/components/agency/checkin-form"
import { CheckinCard } from "@/components/agency/checkin-card"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEPARTMENTS: (Department | "all")[] = [
  "all",
  "design",
  "development",
  "content",
  "qa",
  "project_management",
]

const DEPT_LABELS: Record<string, string> = {
  all: "All",
  ...DEPARTMENT_LABELS,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CheckinsPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [filterDept, setFilterDept] = useState<Department | "all">("all")
  const [filterUser, setFilterUser] = useState("")
  const [showBlockersOnly, setShowBlockersOnly] = useState(false)

  const { data: checkins = [], isLoading } = useCheckins(selectedDate)
  const { data: summary } = useCheckinSummary(selectedDate)
  const { data: myCheckin } = useMyCheckin(selectedDate)

  const isToday = selectedDate === todayISO()
  const needsCheckin = isToday && !myCheckin

  // Filtered check-ins
  const filteredCheckins = useMemo(() => {
    let result = checkins

    if (filterDept !== "all") {
      result = result.filter((c) => c.userDepartment === filterDept)
    }

    if (filterUser) {
      const q = filterUser.toLowerCase()
      result = result.filter((c) => c.userName.toLowerCase().includes(q))
    }

    if (showBlockersOnly) {
      result = result.filter((c) => c.blockers.length > 0)
    }

    return result
  }, [checkins, filterDept, filterUser, showBlockersOnly])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">
            Daily Check-Ins
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track daily progress across the team
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-36 bg-transparent text-sm text-gray-900 outline-none focus:outline-none"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Users className="size-5 text-[#2D5A8C]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Checked In</p>
              <p className="text-lg font-semibold text-[#1A1A2E]">
                {summary?.checkedInCount ?? 0}
                <span className="text-sm font-normal text-muted-foreground">
                  /{summary?.totalTeamMembers ?? 0}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <AlertTriangle className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Blockers Reported
              </p>
              <p className="text-lg font-semibold text-[#1A1A2E]">
                {summary?.blockersReported ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tasks Updated</p>
              <p className="text-lg font-semibold text-[#1A1A2E]">
                {summary?.tasksUpdated ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check-in prompt (if user hasn't checked in today) */}
      {needsCheckin && (
        <CheckinForm
          onComplete={() => {
            /* refetch handled by mutation */
          }}
        />
      )}

      {/* Team Check-Ins Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#1A1A2E]">
            Team Check-Ins Feed
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter by name..."
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="pl-8 h-7 text-xs w-48"
              />
            </div>
            <div className="flex items-center gap-1">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setFilterDept(dept)}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                    filterDept === dept
                      ? "bg-[#2D5A8C] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {DEPT_LABELS[dept]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowBlockersOnly(!showBlockersOnly)}
              aria-pressed={showBlockersOnly}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                showBlockersOnly
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <AlertTriangle className="size-3" />
              Has Blockers
              {showBlockersOnly && (
                <span className="ml-0.5 rounded-full bg-white/25 px-1 text-[9px]">
                  {checkins.filter((c) => c.blockers.length > 0).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-28" />
              </Card>
            ))}
          </div>
        ) : filteredCheckins.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="size-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {checkins.length === 0
                  ? "No check-ins submitted yet for this date"
                  : "No check-ins match your filters"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCheckins.map((checkin) => (
              <CheckinCard
                key={checkin.id}
                checkin={checkin}
                onReview={(id) => {
                  /* review dialog would go here */
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
