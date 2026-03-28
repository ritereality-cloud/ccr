"use client"

import type React from "react"
import { useState, useEffect } from "react"
import DashboardHeader from "./dashboard-header"
import UnifiedSidebar from "./unified-sidebar"
import { Toaster } from "@/components/ui/toaster"

type UserRole = "admin" | "agent" | "builder" | "buyer" | "customer"

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
  userRole: UserRole
  userName?: string
}

export default function DashboardLayoutWrapper({
  children,
  userRole,
  userName,
}: DashboardLayoutWrapperProps) {
  const [sidebarMinimized, setSidebarMinimized] = useState(false)

  // Listen for sidebar minimize changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-minimized") {
          const sidebar = mutation.target as HTMLElement
          setSidebarMinimized(sidebar.dataset.minimized === "true")
        }
      })
    })

    const sidebar = document.querySelector("aside[data-minimized]")
    if (sidebar) {
      setSidebarMinimized((sidebar as HTMLElement).dataset.minimized === "true")
      observer.observe(sidebar, { attributes: true })
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Dashboard Header - Fixed at top */}
      <DashboardHeader userName={userName} userRole={userRole} />

      {/* Sidebar - Fixed on left */}
      <UnifiedSidebar userRole={userRole} />

      {/* Main Content Area */}
      <main className={`min-h-[calc(100vh-3.5rem)] transition-all duration-300 ${sidebarMinimized ? "md:ml-16" : "md:ml-64"}`}>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}
