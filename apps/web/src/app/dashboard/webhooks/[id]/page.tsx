'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { webhooksApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  ArrowLeft, 
  Copy, 
  Edit, 
  Trash2, 
  Play, 
  Settings, 
  Activity,
  Globe,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { copyToClipboard } from '@/lib/utils'
import Link from 'next/link'

export default function WebhookDetailPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const params = useParams()
  const webhookId = params.id as string

  const [testingWebhook, setTestingWebhook] = useState(false)

  // Check if user is admin
  const isAdmin = (session as any)?.user?.role === 'ADMIN'
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Get webhook details
  const { data: webhook, isLoading, error } = useQuery(
    ['webhook', webhookId],
    () => webhooksApi.getById(webhookId),
    {
      select: (response) => response.data?.data,
      enabled: !!webhookId,
    }
  )

  // Delete webhook mutation
  const deleteMutation = useMutation(webhooksApi.delete, {
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Webhook deleted successfully',
      })
      router.push('/dashboard/webhooks')
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete webhook',
        variant: 'destructive',
      })
    },
  })

  // Test webhook mutation
  const testMutation = useMutation(
    () => webhooksApi.test(webhookId),
    {
      onSuccess: (response) => {
        const result = response.data.data
        toast({
          title: 'Webhook Test Completed',
          description: `Test ${result.testStatus}. ${result.webhookResponse?.data?.deliveryResults?.length || 0} endpoints processed.`,
        })
        setTestingWebhook(false)
      },
      onError: (error: any) => {
        toast({
          title: 'Test Failed',
          description: error.response?.data?.error || 'Failed to test webhook',
          variant: 'destructive',
        })
        setTestingWebhook(false)
      },
    }
  )

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      deleteMutation.mutate(webhookId)
    }
  }

  const handleTest = () => {
    setTestingWebhook(true)
    testMutation.mutate()
  }

  const copyWebhookUrl = async () => {
    if (webhook?.url) {
      const fullUrl = `http://localhost:3001${webhook.url}`
      await copyToClipboard(fullUrl)
      toast({
        title: 'Copied',
        description: 'Webhook URL copied to clipboard',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getTypeColor = (type: string) => {
    return type === 'MEETING' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !webhook) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/webhooks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Webhooks
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Webhook Not Found</h3>
              <p className="text-muted-foreground">
                The webhook you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/webhooks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Webhooks
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{webhook.name}</h1>
            <p className="text-muted-foreground">
              {webhook.description || 'No description provided'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testingWebhook}
          >
            {testingWebhook ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Testing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Test Webhook
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/webhooks/${webhookId}/endpoints`}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Endpoints
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Webhook Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Information</CardTitle>
            <CardDescription>
              Basic webhook configuration and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge className={getStatusColor(webhook.status)}>
                {webhook.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Type:</span>
              <Badge className={getTypeColor(webhook.type)}>
                {webhook.type === 'MEETING' ? '🤝 Meeting' : '📡 Generic'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(webhook.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">ID:</span>
              <span className="text-sm font-mono text-muted-foreground">
                {webhook.id}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook URL</CardTitle>
            <CardDescription>
              Use this URL to send HTTP requests to this webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={`http://localhost:3001${webhook.url}`}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyWebhookUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is your unique webhook endpoint URL. External services can send HTTP POST requests to this URL.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common webhook management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" asChild className="h-auto p-4">
              <Link href={`/dashboard/webhooks/${webhookId}/endpoints`}>
                <div className="text-center">
                  <Globe className="mx-auto h-8 w-8 mb-2" />
                  <div className="font-medium">Manage Endpoints</div>
                  <div className="text-sm text-muted-foreground">
                    Configure where payloads are forwarded
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4" onClick={handleTest}>
              <div className="text-center">
                <Play className="mx-auto h-8 w-8 mb-2" />
                <div className="font-medium">Test Webhook</div>
                <div className="text-sm text-muted-foreground">
                  Send a test payload to verify functionality
                </div>
              </div>
            </Button>
            <Button variant="outline" asChild className="h-auto p-4">
              <Link href="/dashboard/webhooks/templates">
                <div className="text-center">
                  <Edit className="mx-auto h-8 w-8 mb-2" />
                  <div className="font-medium">Message Templates</div>
                  <div className="text-sm text-muted-foreground">
                    Manage notification templates
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
