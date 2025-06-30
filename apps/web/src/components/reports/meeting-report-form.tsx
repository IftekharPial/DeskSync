'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from 'react-query'
import { z } from 'zod'
import { meetingReportsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, X, Plus, Trash2 } from 'lucide-react'

const meetingReportSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  outcome: z.enum(['SUCCESSFUL', 'RESCHEDULED', 'CANCELLED'], {
    required_error: 'Please select an outcome',
  }),
  notes: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
})

type MeetingReportForm = z.infer<typeof meetingReportSchema>

interface MeetingReportFormProps {
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function MeetingReportForm({ initialData, onSuccess, onCancel }: MeetingReportFormProps) {
  const [attendeesInput, setAttendeesInput] = useState(
    initialData?.attendees?.join('\n') || ''
  )
  const [actionItemsInput, setActionItemsInput] = useState(
    initialData?.actionItems?.join('\n') || ''
  )
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MeetingReportForm>({
    resolver: zodResolver(meetingReportSchema),
    defaultValues: {
      title: initialData?.title || '',
      startTime: initialData?.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
      endTime: initialData?.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
      outcome: initialData?.outcome || 'SUCCESSFUL',
      notes: initialData?.notes || '',
    },
  })

  const createMutation = useMutation(meetingReportsApi.create, {
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Meeting report created successfully',
      })
      queryClient.invalidateQueries('meeting-reports')
      queryClient.invalidateQueries('meeting-stats')
      queryClient.invalidateQueries('recent-meetings')
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create meeting report',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation(
    (data: MeetingReportForm) => meetingReportsApi.update(initialData.id, data),
    {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Meeting report updated successfully',
        })
        queryClient.invalidateQueries('meeting-reports')
        queryClient.invalidateQueries('meeting-stats')
        queryClient.invalidateQueries('recent-meetings')
        onSuccess?.()
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to update meeting report',
          variant: 'destructive',
        })
      },
    }
  )

  const onSubmit = (data: MeetingReportForm) => {
    // Process attendees
    const attendees = attendeesInput
      .split('\n')
      .map((attendee: string) => attendee.trim())
      .filter((attendee: string) => attendee.length > 0)

    // Process action items
    const actionItems = actionItemsInput
      .split('\n')
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0)

    const submitData = {
      ...data,
      attendees: attendees.length > 0 ? attendees : undefined,
      actionItems: actionItems.length > 0 ? actionItems : undefined,
    }

    if (initialData) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Meeting Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Meeting Title *
        </label>
        <Input
          id="title"
          placeholder="e.g., Weekly Team Standup, Client Review Meeting"
          {...register('title')}
          className={errors.title ? 'border-destructive' : ''}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium mb-2">
            Start Time *
          </label>
          <Input
            id="startTime"
            type="datetime-local"
            {...register('startTime')}
            className={errors.startTime ? 'border-destructive' : ''}
          />
          {errors.startTime && (
            <p className="mt-1 text-sm text-destructive">
              {errors.startTime.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium mb-2">
            End Time *
          </label>
          <Input
            id="endTime"
            type="datetime-local"
            {...register('endTime')}
            className={errors.endTime ? 'border-destructive' : ''}
          />
          {errors.endTime && (
            <p className="mt-1 text-sm text-destructive">
              {errors.endTime.message}
            </p>
          )}
        </div>
      </div>

      {/* Outcome */}
      <div>
        <label htmlFor="outcome" className="block text-sm font-medium mb-2">
          Meeting Outcome *
        </label>
        <Select
          value={watch('outcome')}
          onValueChange={(value) => setValue('outcome', value as any)}
        >
          <SelectTrigger className={errors.outcome ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select meeting outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUCCESSFUL">Successful</SelectItem>
            <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {errors.outcome && (
          <p className="mt-1 text-sm text-destructive">
            {errors.outcome.message}
          </p>
        )}
      </div>

      {/* Attendees */}
      <div>
        <label htmlFor="attendees" className="block text-sm font-medium mb-2">
          Attendees (Optional)
        </label>
        <Textarea
          id="attendees"
          placeholder="Enter attendee names (one per line)..."
          rows={3}
          value={attendeesInput}
          onChange={(e) => setAttendeesInput(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Enter one attendee name per line
        </p>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-2">
          Meeting Notes (Optional)
        </label>
        <Textarea
          id="notes"
          placeholder="Add meeting notes, key discussions, decisions made..."
          rows={4}
          {...register('notes')}
          className={errors.notes ? 'border-destructive' : ''}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-destructive">
            {errors.notes.message}
          </p>
        )}
      </div>

      {/* Action Items */}
      <div>
        <label htmlFor="actionItems" className="block text-sm font-medium mb-2">
          Action Items (Optional)
        </label>
        <Textarea
          id="actionItems"
          placeholder="Enter action items (one per line)..."
          rows={3}
          value={actionItemsInput}
          onChange={(e) => setActionItemsInput(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Enter one action item per line
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {initialData ? 'Update Report' : 'Create Report'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
