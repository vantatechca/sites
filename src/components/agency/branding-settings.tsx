"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Save,
  Loader2,
  Upload,
  Eye,
  Sun,
  Moon,
  Type,
  Paintbrush,
  Globe,
  ImageIcon,
} from "lucide-react"
import { toast } from "sonner"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrandingFormData {
  agencyName: string
  logoLightUrl: string
  logoDarkUrl: string
  faviconUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontHeading: string
  fontBody: string
  portalDomain: string
  welcomeMessage: string
  footerText: string
}

// ---------------------------------------------------------------------------
// Color swatch
// ---------------------------------------------------------------------------

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div
          className="size-8 rounded-lg border cursor-pointer shrink-0"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="size-full opacity-0 cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-xs uppercase"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Image upload area
// ---------------------------------------------------------------------------

function ImageUploadArea({
  label,
  currentUrl,
  onUrlChange,
  icon: Icon,
}: {
  label: string
  currentUrl: string
  onUrlChange: (url: string) => void
  icon: React.ElementType
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-[#2D5A8C]/40 transition-colors">
        {currentUrl ? (
          <div className="space-y-2">
            <div className="mx-auto w-24 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
              <img
                src={currentUrl}
                alt={label}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => onUrlChange("")}
              className="text-[10px] text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <Icon className="size-6 text-muted-foreground mx-auto" />
            <p className="text-[10px] text-muted-foreground">
              Drag & drop or click to upload
            </p>
          </div>
        )}
        <Input
          value={currentUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="Or paste image URL"
          className="mt-2 text-xs"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Font selector
// ---------------------------------------------------------------------------

const FONT_OPTIONS = [
  "Inter",
  "Plus Jakarta Sans",
  "Manrope",
  "DM Sans",
  "Poppins",
  "Nunito",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
  "Source Serif Pro",
  "IBM Plex Sans",
  "Space Grotesk",
]

// ---------------------------------------------------------------------------
// Portal preview
// ---------------------------------------------------------------------------

function PortalPreview({ data }: { data: BrandingFormData }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Preview header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: data.primaryColor }}
      >
        <div className="flex items-center gap-2">
          {data.logoLightUrl ? (
            <img
              src={data.logoLightUrl}
              alt="Logo"
              className="h-6 object-contain"
            />
          ) : (
            <span
              className="text-sm font-bold text-white"
              style={{ fontFamily: data.fontHeading || "Inter" }}
            >
              {data.agencyName || "Agency"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Preview body */}
      <div className="p-4 bg-white space-y-3">
        <h2
          className="text-sm font-semibold"
          style={{
            fontFamily: data.fontHeading || "Inter",
            color: data.secondaryColor,
          }}
        >
          {data.welcomeMessage || "Welcome to your project portal"}
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {["Design", "Development", "Content"].map((phase) => (
            <div
              key={phase}
              className="rounded-lg px-2 py-3 text-center text-xs"
              style={{
                backgroundColor: `${data.primaryColor}10`,
                color: data.primaryColor,
                fontFamily: data.fontBody || "Inter",
              }}
            >
              {phase}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="w-full rounded-lg px-3 py-2 text-xs text-white font-medium"
          style={{ backgroundColor: data.accentColor }}
        >
          View Progress
        </button>
      </div>

      {/* Preview footer */}
      <div
        className="px-4 py-2 text-center"
        style={{
          backgroundColor: data.secondaryColor,
        }}
      >
        <p
          className="text-[10px] text-white/60"
          style={{ fontFamily: data.fontBody || "Inter" }}
        >
          {data.footerText || "Powered by SiteForge"}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BrandingSettings() {
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [form, setForm] = useState<BrandingFormData>({
    agencyName: "SiteForge",
    logoLightUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
    primaryColor: "#2D5A8C",
    secondaryColor: "#1A1A2E",
    accentColor: "#E8491D",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    portalDomain: "portal.siteforge.dev",
    welcomeMessage: "Welcome to your project portal!",
    footerText: "Powered by SiteForge",
  })

  const updateField = useCallback(
    <K extends keyof BrandingFormData>(key: K, value: BrandingFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      toast.success("Branding settings saved")
    } catch {
      toast.error("Failed to save branding settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Agency identity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Paintbrush className="size-4" />
              Agency Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Agency Name</Label>
              <Input
                value={form.agencyName}
                onChange={(e) => updateField("agencyName", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadArea
                label="Logo (Light Background)"
                currentUrl={form.logoLightUrl}
                onUrlChange={(v) => updateField("logoLightUrl", v)}
                icon={Sun}
              />
              <ImageUploadArea
                label="Logo (Dark Background)"
                currentUrl={form.logoDarkUrl}
                onUrlChange={(v) => updateField("logoDarkUrl", v)}
                icon={Moon}
              />
            </div>

            <ImageUploadArea
              label="Favicon"
              currentUrl={form.faviconUrl}
              onUrlChange={(v) => updateField("faviconUrl", v)}
              icon={ImageIcon}
            />
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Paintbrush className="size-4" />
              Brand Colors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ColorInput
                label="Primary"
                value={form.primaryColor}
                onChange={(v) => updateField("primaryColor", v)}
              />
              <ColorInput
                label="Secondary"
                value={form.secondaryColor}
                onChange={(v) => updateField("secondaryColor", v)}
              />
              <ColorInput
                label="Accent"
                value={form.accentColor}
                onChange={(v) => updateField("accentColor", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Type className="size-4" />
              Typography
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Heading Font</Label>
                <select
                  value={form.fontHeading}
                  onChange={(e) => updateField("fontHeading", e.target.value)}
                  className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Body Font</Label>
                <select
                  value={form.fontBody}
                  onChange={(e) => updateField("fontBody", e.target.value)}
                  className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portal settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Globe className="size-4" />
              Portal Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Portal Domain</Label>
              <Input
                value={form.portalDomain}
                onChange={(e) => updateField("portalDomain", e.target.value)}
                placeholder="portal.youragency.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Welcome Message</Label>
              <Textarea
                value={form.welcomeMessage}
                onChange={(e) =>
                  updateField("welcomeMessage", e.target.value)
                }
                placeholder="Welcome message for clients"
                className="min-h-20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Footer Text</Label>
              <Input
                value={form.footerText}
                onChange={(e) => updateField("footerText", e.target.value)}
                placeholder="Powered by SiteForge"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4 mr-1" />
                Save Branding
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden"
          >
            <Eye className="size-4 mr-1" />
            {showPreview ? "Hide Preview" : "Preview Portal"}
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
            <Eye className="size-4" />
            Live Preview
          </h3>
          <PortalPreview data={form} />
        </div>
      </div>
    </div>
  )
}
