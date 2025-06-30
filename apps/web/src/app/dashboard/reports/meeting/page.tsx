'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { meetingReportsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { MeetingReportForm } from '@/components/reports/meeting-report-form'
import { MeetingReportsTable } from '@/components/reports/meeting-reports-table'
import { MeetingReportStats } from '@/components/reports/meeting-report-stats'
import { Plus, Calendar, Users, BarChart3 } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Reports</h1>
          <p className="text-muted-foreground">
            Track and manage your meeting activities and outcomes
          </p>
        </div>
        <Button onClick={handleCreateMeeting}>
          <Plus className="mr-2 h-4 w-4" />
          New Meeting Report
        </Button>
      </div>

      {/* Quick Stats */}
      {!loadingStats && stats && (
        <MeetingReportStats stats={stats} />
      )}

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Recent Meetings
          </CardTitle>
          <CardDescription>
            Your latest meeting reports and quick actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <LoadingSpinner text="Loading recent meetings..." />
          ) : recentMeetings && recentMeetings.length > 0 ? (
            <div className="space-y-4">
              {recentMeetings.slice(0, 3).map((meeting: any) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{meeting.title}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        meeting.outcome === 'SUCCESSFUL' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : meeting.outcome === 'RESCHEDULED'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {meeting.outcome}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(meeting.startTime).toLocaleDateString()} • {meeting.attendees?.length || 0} attendees
                    </div>
                    {meeting.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {meeting.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMeeting(meeting)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  View All Meetings
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No meetings yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first meeting report to track outcomes and action items
              </p>
              <Button onClick={handleCreateMeeting}>
                <Plus className="mr-2 h-4 w-4" />
                Create Meeting Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                : 'Record meeting details, outcomes, and action items'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MeetingReportForm
              initialData={selectedMeeting}
              onSuccess={() => {
                setShowForm(false)
                setSelectedMeeting(null)
              }}
              onCancel={() => {
                setShowForm(false)
                setSelectedMeeting(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* All Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            All Meeting Reports
          </CardTitle>
          <CardDescription>
            View and manage all your meeting reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeetingReportsTable onEdit={handleEditMeeting} />
        </CardContent>
      </Card>
    </div>
  )
}
