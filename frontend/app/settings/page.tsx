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
      <div className="p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="overflow-hidden rounded-2xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
                  <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Manage your profile information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleProfileUpdate}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={isLoadingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
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
                <Button
                  type="submit"
                  disabled={isLoadingProfile || isSavingProfile}
                  className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90 transition-all duration-300"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="overflow-hidden rounded-2xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
                  <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure notification preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Video Complete Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when videos finish generating</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">Receive news and updates</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="overflow-hidden rounded-2xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
                  <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="overflow-hidden rounded-2xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your security settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePasswordUpdate}>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSavingPassword}
                  className="transition-all duration-300 hover:scale-105"
                >
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
