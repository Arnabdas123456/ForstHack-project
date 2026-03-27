"use client"

import { useEffect, useState } from "react"
import { User, Bell, Shield, Palette } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        const data = (await response.json()) as {
          error?: string
          user?: {
            name: string
            email: string
          }
        }

        if (!response.ok) {
          toast.error(data.error || "Unable to load profile")
          return
        }

        if (!mounted || !data.user) {
          return
        }

        setName(data.user.name)
        setEmail(data.user.email)
      } catch {
        toast.error("Unable to load profile")
      } finally {
        if (mounted) {
          setIsLoadingProfile(false)
        }
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  async function handleProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingProfile(true)

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })

      const data = (await response.json()) as {
        error?: string
        fieldErrors?: Record<string, string[]>
      }

      if (!response.ok) {
        const firstFieldError =
          data.fieldErrors &&
          Object.values(data.fieldErrors).find((messages) => messages?.length)?.[0]
        toast.error(firstFieldError || data.error || "Unable to update profile")
        return
      }

      toast.success("Profile updated successfully")
    } catch {
      toast.error("Unable to update profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handlePasswordUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingPassword(true)

    try {
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = (await response.json()) as {
        error?: string
        fieldErrors?: Record<string, string[]>
      }

      if (!response.ok) {
        const firstFieldError =
          data.fieldErrors &&
          Object.values(data.fieldErrors).find((messages) => messages?.length)?.[0]
        toast.error(firstFieldError || data.error || "Unable to update password")
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password updated successfully")
    } catch {
      toast.error("Unable to update password")
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="spotlight rounded-3xl border border-sky-200/20 bg-slate-900/55 p-6 shadow-[0_24px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Account</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-100 sm:text-4xl">Settings</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300/85 sm:text-base">
                Manage profile, security, and appearance preferences in one polished control center.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border-sky-200/20 py-0">
            <CardHeader className="border-b border-white/10 pb-5 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/20 bg-slate-900/55">
                  <User className="h-5 w-5 text-sky-200" />
                </div>
                <div>
                  <CardTitle className="text-slate-100">Profile</CardTitle>
                  <CardDescription className="text-slate-400">Manage your profile information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form className="space-y-4" onSubmit={handleProfileUpdate}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={isLoadingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isLoadingProfile}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoadingProfile || isSavingProfile} className="h-10 rounded-xl">
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-sky-200/20 py-0">
            <CardHeader className="border-b border-white/10 pb-5 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/20 bg-slate-900/55">
                  <Bell className="h-5 w-5 text-sky-200" />
                </div>
                <div>
                  <CardTitle className="text-slate-100">Notifications</CardTitle>
                  <CardDescription className="text-slate-400">Configure notification preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">Email Notifications</p>
                  <p className="text-sm text-slate-400">Receive updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">Video Complete Alerts</p>
                  <p className="text-sm text-slate-400">Get notified when videos finish generating</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">Marketing Emails</p>
                  <p className="text-sm text-slate-400">Receive news and updates</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-sky-200/20 py-0">
            <CardHeader className="border-b border-white/10 pb-5 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/20 bg-slate-900/55">
                  <Palette className="h-5 w-5 text-sky-200" />
                </div>
                <div>
                  <CardTitle className="text-slate-100">Appearance</CardTitle>
                  <CardDescription className="text-slate-400">Customize how the app looks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">Dark Mode</p>
                  <p className="text-sm text-slate-400">Use dark theme</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-sky-200/20 py-0">
            <CardHeader className="border-b border-white/10 pb-5 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/20 bg-slate-900/55">
                  <Shield className="h-5 w-5 text-sky-200" />
                </div>
                <div>
                  <CardTitle className="text-slate-100">Security</CardTitle>
                  <CardDescription className="text-slate-400">Manage your security settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form className="space-y-4" onSubmit={handlePasswordUpdate}>
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-slate-200">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-slate-200">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-slate-200">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" variant="outline" disabled={isSavingPassword} className="h-10 rounded-xl">
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
