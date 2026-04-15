"use client"

import { Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const securityOptions = [
  {
    id: "2fa",
    label: "Two-Factor Authentication",
    description: "Add an extra layer of security to your account",
    defaultChecked: false,
  },
  {
    id: "session",
    label: "Session Timeout",
    description: "Automatically log out after period of inactivity",
    defaultChecked: true,
  },
  {
    id: "audit",
    label: "Audit Logging",
    description: "Track all document access and modifications",
    defaultChecked: true,
  },
]

export function SecuritySettings() {
  return (
    <Card className="gap-0">
      <CardHeader className="py-4">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Security</CardTitle>
        </div>
        <CardDescription>Manage security and access settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {securityOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="space-y-0.5">
                <Label htmlFor={option.id} className="text-sm font-medium">
                  {option.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <Switch
                id={option.id}
                defaultChecked={option.defaultChecked}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
