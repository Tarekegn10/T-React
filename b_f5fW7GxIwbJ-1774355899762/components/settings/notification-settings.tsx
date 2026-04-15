"use client"

import { Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const notifications = [
  {
    id: "email",
    label: "Email Notifications",
    description: "Receive email alerts for document updates",
    defaultChecked: true,
  },
  {
    id: "approval",
    label: "Document Approval Alerts",
    description: "Get notified when documents need approval",
    defaultChecked: true,
  },
  {
    id: "weekly",
    label: "Weekly Summary",
    description: "Receive weekly document activity summary",
    defaultChecked: false,
  },
]

export function NotificationSettings() {
  return (
    <Card className="gap-0">
      <CardHeader className="py-4">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
        </div>
        <CardDescription>Configure notification preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="space-y-0.5">
                <Label htmlFor={notification.id} className="text-sm font-medium">
                  {notification.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {notification.description}
                </p>
              </div>
              <Switch
                id={notification.id}
                defaultChecked={notification.defaultChecked}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
