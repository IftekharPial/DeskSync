'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  Settings,
  Users,
  Webhook,
  ChevronLeft,
  ChevronRight,
  Activity,
  MessageSquare,
  Database,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Daily Reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    title: 'Meetings',
    href: '/dashboard/meetings',
    icon: MessageSquare,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Webhooks',
    href: '/dashboard/webhooks',
    icon: Webhook,
    adminOnly: true,
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'System Health',
    href: '/dashboard/health',
    icon: Activity,
    adminOnly: true,
  },
  {
    title: 'Platforms',
    href: '/dashboard/admin/platforms',
    icon: Database,
    adminOnly: true,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  const isAdmin = (session as any)?.user?.role === 'ADMIN'

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || isAdmin
  )

  return (
    <div className={cn(
      'bg-card border-r border-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">DS</span>
                </div>
                <span className="font-semibold text-lg">DailySync</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      collapsed && 'justify-center'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {session?.user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {(session as any)?.user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
