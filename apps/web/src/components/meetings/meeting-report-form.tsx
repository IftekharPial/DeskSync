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
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X, Plus, Trash2 } from 'lucide-react'

const meetingReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  outcome: z.enum(['SUCCESSFUL', 'CANCELLED', 'RESCHEDULED', 'PENDING']),
  notes: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  hostId: z.string().optional(),
})

type MeetingReportForm = z.infer<typeof meetingReportSchema>

interface MeetingReportFormProps {
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function MeetingReportForm({ initialData, onSuccess, onCancel }: MeetingReportFormProps) {
  const [attendeesInput, setAttendeesInput] = useState<string[]>(
    initialData?.attendees || ['']
  )
  const [actionItemsInput, setActionItemsInput] = useState<string[]>(
    initialData?.actionItems || ['']
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
      startTime: initialData?.startTime
        ? new Date(initialData.startTime).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      endTime: initialData?.endTime
        ? new Date(initialData.endTime).toISOString().slice(0, 16)
        : '',
      outcome: initialData?.outcome || 'PENDING',
      notes: initialData?.notes || '',
      customerName: initialData?.customerName || '',
      customerEmail: initialData?.customerEmail || '',
      hostId: initialData?.hostId || '',
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
    // Process attendees and action items
    const attendees = attendeesInput
      .filter(attendee => attendee.trim().length > 0)
      .map(attendee => attendee.trim())

    const actionItems = actionItemsInput
      .filter(item => item.trim().length > 0)
      .map(item => item.trim())

    const submitData = {
      ...data,
      attendees: attendees.length > 0 ? attendees : undefined,
      actionItems: actionItems.length > 0 ? actionItems : undefined,
      customerName: data.customerName || undefined,
      customerEmail: data.customerEmail || undefined,
      hostId: data.hostId || undefined,
    }

    if (initialData) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  const addAttendee = () => {
    setAttendeesInput([...attendeesInput, ''])
  }

  const removeAttendee = (index: number) => {
    setAttendeesInput(attendeesInput.filter((_, i) => i !== index))
  }

  const updateAttendee = (index: number, value: string) => {
    const newAttendees = [...attendeesInput]
    newAttendees[index] = value
    setAttendeesInput(newAttendees)
  }

  const addActionItem = () => {
    setActionItemsInput([...actionItemsInput, ''])
  }

  const removeActionItem = (index: number) => {
    setActionItemsInput(actionItemsInput.filter((_, i) => i !== index))
  }

  const updateActionItem = (index: number, value: string) => {
    const newActionItems = [...actionItemsInput]
    newActionItems[index] = value
    setActionItemsInput(newActionItems)
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Meeting Title *
        </label>
        <Input
          id="title"
          placeholder="Enter meeting title"
          {...register('title')}
          className={errors.title ? 'border-destructive' : ''}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium mb-2">
            Customer Name (Optional)
          </label>
          <Input
            id="customerName"
            placeholder="Enter customer name"
            {...register('customerName')}
            className={errors.customerName ? 'border-destructive' : ''}
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-destructive">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium mb-2">
            Customer Email (Optional)
          </label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="customer@example.com"
            {...register('customerEmail')}
            className={errors.customerEmail ? 'border-destructive' : ''}
          />
          {errors.customerEmail && (
            <p className="mt-1 text-sm text-destructive">
              {errors.customerEmail.message}
            </p>
          )}
        </div>
      </div>

      {/* Host Information */}
      <div>
        <label htmlFor="hostId" className="block text-sm font-medium mb-2">
          Host ID (Optional)
        </label>
        <Input
          id="hostId"
          placeholder="Enter host identifier (email or username)"
          {...register('hostId')}
          className={errors.hostId ? 'border-destructive' : ''}
        />
        {errors.hostId && (
          <p className="mt-1 text-sm text-destructive">
            {errors.hostId.message}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Used for automatic assignment when meetings are created via webhooks
        </p>
      </div>

      {/* Time Fields */}
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
            End Time (Optional)
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
          <SelectTrigger>
            <SelectValue placeholder="Select outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUCCESSFUL">Successful</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Attendees */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">
            Attendees (Optional)
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAttendee}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {attendeesInput.map((attendee, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder="Enter attendee name or email"
                value={attendee}
                onChange={(e) => updateAttendee(index, e.target.value)}
              />
              {attendeesInput.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeAttendee(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">
            Action Items (Optional)
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addActionItem}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {actionItemsInput.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder="Enter action item"
                value={item}
                onChange={(e) => updateActionItem(index, e.target.value)}
              />
              {actionItemsInput.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeActionItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-2">
          Meeting Notes (Optional)
        </label>
        <Textarea
          id="notes"
          placeholder="Add notes about the meeting, key decisions, or important points discussed..."
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
