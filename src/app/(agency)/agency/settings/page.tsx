"use client"

import { useState, useCallback } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  Loader2,
  Paintbrush,
  ListChecks,
  Users,
  GitBranch,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Clock,
  Bell,
  Globe,
} from "lucide-react"
import { toast } from "sonner"
import { PROJECT_STATUS_MAP } from "@/types"
import type { ProjectStatus } from "@/types"
import { BrandingSettings } from "@/components/agency/branding-settings"
import { TemplateEditor } from "@/components/agency/template-editor"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamSettingsData {
  defaultTimezone: string
  checkinReminderTime: string
  autoAssignment: boolean
  autoAssignByDepartment: boolean
  autoAssignByCapacity: boolean
  notifications: {
    checkinReminder: boolean
    newProjectAssignment: boolean
    blockerAlert: boolean
    clientMessage: boolean
    taskOverdue: boolean
  }
}

interface PipelineStageConfig {
  id: string
  status: ProjectStatus
  label: string
  clientLabel: string
  expectedDays: number
}

interface ChecklistTemplateListItem {
  id: string
  name: string
  version: number
  taskCount: number
  isActive: boolean
}

// ---------------------------------------------------------------------------
// Timezone options
// ---------------------------------------------------------------------------

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
]

// ---------------------------------------------------------------------------
// Team Settings Tab
// ---------------------------------------------------------------------------

