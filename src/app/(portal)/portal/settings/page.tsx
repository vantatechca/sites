"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, User, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors",
        checked
          ? "border-[var(--portal-primary,#4F46E5)] bg-[var(--portal-primary,#4F46E5)]"
          : "border-gray-300 bg-gray-200"
      )}
    >
      <span
        className={cn(
          "inline-block size-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export default function PortalSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("Demo Client");
  const [email, setEmail] = useState("client@example.com");
  const [notifications, setNotifications] = useState({
    deliverableReady: true,
    newMessage: true,
    invoiceDue: true,
    projectUpdates: false,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Settings saved");
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile and notification preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50/40 p-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--portal-primary,#4F46E5)] text-xl font-semibold text-white">
              {displayName.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {displayName || "Unnamed"}
              </p>
              <p className="truncate text-xs text-gray-500">{email}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: "deliverableReady" as const,
              label: "New Deliverables",
              desc: "When your team shares a new file or preview",
            },
            {
              key: "newMessage" as const,
              label: "New Messages",
              desc: "When your team sends a message",
            },
            {
              key: "invoiceDue" as const,
              label: "Invoice Reminders",
              desc: "When an invoice is due or overdue",
            },
            {
              key: "projectUpdates" as const,
              label: "Project Updates",
              desc: "Weekly summary of project progress",
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50/40 p-3 transition-colors hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
              </div>
              <Toggle
                checked={notifications[item.key]}
                onChange={(next) =>
                  setNotifications((prev) => ({ ...prev, [item.key]: next }))
                }
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
