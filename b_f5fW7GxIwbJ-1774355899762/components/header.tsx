"use client"

import { useEffect, useState } from "react"
import { Search, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface HeaderProps {
  title: string
  description: string
}

interface NotificationItem {
  id: string
  title: string
  message: string
  is_read: boolean
}

export function Header({ title, description }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?limit=5")
        const result = await response.json()

        if (!response.ok) {
          return
        }

        setNotifications(result.notifications || [])
        setUnreadCount(result.unreadCount || 0)
      } catch {
        setNotifications([])
        setUnreadCount(0)
      }
    }

    void loadNotifications()
  }, [])

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)

    if (!open || unreadCount === 0) {
      return
    }

    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mark_all: true }),
      })
      setUnreadCount(0)
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      )
    } catch {
      // Ignore notification mark-as-read errors in the header popover.
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="h-9 w-64 bg-background pl-9"
          />
        </div>

        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-9">
              <Bell className="size-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {Math.min(unreadCount, 9)}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-medium text-foreground">Notifications</h3>
            </div>
            <div className="divide-y divide-border">
              {notifications.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">No notifications.</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <p className="text-sm font-medium text-foreground">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{notification.message}</p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
