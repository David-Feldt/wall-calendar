"use client"

import { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface Calendar {
  id: string
  summary: string
  backgroundColor?: string
  foregroundColor?: string
  selected: boolean
  primary: boolean
}

const STORAGE_KEY = "selected_calendars"

export function CalendarSettings({ onCalendarsChange }: { onCalendarsChange?: () => void }) {
  const [open, setOpen] = useState(false)
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      loadCalendars()
    }
  }, [open])

  useEffect(() => {
    // Load saved selections from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setSelectedIds(JSON.parse(saved))
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  const loadCalendars = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/calendar/list")
      if (!response.ok) {
        throw new Error("Failed to fetch calendars")
      }
      const data = await response.json()
      setCalendars(data.calendars || [])

      // If no saved selection, use default (primary + selected calendars)
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        const defaultSelected = data.calendars
          .filter((cal: Calendar) => cal.selected || cal.primary)
          .map((cal: Calendar) => cal.id)
        setSelectedIds(defaultSelected)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSelected))
      }
    } catch (error) {
      console.error("Error loading calendars:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (calendarId: string) => {
    const newSelected = selectedIds.includes(calendarId)
      ? selectedIds.filter((id) => id !== calendarId)
      : [...selectedIds, calendarId]
    
    setSelectedIds(newSelected)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSelected))
    
    // Notify parent to refresh events
    if (onCalendarsChange) {
      onCalendarsChange()
    }
  }

  const getSelectedCalendars = () => {
    return selectedIds.length > 0 ? selectedIds : ["primary"]
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="rounded-full hover:bg-muted"
        title="Calendar settings"
      >
        <Settings size={20} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Calendars</DialogTitle>
            <DialogDescription>
              Choose which calendars to display in your weekly view
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto space-y-2 mt-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading calendars...</p>
            ) : calendars.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No calendars found</p>
            ) : (
              calendars.map((calendar) => {
                const isSelected = selectedIds.includes(calendar.id)
                return (
                  <div
                    key={calendar.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(calendar.id)}
                      id={calendar.id}
                    />
                    <label
                      htmlFor={calendar.id}
                      className="flex-1 cursor-pointer text-sm font-medium"
                    >
                      {calendar.summary}
                      {calendar.primary && (
                        <span className="text-xs text-muted-foreground ml-2">(Primary)</span>
                      )}
                    </label>
                    {calendar.backgroundColor && (
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: calendar.backgroundColor }}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function getSelectedCalendarIds(): string[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const ids = JSON.parse(saved)
      return ids.length > 0 ? ids : ["primary"]
    } catch (e) {
      return ["primary"]
    }
  }
  return ["primary"]
}