function TeamSettingsTab() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<TeamSettingsData>({
    defaultTimezone: "America/New_York",
    checkinReminderTime: "09:00",
    autoAssignment: true,
    autoAssignByDepartment: true,
    autoAssignByCapacity: true,
    notifications: {
      checkinReminder: true,
      newProjectAssignment: true,
      blockerAlert: true,
      clientMessage: true,
      taskOverdue: true,
    },
  })

  const updateField = useCallback(
    <K extends keyof TeamSettingsData>(key: K, value: TeamSettingsData[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const updateNotification = useCallback(
    (key: keyof TeamSettingsData["notifications"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: value },
      }))
    },
    []
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      toast.success("Team settings saved")
    } catch {
      toast.error("Failed to save team settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* General */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
            <Globe className="size-4" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Default Timezone</Label>
              <select
                value={settings.defaultTimezone}
                onChange={(e) =>
                  updateField("defaultTimezone", e.target.value)
                }
                className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Check-in Reminder Time</Label>
              <Input
                type="time"
                value={settings.checkinReminderTime}
                onChange={(e) =>
                  updateField("checkinReminderTime", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-assignment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
            <Users className="size-4" />
            Auto-Assignment Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#1A1A2E]">
                Enable Auto-Assignment
              </p>
              <p className="text-[10px] text-muted-foreground">
                Automatically assign tasks to team members based on rules
              </p>
            </div>
            <Switch
              checked={settings.autoAssignment}
              onCheckedChange={(checked) =>
                updateField("autoAssignment", !!checked)
              }
            />
          </div>

          {settings.autoAssignment && (
            <div className="space-y-3 pl-4 border-l-2 border-[#2D5A8C]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#1A1A2E]">Match by Department</p>
                  <p className="text-[10px] text-muted-foreground">
                    Assign design tasks to designers, dev tasks to developers
                  </p>
                </div>
                <Switch
                  size="sm"
                  checked={settings.autoAssignByDepartment}
                  onCheckedChange={(checked) =>
                    updateField("autoAssignByDepartment", !!checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#1A1A2E]">Balance by Capacity</p>
                  <p className="text-[10px] text-muted-foreground">
                    Prefer members with fewer active projects
                  </p>
                </div>
                <Switch
                  size="sm"
                  checked={settings.autoAssignByCapacity}
                  onCheckedChange={(checked) =>
                    updateField("autoAssignByCapacity", !!checked)
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
            <Bell className="size-4" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              {
                key: "checkinReminder" as const,
                label: "Daily Check-in Reminder",
                desc: "Remind team to submit daily check-ins",
              },
              {
                key: "newProjectAssignment" as const,
                label: "New Project Assignment",
                desc: "Notify when assigned to a new project",
              },
              {
                key: "blockerAlert" as const,
                label: "Blocker Alerts",
                desc: "Alert managers when blockers are reported",
              },
              {
                key: "clientMessage" as const,
                label: "Client Messages",
                desc: "Notify on new client messages",
              },
              {
                key: "taskOverdue" as const,
                label: "Overdue Tasks",
                desc: "Alert when tasks pass their due date",
              },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1A1A2E]">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.desc}
                </p>
              </div>
              <Switch
                size="sm"
                checked={settings.notifications[item.key]}
                onCheckedChange={(checked) =>
                  updateNotification(item.key, !!checked)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="size-4 mr-1 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="size-4 mr-1" />
            Save Team Settings
          </>
        )}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pipeline Configuration Tab
// ---------------------------------------------------------------------------

function PipelineConfigTab() {
  const [saving, setSaving] = useState(false)
  const [stages, setStages] = useState<PipelineStageConfig[]>([
    {
      id: "s1",
      status: "intake",
      label: "Intake",
      clientLabel: "Getting Started",
      expectedDays: 2,
    },
    {
      id: "s2",
      status: "requirements",
      label: "Requirements",
      clientLabel: "Gathering Your Info",
      expectedDays: 3,
    },
    {
      id: "s3",
      status: "design",
      label: "Design",
      clientLabel: "Designing Your Store",
      expectedDays: 7,
    },
    {
      id: "s4",
      status: "development",
      label: "Development",
      clientLabel: "Building Your Store",
      expectedDays: 10,
    },
    {
      id: "s5",
      status: "content",
      label: "Content",
      clientLabel: "Adding Content",
      expectedDays: 5,
    },
    {
      id: "s6",
      status: "review_internal",
      label: "Internal Review",
      clientLabel: "Quality Check",
      expectedDays: 2,
    },
    {
      id: "s7",
      status: "client_review",
      label: "Client Review",
      clientLabel: "Ready for Your Review",
      expectedDays: 3,
    },
    {
      id: "s8",
      status: "revisions",
      label: "Revisions",
      clientLabel: "Making Your Changes",
      expectedDays: 3,
    },
    {
      id: "s9",
      status: "final_qa",
      label: "Final QA",
      clientLabel: "Final Polish",
      expectedDays: 2,
    },
    {
      id: "s10",
      status: "launch_prep",
      label: "Launch Prep",
      clientLabel: "Preparing to Launch",
      expectedDays: 1,
    },
    {
      id: "s11",
      status: "launched",
      label: "Launched",
      clientLabel: "Your Store is Live!",
      expectedDays: 0,
    },
    {
      id: "s12",
      status: "post_launch",
      label: "Post-Launch",
      clientLabel: "Post-Launch Support",
      expectedDays: 0,
    },
  ])

  const updateStage = useCallback(
    (
      index: number,
      field: keyof PipelineStageConfig,
      value: string | number
    ) => {
      setStages((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], [field]: value }
        return updated
      })
    },
    []
  )

  const moveStage = useCallback(
    (index: number, direction: "up" | "down") => {
      setStages((prev) => {
        const arr = [...prev]
        const targetIndex = direction === "up" ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= arr.length) return prev
        ;[arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]]
        return arr
      })
    },
    []
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stages }),
      })
      toast.success("Pipeline configuration saved")
    } catch {
      toast.error("Failed to save pipeline configuration")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-xs text-muted-foreground">
        Configure pipeline stages, client-facing labels, and expected durations.
      </p>

      <Card>
        <CardContent className="overflow-x-auto pt-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-2 font-medium w-8"></th>
                <th className="text-left py-2 px-2 font-medium">
                  Stage Name
                </th>
                <th className="text-left py-2 px-2 font-medium">
                  Client-Facing Label
                </th>
                <th className="text-right py-2 px-2 font-medium w-28">
                  Expected Days
                </th>
              </tr>
            </thead>
            <tbody>
              {stages.map((stage, index) => (
                <tr
                  key={stage.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="py-2 px-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveStage(index, "up")}
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-[#1A1A2E] disabled:opacity-30"
                      >
                        <ChevronUp className="size-3" />
                      </button>
                      <GripVertical className="size-3 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => moveStage(index, "down")}
                        disabled={index === stages.length - 1}
                        className="text-muted-foreground hover:text-[#1A1A2E] disabled:opacity-30"
                      >
                        <ChevronDown className="size-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={stage.label}
                      onChange={(e) =>
                        updateStage(index, "label", e.target.value)
                      }
                      className="text-xs h-7"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={stage.clientLabel}
                      onChange={(e) =>
                        updateStage(index, "clientLabel", e.target.value)
                      }
                      className="text-xs h-7"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1 justify-end">
                      <Input
                        type="number"
                        min={0}
                        value={stage.expectedDays}
                        onChange={(e) =>
                          updateStage(
                            index,
                            "expectedDays",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="text-xs h-7 w-16 text-right"
                      />
                      <span className="text-muted-foreground">d</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Total expected duration:{" "}
          {stages.reduce((s, st) => s + st.expectedDays, 0)} days
        </span>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <>
              <Loader2 className="size-3 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-3 mr-1" />
              Save Pipeline
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Checklist Templates Tab
// ---------------------------------------------------------------------------

function ChecklistTemplatesTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [templates] = useState<ChecklistTemplateListItem[]>([
    {
      id: "tpl_1",
      name: "Default Build Checklist",
      version: 3,
      taskCount: 24,
      isActive: true,
    },
    {
      id: "tpl_2",
      name: "Quick Launch Template",
      version: 1,
      taskCount: 12,
      isActive: true,
    },
    {
      id: "tpl_3",
      name: "Enterprise Full Service",
      version: 2,
      taskCount: 42,
      isActive: false,
    },
  ])

  if (selectedTemplate) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setSelectedTemplate(null)}
          >
            &larr; Back to Templates
          </Button>
        </div>
        <TemplateEditor />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Manage checklist templates used when creating new projects.
        </p>
        <Button size="sm">
          <Plus className="size-3 mr-1" />
          Create New Template
        </Button>
      </div>

      <div className="space-y-2">
        {templates.map((tpl) => (
          <Card
            key={tpl.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedTemplate(tpl.id)}
          >
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <ListChecks className="size-5 text-[#2D5A8C]" />
                <div>
                  <p className="text-sm font-medium text-[#1A1A2E]">
                    {tpl.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    v{tpl.version} &middot; {tpl.taskCount} tasks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    tpl.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tpl.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A2E]">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your agency preferences and workflows
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={0}>
        <TabsList variant="line">
          <TabsTrigger value={0}>
            <Paintbrush className="size-3.5 mr-1.5" />
            Branding
          </TabsTrigger>
          <TabsTrigger value={1}>
            <ListChecks className="size-3.5 mr-1.5" />
            Checklist Templates
          </TabsTrigger>
          <TabsTrigger value={2}>
            <Users className="size-3.5 mr-1.5" />
            Team Settings
          </TabsTrigger>
          <TabsTrigger value={3}>
            <GitBranch className="size-3.5 mr-1.5" />
            Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value={0} className="mt-6">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value={1} className="mt-6">
          <ChecklistTemplatesTab />
        </TabsContent>

        <TabsContent value={2} className="mt-6">
          <TeamSettingsTab />
        </TabsContent>

        <TabsContent value={3} className="mt-6">
          <PipelineConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
