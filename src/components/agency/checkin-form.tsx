"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  Send,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ThumbsUp,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import { useMyProjectContext, useSubmitCheckin } from "@/hooks/use-checkins"
import type { CheckinResult } from "@/hooks/use-checkins"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_CHARS = 2000

function statusBadgeColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700"
    case "in_progress":
      return "bg-blue-100 text-blue-700"
    case "blocked":
      return "bg-red-100 text-red-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

// ---------------------------------------------------------------------------
// AI Processing Animation
// ---------------------------------------------------------------------------

function ProcessingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative">
        <div className="size-16 rounded-full border-4 border-[#2D5A8C]/20 border-t-[#2D5A8C] animate-spin" />
        <Sparkles className="absolute inset-0 m-auto size-6 text-[#2D5A8C]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[#1A1A2E]">
          AI is processing your check-in...
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Extracting tasks, hours, and blockers
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Result Card
// ---------------------------------------------------------------------------

function AIResultCard({
  result,
  onAccept,
  onCorrect,
}: {
  result: CheckinResult
  onAccept: () => void
  onCorrect: () => void
}) {
  return (
    <Card className="border-[#2D5A8C]/20 bg-blue-50/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#2D5A8C]" />
          <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
            AI-Processed Check-In
          </CardTitle>
          <span
            className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              result.confidenceScore >= 0.9
                ? "bg-emerald-100 text-emerald-700"
                : result.confidenceScore >= 0.7
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {Math.round(result.confidenceScore * 100)}% confidence
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Summary
          </p>
          <p className="text-sm text-[#1A1A2E]">{result.summary}</p>
        </div>

        {/* Task updates */}
        {result.taskUpdates.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Tasks Auto-Updated ({result.taskUpdates.length})
            </p>
            <div className="space-y-1.5">
              {result.taskUpdates.map((update) => (
                <div
                  key={update.taskId}
                  className="flex items-center gap-2 text-xs bg-white rounded-lg px-3 py-2 border"
                >
                  <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                  <span className="text-[#1A1A2E] font-medium flex-1">
                    {update.taskTitle}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 ${statusBadgeColor(update.previousStatus)}`}>
                    {update.previousStatus.replace(/_/g, " ")}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className={`rounded px-1.5 py-0.5 ${statusBadgeColor(update.newStatus)}`}>
                    {update.newStatus.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hours */}
        {result.hoursLogged !== null && (
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Hours Logged:
            </p>
            <span className="text-sm font-semibold text-[#1A1A2E]">
              {result.hoursLogged}h
            </span>
          </div>
        )}

        {/* Blockers */}
        {result.blockers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Blockers Detected
            </p>
            <div className="space-y-1.5">
              {result.blockers.map((blocker, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs bg-amber-50 rounded-lg px-3 py-2 border border-amber-200"
                >
                  <AlertTriangle className="size-3 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-amber-800">{blocker}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button size="sm" onClick={onAccept}>
            <ThumbsUp className="size-3 mr-1" />
            Looks Correct
          </Button>
          <Button variant="outline" size="sm" onClick={onCorrect}>
            <Pencil className="size-3 mr-1" />
            Make Corrections
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Form
// ---------------------------------------------------------------------------

interface CheckinFormProps {
  onComplete?: () => void
}

export function CheckinForm({ onComplete }: CheckinFormProps) {
  const { data: projects = [], isLoading: loadingContext } =
    useMyProjectContext()
  const submitCheckin = useSubmitCheckin()
  const [response, setResponse] = useState("")
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const handleSubmit = async () => {
    if (!response.trim()) return

    setIsProcessing(true)
    try {
      const checkinResult = await submitCheckin.mutateAsync({
        response: response.trim(),
      })
      setResult(checkinResult)
    } catch (err) {
      // Surface real errors so users can see what went wrong
      const message =
        err instanceof Error ? err.message : "Failed to submit check-in"
      toast.error(message)
    } finally {
      setIsProcessing(false)
    }
  }
    if (isProcessing) {
    return <ProcessingAnimation />
  }

  if (accepted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1A1A2E]">
              Check-in submitted
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Thanks! Your daily check-in has been accepted.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAccepted(false)
              setResult(null)
              setResponse("")
            }}
          >
            Submit another update
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (result) {
    const current = result
    return (
      <AIResultCard
        result={current}
        onAccept={() => {
          setAccepted(true)
          onComplete?.()
        }}
        onCorrect={() => {
          setResult(null)
        }}
      />
    )
  }


  return (
    <Card className="border-[#2D5A8C]/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
          Your Daily Check-In
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          You&apos;re assigned to {projects.length} active project
          {projects.length !== 1 ? "s" : ""}. Here&apos;s where each stands:
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project context */}
        {loadingContext ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((proj) => (
              <div
                key={proj.projectId}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <FolderKanban className="size-4 text-[#2D5A8C] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1A1A2E] truncate">
                    {proj.projectName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {proj.currentPhase} &middot; {proj.completedTaskCount}/
                    {proj.taskCount} tasks &middot; {proj.recentActivity}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {proj.currentPhase}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Text area */}
        <div className="space-y-1.5">
          <Textarea
            placeholder="What did you work on today? Any blockers?"
            value={response}
            onChange={(e) =>
              setResponse(e.target.value.slice(0, MAX_CHARS))
            }
            className="min-h-32 resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {response.length}/{MAX_CHARS} characters
            </span>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!response.trim() || submitCheckin.isPending}
          className="w-full"
        >
          {submitCheckin.isPending ? (
            <>
              <Loader2 className="size-4 mr-1 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="size-4 mr-1" />
              Submit Check-In
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
