"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Eye,
} from "lucide-react"
import { DEPARTMENT_LABELS } from "@/types"
import type { CheckinEntry } from "@/hooks/use-checkins"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        className: "bg-gray-100 text-gray-700",
      }
    case "submitted":
      return {
        label: "Submitted",
        className: "bg-blue-100 text-blue-700",
      }
    case "ai_processed":
      return {
        label: "AI Processed",
        className: "bg-purple-100 text-purple-700",
      }
    case "reviewed":
      return {
        label: "Reviewed",
        className: "bg-emerald-100 text-emerald-700",
      }
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
  }
}

function taskStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700"
    case "in_progress":
      return "bg-blue-100 text-blue-700"
    case "blocked":
      return "bg-red-100 text-red-700"
    case "not_started":
      return "bg-gray-100 text-gray-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CheckinCardProps {
  checkin: CheckinEntry
  onReview?: (id: string) => void
}

export function CheckinCard({ checkin, onReview }: CheckinCardProps) {
  const [expanded, setExpanded] = useState(false)
  const badge = statusBadge(checkin.status)
  const hasBlockers = checkin.blockers.length > 0

  return (
    <Card
      className={`transition-shadow duration-200 hover:shadow-md ${
        hasBlockers ? "border-l-4 border-l-red-400" : ""
      }`}
    >
      <CardContent className="space-y-3 pt-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar>
            {checkin.userAvatarUrl && (
              <AvatarImage
                src={checkin.userAvatarUrl}
                alt={checkin.userName}
              />
            )}
            <AvatarFallback>{initials(checkin.userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1A1A2E] truncate">
                {checkin.userName}
              </h3>
              {checkin.userDepartment && (
                <span className="text-[10px] text-muted-foreground">
                  {DEPARTMENT_LABELS[checkin.userDepartment]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatTime(checkin.submittedAt)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
              {hasBlockers && (
                <Badge variant="destructive" className="text-[10px]">
                  {checkin.blockers.length} Blocker
                  {checkin.blockers.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>

          {/* Confidence score */}
          {checkin.confidenceScore !== null && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                checkin.confidenceScore >= 0.9
                  ? "bg-emerald-100 text-emerald-700"
                  : checkin.confidenceScore >= 0.7
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {Math.round(checkin.confidenceScore * 100)}%
            </span>
          )}
        </div>

        {/* AI Summary */}
        {checkin.aiSummary && (
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="size-3 text-[#2D5A8C]" />
              <span className="text-[10px] font-medium text-[#2D5A8C]">
                AI Summary
              </span>
            </div>
            <p className="text-xs text-[#1A1A2E] leading-relaxed">
              {checkin.aiSummary}
            </p>
          </div>
        )}

        {/* Blockers */}
        {hasBlockers && (
          <div className="space-y-1.5">
            {checkin.blockers.map((blocker, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs bg-amber-50 rounded-lg px-3 py-2 border border-amber-200"
              >
                <AlertTriangle className="size-3 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-amber-800">{blocker}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expandable section */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-[#2D5A8C] hover:text-[#2D5A8C]/80 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="size-3" />
              Show details ({checkin.taskUpdates.length} task update
              {checkin.taskUpdates.length !== 1 ? "s" : ""}
              {checkin.hoursLogged ? `, ${checkin.hoursLogged}h logged` : ""})
            </>
          )}
        </button>

        {expanded && (
          <div className="space-y-3 pt-2 border-t">
            {/* Raw response */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                Raw Response
              </p>
              <p className="text-xs text-[#1A1A2E] bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                {checkin.rawResponse}
              </p>
            </div>

            {/* Task updates */}
            {checkin.taskUpdates.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-2">
                  Extracted Task Updates
                </p>
                <div className="space-y-1.5">
                  {checkin.taskUpdates.map((update) => (
                    <div
                      key={update.taskId}
                      className="flex items-center gap-2 text-xs bg-white rounded-lg px-3 py-2 border"
                    >
                      <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                      <span className="text-[#1A1A2E] font-medium flex-1 truncate">
                        {update.taskTitle}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${taskStatusColor(update.previousStatus)}`}
                      >
                        {update.previousStatus.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground">&rarr;</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${taskStatusColor(update.newStatus)}`}
                      >
                        {update.newStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hours logged */}
            {checkin.hoursLogged !== null && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground">
                  Hours Logged:
                </span>
                <span className="text-xs font-semibold text-[#1A1A2E]">
                  {checkin.hoursLogged}h
                </span>
              </div>
            )}

            {/* Review info */}
            {checkin.reviewedByName && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-200">
                <p className="text-[10px] font-medium text-emerald-700 mb-0.5">
                  Reviewed by {checkin.reviewedByName}
                </p>
                {checkin.reviewNotes && (
                  <p className="text-xs text-emerald-800">
                    {checkin.reviewNotes}
                  </p>
                )}
              </div>
            )}

            {/* Review action */}
            {checkin.status === "ai_processed" && onReview && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => onReview(checkin.id)}
              >
                <Eye className="size-3 mr-1" />
                Review Check-In
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
