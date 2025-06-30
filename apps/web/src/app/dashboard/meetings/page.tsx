'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { meetingReportsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { MeetingReportForm } from '@/components/meetings/meeting-report-form'
import { MeetingReportsTable } from '@/components/meetings/meeting-reports-table'
import { MeetingStats } from '@/components/meetings/meeting-stats'
import { Plus, MessageSquare, Calendar, BarChart3, Clock } from 'lucide-react'

export default function MeetingReportsPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)

  // Get meeting stats
  const { data: stats, isLoading: loadingStats } = useQuery(
    'meeting-stats',
    () => meetingReportsApi.getStats({ days: 30 }),
    {
      select: (response) => response.data.data,
    }
  )

  // Get recent meetings
  const { data: recentMeetings, isLoading: loadingRecent } = useQuery(
    'recent-meetings',
    () => meetingReportsApi.getAll({ page: 1, limit: 5 }),
    {
      select: (response) => response.data.data,
    }
  )

  const handleCreateMeeting = () => {
    setSelectedMeeting(null)
    setShowForm(true)
  }

  const handleEditMeeting = (meeting: any) => {
    setSelectedMeeting(meeting)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedMeeting(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Reports</h1>
          <p className="text-muted-foreground">
            Track and manage your meeting outcomes and action items
          </p>
        </div>
        <Button onClick={handleCreateMeeting}>
          <Plus className="mr-2 h-4 w-4" />
          New Meeting Report
        </Button>
      </div>

      {/* Quick Stats */}
      {!loadingStats && stats && (
        <MeetingStats stats={stats} />
      )}

      {/* Recent Meetings Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>
              Meetings scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecent ? (
              <LoadingSpinner text="Loading meetings..." />
            ) : (
              <div className="space-y-3">
                {recentMeetings && recentMeetings.length > 0 ? (
                  recentMeetings
                    .filter((meeting: any) => {
                      const today = new Date().toDateString()
                      const meetingDate = new Date(meeting.startTime).toDateString()
                      return meetingDate === today
                    })
                    .slice(0, 3)
                    .map((meeting: any) => (
                      <div key={meeting.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{meeting.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(meeting.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {meeting.endTime && (
                              ` - ${new Date(meeting.endTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            meeting.outcome === 'SUCCESSFUL' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : meeting.outcome === 'CANCELLED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {meeting.outcome}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No meetings scheduled for today</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common meeting-related tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCreateMeeting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Meeting Report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  const now = new Date()
                  const meeting = {
                    title: 'Quick Meeting',
                    startTime: now.toISOString(),
                    outcome: 'PENDING',
                  }
                  setSelectedMeeting(meeting)
                  setShowForm(true)
                }}
              >
                <Clock className="mr-2 h-4 w-4" />
                Log Current Meeting
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('/dashboard/analytics', '_blank')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Meeting Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meeting Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedMeeting ? 'Edit Meeting Report' : 'Create Meeting Report'}
            </CardTitle>
            <CardDescription>
              {selectedMeeting 
                ? 'Update meeting details and outcomes'
                : 'Record details about your meeting and its outcomes'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MeetingReportForm
              initialData={selectedMeeting}
              onSuccess={handleFormClose}
              onCancel={handleFormClose}
            />
          </CardContent>
        </Card>
      )}

      {/* Meetings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Meeting History
          </CardTitle>
          <CardDescription>
            View and manage your meeting reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeetingReportsTable onEdit={handleEditMeeting} />
        </CardContent>
      </Card>
    </div>
  )
}
