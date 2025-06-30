'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatNumber } from '@/lib/utils'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'

interface UserPerformance {
  userId: string
  userName: string
  userEmail: string
  totalReports: number
  totalTickets: number
  totalChats: number
  totalEmails: number
  totalCalls: number
  totalGithubIssues: number
  averageTickets: number
  averageChats: number
  averageEmails: number
  averageCalls: number
  reportingRate: number
}

interface UserPerformanceTableProps {
  data: UserPerformance[]
}

type SortField = keyof UserPerformance
type SortDirection = 'asc' | 'desc'

export function UserPerformanceTable({ data }: UserPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalTickets')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Defensive programming: ensure data is always an array
  const safeData = Array.isArray(data) ? data : []

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedData = [...safeData].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        )}
      </span>
    </Button>
  )

  if (safeData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No user performance data available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">
                <SortButton field="userName">User</SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton field="totalReports">Reports</SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton field="totalTickets">Tickets</SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton field="totalChats">Chats</SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton field="totalEmails">Emails</SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton field="totalCalls">Calls</SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton field="averageTickets">Avg/Day</SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton field="reportingRate">Rate</SortButton>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((user, index) => {
              const totalActivity = user.totalTickets + user.totalChats + user.totalEmails + user.totalCalls
              const isTopPerformer = index < 3 && sortField === 'totalTickets' && sortDirection === 'desc'
              
              return (
                <tr key={user.userId} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center space-x-2">
                          <span>{user.userName}</span>
                          {isTopPerformer && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded-full">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.userEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <div className="font-medium">{user.totalReports}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.reportingRate.toFixed(0)}% rate
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <div className="font-medium text-blue-600 dark:text-blue-400">
                        {formatNumber(user.totalTickets)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.averageTickets.toFixed(1)}/day
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <div className="font-medium text-green-600 dark:text-green-400">
                        {formatNumber(user.totalChats)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.averageChats.toFixed(1)}/day
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <div className="font-medium text-purple-600 dark:text-purple-400">
                        {formatNumber(user.totalEmails)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.averageEmails.toFixed(1)}/day
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <div className="font-medium text-orange-600 dark:text-orange-400">
                        {formatNumber(user.totalCalls)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.averageCalls.toFixed(1)}/day
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <div className="font-medium">
                        {user.averageTickets.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">tickets</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.reportingRate >= 80 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : user.reportingRate >= 60
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {user.reportingRate >= 80 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{user.reportingRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="pt-4 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {safeData.length}
            </div>
            <div className="text-sm text-muted-foreground">Team Members</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(safeData.reduce((sum, user) => sum + user.totalTickets, 0))}
            </div>
            <div className="text-sm text-muted-foreground">Total Tickets</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(safeData.reduce((sum, user) => sum + user.totalChats, 0))}
            </div>
            <div className="text-sm text-muted-foreground">Total Chats</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {safeData.length > 0 ? Math.round(safeData.reduce((sum, user) => sum + user.reportingRate, 0) / safeData.length) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Reporting Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}
