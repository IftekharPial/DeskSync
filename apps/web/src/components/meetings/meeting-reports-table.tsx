'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { meetingReportsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime, formatDuration, getStatusColor } from '@/lib/utils'
import { 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Calendar,
  Users,
  CheckSquare
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface MeetingReportsTableProps {
  onEdit?: (meeting: any) => void
}

export function MeetingReportsTable({ onEdit }: MeetingReportsTableProps) {
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery(
    ['meeting-reports', page],
    () => meetingReportsApi.getAll({ page, limit: 10 }),
    {
      select: (response) => response.data,
      keepPreviousData: true,
    }
  )

  const deleteMutation = useMutation(meetingReportsApi.delete, {
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Meeting report deleted successfully',
      })
      queryClient.invalidateQueries('meeting-reports')
      queryClient.invalidateQueries('meeting-stats')
      setDeleteId(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete meeting report',
        variant: 'destructive',
      })
    },
  })

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading meeting reports..." />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load meeting reports</p>
      </div>
    )
  }

  const meetings = data?.data || []
  const pagination = data?.pagination

  if (meetings.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No meeting reports found</h3>
        <p className="text-muted-foreground">
          Start creating meeting reports to track your meetings and outcomes
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium">Meeting</th>
              <th className="text-left py-3 px-4 font-medium">Date & Time</th>
              <th className="text-left py-3 px-4 font-medium">Duration</th>
              <th className="text-left py-3 px-4 font-medium">Outcome</th>
              <th className="text-left py-3 px-4 font-medium">Attendees</th>
              <th className="text-left py-3 px-4 font-medium">Action Items</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting: any) => {
              const duration = meeting.endTime 
                ? new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()
                : null
              
              return (
                <tr key={meeting.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{meeting.title}</div>
                      {meeting.notes && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {meeting.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="font-medium">
                        {formatDateTime(meeting.startTime)}
                      </div>
                      {meeting.endTime && (
                        <div className="text-muted-foreground">
                          to {new Date(meeting.endTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {duration ? (
                      <span className="text-sm font-medium">
                        {formatDuration(Math.round(duration / (1000 * 60)))}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.outcome)}`}>
                      {meeting.outcome}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {meeting.attendees?.length || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {meeting.actionItems?.length || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(meeting)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(meeting.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} meetings
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this meeting report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
