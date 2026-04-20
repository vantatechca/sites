"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import type { ProjectTier } from "@/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateTask {
  id: string
  title: string
  description: string
  tiers: { basic: boolean; pro: boolean; enterprise: boolean }
  estimatedHours: number
  clientVisible: boolean
  isMilestone: boolean
  clientLabel: string
}

interface TemplatePhase {
  id: string
  title: string
  description: string
  tasks: TemplateTask[]
  collapsed: boolean
}

interface TemplateData {
  id: string
  name: string
  version: number
  phases: TemplatePhase[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0
function genId(): string {
  return `tmp_${Date.now()}_${++idCounter}`
}

function createTask(): TemplateTask {
  return {
    id: genId(),
    title: "",
    description: "",
    tiers: { basic: true, pro: true, enterprise: true },
    estimatedHours: 1,
    clientVisible: true,
    isMilestone: false,
    clientLabel: "",
  }
}

function createPhase(): TemplatePhase {
  return {
    id: genId(),
    title: "",
    description: "",
    tasks: [createTask()],
    collapsed: false,
  }
}

// ---------------------------------------------------------------------------
// Task row
// ---------------------------------------------------------------------------

function TaskRow({
  task,
  phaseIndex,
  taskIndex,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  task: TemplateTask
  phaseIndex: number
  taskIndex: number
  onUpdate: (field: keyof TemplateTask, value: unknown) => void
  onRemove: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div className="rounded-lg border bg-white p-3 space-y-3">
      <div className="flex items-start gap-2">
        {/* Drag handle + reorder buttons */}
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <GripVertical className="size-3.5 text-muted-foreground cursor-grab" />
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-muted-foreground hover:text-[#1A1A2E] disabled:opacity-30"
          >
            <ChevronUp className="size-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="text-muted-foreground hover:text-[#1A1A2E] disabled:opacity-30"
          >
            <ChevronDown className="size-3" />
          </button>
        </div>

        <div className="flex-1 space-y-2">
          {/* Title row */}
          <div className="flex items-center gap-2">
            <Input
              value={task.title}
              onChange={(e) => onUpdate("title", e.target.value)}
              placeholder="Task name"
              className="text-xs h-7 flex-1"
            />
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="size-3 text-muted-foreground" />
              <Input
                type="number"
                min={0}
                step={0.5}
                value={task.estimatedHours}
                onChange={(e) =>
                  onUpdate("estimatedHours", parseFloat(e.target.value) || 0)
                }
                className="text-xs h-7 w-16"
              />
              <span className="text-[10px] text-muted-foreground">hrs</span>
            </div>
          </div>

          {/* Description */}
          <Textarea
            value={task.description}
            onChange={(e) => onUpdate("description", e.target.value)}
            placeholder="Task description (optional)"
            className="text-xs min-h-14 resize-y"
          />

          {/* Tier checkboxes + toggles */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">
                Tiers:
              </span>
              {(["basic", "pro", "enterprise"] as const).map((tier) => (
                <label
                  key={tier}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Checkbox
                    checked={task.tiers[tier]}
                    onCheckedChange={(checked) => {
                      onUpdate("tiers", {
                        ...task.tiers,
                        [tier]: !!checked,
                      })
                    }}
                  />
                  <span className="text-[10px] font-medium capitalize">
                    {tier[0].toUpperCase()}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Switch
                size="sm"
                checked={task.clientVisible}
                onCheckedChange={(checked) =>
                  onUpdate("clientVisible", checked)
                }
              />
              <span className="text-[10px] text-muted-foreground">
                Client visible
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Switch
                size="sm"
                checked={task.isMilestone}
                onCheckedChange={(checked) =>
                  onUpdate("isMilestone", checked)
                }
              />
              <span className="text-[10px] text-muted-foreground">
                Milestone
              </span>
            </div>
          </div>

          {/* Client label (if client visible) */}
          {task.clientVisible && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Client-facing label
              </Label>
              <Input
                value={task.clientLabel}
                onChange={(e) => onUpdate("clientLabel", e.target.value)}
                placeholder="Label shown to client (optional)"
                className="text-xs h-7"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-[#1A1A2E] transition-colors"
            title="Duplicate task"
          >
            <Copy className="size-3" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
            title="Remove task"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Phase section
// ---------------------------------------------------------------------------

function PhaseSection({
  phase,
  phaseIndex,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onDuplicateTask,
  onMoveTask,
  isFirst,
  isLast,
}: {
  phase: TemplatePhase
  phaseIndex: number
  onUpdate: (field: keyof TemplatePhase, value: unknown) => void
  onRemove: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onUpdateTask: (
    taskIndex: number,
    field: keyof TemplateTask,
    value: unknown
  ) => void
  onAddTask: () => void
  onRemoveTask: (taskIndex: number) => void
  onDuplicateTask: (taskIndex: number) => void
  onMoveTask: (taskIndex: number, direction: "up" | "down") => void
  isFirst: boolean
  isLast: boolean
}) {
  const [collapsed, setCollapsed] = useState(phase.collapsed)

  return (
    <Card className="border-l-4 border-l-[#2D5A8C]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="text-muted-foreground hover:text-[#1A1A2E] disabled:opacity-30"
            >
              <ChevronUp className="size-3" />
            </button>
            <GripVertical className="size-3.5 text-muted-foreground cursor-grab mx-auto" />
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="text-muted-foreground hover:text-[#1A1A2E] disabled:opacity-30"
            >
              <ChevronDown className="size-3" />
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={phase.title}
                onChange={(e) => onUpdate("title", e.target.value)}
                placeholder="Phase name"
                className="text-sm font-semibold h-8 flex-1"
              />
              <span className="text-[10px] text-muted-foreground shrink-0">
                {phase.tasks.length} task{phase.tasks.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded hover:bg-gray-100 text-muted-foreground"
            >
              {collapsed ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronUp className="size-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onDuplicate}
              className="p-1.5 rounded hover:bg-gray-100 text-muted-foreground hover:text-[#1A1A2E]"
              title="Duplicate phase"
            >
              <Copy className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
              title="Remove phase"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-2">
          {phase.tasks.map((task, taskIndex) => (
            <TaskRow
              key={task.id}
              task={task}
              phaseIndex={phaseIndex}
              taskIndex={taskIndex}
              onUpdate={(field, value) =>
                onUpdateTask(taskIndex, field, value)
              }
              onRemove={() => onRemoveTask(taskIndex)}
              onDuplicate={() => onDuplicateTask(taskIndex)}
              onMoveUp={() => onMoveTask(taskIndex, "up")}
              onMoveDown={() => onMoveTask(taskIndex, "down")}
              isFirst={taskIndex === 0}
              isLast={taskIndex === phase.tasks.length - 1}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onAddTask}
            className="w-full"
          >
            <Plus className="size-3 mr-1" />
            Add Task
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TemplateEditorProps {
  initialTemplate?: TemplateData
}

export function TemplateEditor({ initialTemplate }: TemplateEditorProps) {
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<TemplateData>(
    initialTemplate ?? {
      id: genId(),
      name: "Default Build Checklist",
      version: 1,
      phases: [
        {
          id: genId(),
          title: "Design",
          description: "",
          collapsed: false,
          tasks: [
            {
              id: genId(),
              title: "Create wireframes",
              description: "Low-fidelity wireframes for all key pages",
              tiers: { basic: false, pro: true, enterprise: true },
              estimatedHours: 8,
              clientVisible: true,
              isMilestone: false,
              clientLabel: "Wireframe designs",
            },
            {
              id: genId(),
              title: "Visual design mockups",
              description:
                "High-fidelity mockups for homepage and product pages",
              tiers: { basic: false, pro: true, enterprise: true },
              estimatedHours: 16,
              clientVisible: true,
              isMilestone: true,
              clientLabel: "Design mockups ready for review",
            },
            {
              id: genId(),
              title: "Theme selection & setup",
              description: "Select and configure Shopify theme",
              tiers: { basic: true, pro: true, enterprise: true },
              estimatedHours: 4,
              clientVisible: false,
              isMilestone: false,
              clientLabel: "",
            },
          ],
        },
        {
          id: genId(),
          title: "Development",
          description: "",
          collapsed: false,
          tasks: [
            {
              id: genId(),
              title: "Theme customization",
              description: "Implement custom design in Shopify theme",
              tiers: { basic: true, pro: true, enterprise: true },
              estimatedHours: 20,
              clientVisible: false,
              isMilestone: false,
              clientLabel: "",
            },
            {
              id: genId(),
              title: "App integrations",
              description: "Install and configure required apps",
              tiers: { basic: true, pro: true, enterprise: true },
              estimatedHours: 8,
              clientVisible: true,
              isMilestone: false,
              clientLabel: "Store integrations configured",
            },
          ],
        },
      ],
    }
  )

  // Phase operations
  const addPhase = useCallback(() => {
    setTemplate((prev) => ({
      ...prev,
      phases: [...prev.phases, createPhase()],
    }))
  }, [])

  const removePhase = useCallback((index: number) => {
    setTemplate((prev) => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index),
    }))
  }, [])

  const duplicatePhase = useCallback((index: number) => {
    setTemplate((prev) => {
      const phase = prev.phases[index]
      const newPhase: TemplatePhase = {
        ...phase,
        id: genId(),
        title: `${phase.title} (Copy)`,
        tasks: phase.tasks.map((t) => ({ ...t, id: genId() })),
      }
      const phases = [...prev.phases]
      phases.splice(index + 1, 0, newPhase)
      return { ...prev, phases }
    })
  }, [])

  const movePhase = useCallback(
    (index: number, direction: "up" | "down") => {
      setTemplate((prev) => {
        const phases = [...prev.phases]
        const targetIndex = direction === "up" ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= phases.length) return prev
        ;[phases[index], phases[targetIndex]] = [
          phases[targetIndex],
          phases[index],
        ]
        return { ...prev, phases }
      })
    },
    []
  )

  const updatePhase = useCallback(
    (index: number, field: keyof TemplatePhase, value: unknown) => {
      setTemplate((prev) => {
        const phases = [...prev.phases]
        phases[index] = { ...phases[index], [field]: value }
        return { ...prev, phases }
      })
    },
    []
  )

  // Task operations
  const addTask = useCallback((phaseIndex: number) => {
    setTemplate((prev) => {
      const phases = [...prev.phases]
      phases[phaseIndex] = {
        ...phases[phaseIndex],
        tasks: [...phases[phaseIndex].tasks, createTask()],
      }
      return { ...prev, phases }
    })
  }, [])

  const removeTask = useCallback((phaseIndex: number, taskIndex: number) => {
    setTemplate((prev) => {
      const phases = [...prev.phases]
      phases[phaseIndex] = {
        ...phases[phaseIndex],
        tasks: phases[phaseIndex].tasks.filter((_, i) => i !== taskIndex),
      }
      return { ...prev, phases }
    })
  }, [])

  const duplicateTask = useCallback(
    (phaseIndex: number, taskIndex: number) => {
      setTemplate((prev) => {
        const phases = [...prev.phases]
        const task = phases[phaseIndex].tasks[taskIndex]
        const newTask: TemplateTask = {
          ...task,
          id: genId(),
          title: `${task.title} (Copy)`,
        }
        const tasks = [...phases[phaseIndex].tasks]
        tasks.splice(taskIndex + 1, 0, newTask)
        phases[phaseIndex] = { ...phases[phaseIndex], tasks }
        return { ...prev, phases }
      })
    },
    []
  )

  const moveTask = useCallback(
    (phaseIndex: number, taskIndex: number, direction: "up" | "down") => {
      setTemplate((prev) => {
        const phases = [...prev.phases]
        const tasks = [...phases[phaseIndex].tasks]
        const targetIndex = direction === "up" ? taskIndex - 1 : taskIndex + 1
        if (targetIndex < 0 || targetIndex >= tasks.length) return prev
        ;[tasks[taskIndex], tasks[targetIndex]] = [
          tasks[targetIndex],
          tasks[taskIndex],
        ]
        phases[phaseIndex] = { ...phases[phaseIndex], tasks }
        return { ...prev, phases }
      })
    },
    []
  )

  const updateTask = useCallback(
    (
      phaseIndex: number,
      taskIndex: number,
      field: keyof TemplateTask,
      value: unknown
    ) => {
      setTemplate((prev) => {
        const phases = [...prev.phases]
        const tasks = [...phases[phaseIndex].tasks]
        tasks[taskIndex] = { ...tasks[taskIndex], [field]: value }
        phases[phaseIndex] = { ...phases[phaseIndex], tasks }
        return { ...prev, phases }
      })
    },
    []
  )

  // Save
  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      })
      toast.success("Template saved successfully")
    } catch {
      toast.error("Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const totalTasks = template.phases.reduce(
    (sum, p) => sum + p.tasks.length,
    0
  )
  const totalHours = template.phases.reduce(
    (sum, p) => sum + p.tasks.reduce((s, t) => s + t.estimatedHours, 0),
    0
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <ListChecks className="size-5 text-[#2D5A8C]" />
          <Input
            value={template.name}
            onChange={(e) =>
              setTemplate((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Template name"
            className="text-sm font-semibold max-w-xs"
          />
          <span className="text-[10px] text-muted-foreground bg-gray-100 rounded-full px-2 py-0.5">
            v{template.version}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">
            {template.phases.length} phases &middot; {totalTasks} tasks &middot;{" "}
            {totalHours}h est.
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
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {template.phases.map((phase, phaseIndex) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            phaseIndex={phaseIndex}
            onUpdate={(field, value) => updatePhase(phaseIndex, field, value)}
            onRemove={() => removePhase(phaseIndex)}
            onDuplicate={() => duplicatePhase(phaseIndex)}
            onMoveUp={() => movePhase(phaseIndex, "up")}
            onMoveDown={() => movePhase(phaseIndex, "down")}
            onUpdateTask={(taskIndex, field, value) =>
              updateTask(phaseIndex, taskIndex, field, value)
            }
            onAddTask={() => addTask(phaseIndex)}
            onRemoveTask={(taskIndex) => removeTask(phaseIndex, taskIndex)}
            onDuplicateTask={(taskIndex) =>
              duplicateTask(phaseIndex, taskIndex)
            }
            onMoveTask={(taskIndex, direction) =>
              moveTask(phaseIndex, taskIndex, direction)
            }
            isFirst={phaseIndex === 0}
            isLast={phaseIndex === template.phases.length - 1}
          />
        ))}
      </div>

      {/* Add phase */}
      <Button variant="outline" onClick={addPhase} className="w-full">
        <Plus className="size-4 mr-1" />
        Add Phase
      </Button>
    </div>
  )
}
