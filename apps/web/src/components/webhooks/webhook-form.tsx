'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from 'react-query'
import { z } from 'zod'
import { webhooksApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react'
import { copyToClipboard, generateId } from '@/lib/utils'

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  type: z.enum(['GENERIC', 'MEETING']).default('GENERIC'),
  secret: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

type WebhookForm = z.infer<typeof webhookSchema>

interface WebhookFormProps {
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function WebhookForm({ initialData, onSuccess, onCancel }: WebhookFormProps) {
  const [showSecret, setShowSecret] = useState(false)
  const [generatedSecret, setGeneratedSecret] = useState(initialData?.secret || '')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WebhookForm>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      type: initialData?.type || 'GENERIC',
      secret: initialData?.secret || '',
      status: initialData?.status || 'ACTIVE',
    },
  })

  const createMutation = useMutation(webhooksApi.create, {
    onSuccess: (response) => {
      toast({
        title: 'Success',
        description: 'Webhook created successfully',
      })
      queryClient.invalidateQueries('webhooks')
      queryClient.invalidateQueries('webhooks-overview')
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create webhook',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation(
    (data: WebhookForm) => webhooksApi.update(initialData.id, data),
    {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Webhook updated successfully',
        })
        queryClient.invalidateQueries('webhooks')
        queryClient.invalidateQueries('webhooks-overview')
        onSuccess?.()
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to update webhook',
          variant: 'destructive',
        })
      },
    }
  )

  const onSubmit = (data: WebhookForm) => {
    const submitData = {
      ...data,
      secret: generatedSecret || undefined,
    }

    if (initialData) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  const generateSecret = () => {
    const secret = `wh_${generateId()}_${Date.now().toString(36)}`
    setGeneratedSecret(secret)
    setValue('secret', secret)
  }

  const copySecret = async () => {
    if (generatedSecret) {
      await copyToClipboard(generatedSecret)
      toast({
        title: 'Copied',
        description: 'Secret copied to clipboard',
      })
    }
  }

  const copyWebhookUrl = async () => {
    if (initialData?.url) {
      await copyToClipboard(initialData.url)
      toast({
        title: 'Copied',
        description: 'Webhook URL copied to clipboard',
      })
    }
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Webhook URL (for existing webhooks) */}
      {initialData?.url && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Webhook URL
          </label>
          <div className="flex items-center space-x-2">
            <Input
              value={initialData.url}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyWebhookUrl}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            This is your unique webhook endpoint URL. Use this to receive HTTP requests.
          </p>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name *
        </label>
        <Input
          id="name"
          placeholder="Enter webhook name"
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <Textarea
          id="description"
          placeholder="Describe what this webhook is used for..."
          rows={3}
          {...register('description')}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-2">
          Webhook Type
        </label>
        <Select
          value={watch('type')}
          onValueChange={(value) => setValue('type', value as 'GENERIC' | 'MEETING')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select webhook type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GENERIC">
              <div className="flex items-center">
                <span className="mr-2">📡</span>
                Generic Webhook
              </div>
            </SelectItem>
            <SelectItem value="MEETING">
              <div className="flex items-center">
                <span className="mr-2">🤝</span>
                Meeting Webhook
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          {watch('type') === 'MEETING'
            ? 'Meeting webhooks automatically create meeting reports when receiving meeting payloads'
            : 'Generic webhooks process and forward payloads without special handling'
          }
        </p>
      </div>

      {/* Secret */}
      <div>
        <label htmlFor="secret" className="block text-sm font-medium mb-2">
          Secret (Optional)
        </label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Input
                id="secret"
                type={showSecret ? 'text' : 'password'}
                placeholder="Enter webhook secret or generate one"
                value={generatedSecret}
                onChange={(e) => {
                  setGeneratedSecret(e.target.value)
                  setValue('secret', e.target.value)
                }}
                className="pr-20"
              />
              <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
                {generatedSecret && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={copySecret}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={generateSecret}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Optional secret for webhook verification. Include this in the X-Webhook-Secret header when making requests.
          </p>
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium mb-2">
          Status
        </label>
        <Select
          value={watch('status')}
          onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          Inactive webhooks will reject incoming requests
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
              {initialData ? 'Update Webhook' : 'Create Webhook'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
