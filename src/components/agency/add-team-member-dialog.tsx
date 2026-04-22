"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useCreateTeamMember } from "@/hooks/use-team"
import type { Department } from "@/types"
import { DEPARTMENT_LABELS } from "@/types"

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const addTeamMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["manager", "team_member"]),
  department: z.enum([
    "design",
    "development",
    "content",
    "qa",
    "project_management",
  ]),
  specialization: z.string().optional(),
  maxConcurrentProjects: z.number().min(1, "Must be at least 1").max(20, "Maximum 20"),
  timezone: z.string().optional(),
})

type FormData = z.infer<typeof addTeamMemberSchema>

// ---------------------------------------------------------------------------
// Constants
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

const DEPARTMENTS: Department[] = [
  "design",
  "development",
  "content",
  "qa",
  "project_management",
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AddTeamMemberDialogProps {
  trigger?: React.ReactNode
}

export function AddTeamMemberDialog({ trigger }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const createMember = useCreateTeamMember()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(addTeamMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "team_member",
      department: "development",
      specialization: "",
      maxConcurrentProjects: 4,
      timezone: "America/New_York",
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await createMember.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department,
        specialization: data.specialization || undefined,
        maxConcurrentProjects: data.maxConcurrentProjects,
        timezone: data.timezone || undefined,
      })
      toast.success("Team member added successfully")
      setOpen(false)
      reset()
    } catch {
      toast.error("Failed to add team member. Please try again.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger
        render={
          trigger ? (
            <>{trigger}</>
          ) : (
            <Button>
              <UserPlus className="size-4 mr-1" />
              Add Team Member
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new member to your agency team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tm-name" className="text-xs">
                Name
              </Label>
              <Input
                id="tm-name"
                placeholder="Full name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-email" className="text-xs">
                Email
              </Label>
              <Input
                id="tm-email"
                type="email"
                placeholder="name@siteforge.dev"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="tm-password" className="text-xs">
              Password
            </Label>
            <Input
              id="tm-password"
              type="password"
              placeholder="Minimum 8 characters"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tm-role" className="text-xs">
                Role
              </Label>
              <select
                id="tm-role"
                {...register("role")}
                className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="team_member">Team Member</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-department" className="text-xs">
                Department
              </Label>
              <select
                id="tm-department"
                {...register("department")}
                className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {DEPARTMENT_LABELS[dept]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-1.5">
            <Label htmlFor="tm-spec" className="text-xs">
              Specialization
            </Label>
            <Input
              id="tm-spec"
              placeholder="e.g., Shopify Liquid & React"
              {...register("specialization")}
            />
          </div>

          {/* Max Projects & Timezone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tm-max-proj" className="text-xs">
                Max Concurrent Projects
              </Label>
              <Input
                id="tm-max-proj"
                type="number"
                min={1}
                max={20}
                {...register("maxConcurrentProjects", { valueAsNumber: true })}
              />
              {errors.maxConcurrentProjects && (
                <p className="text-xs text-red-600">
                  {errors.maxConcurrentProjects.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-tz" className="text-xs">
                Timezone
              </Label>
              <select
                id="tm-tz"
                {...register("timezone")}
                className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error display */}
          {createMember.isError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
              Failed to add team member. Please try again.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMember.isPending}>
              {createMember.isPending ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-1" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
