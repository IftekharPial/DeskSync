'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { webhooksApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { formatDateTime, getStatusColor, copyToClipboard } from '@/lib/utils'
import {
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Activity,
  Settings,
  BarChart3,
  Webhook,
  Play,
  CheckCircle,
  XCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import Link from 'next/link'

interface WebhooksTableProps {
  onEdit?: (webhook: any) => void
}

export function WebhooksTable({ onEdit }: WebhooksTableProps) {
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery(
    ['webhooks', page],
    () => webhooksApi.getAll({ page, limit: 10 }),
    {
      select: (response) => {
        // The webhooks API returns { success: true, data: [...], pagination: {...} }
        // Axios wraps this in response.data, so we access response.data directly
        const webhooks = Array.isArray(response.data.data) ? response.data.data : []
        const pagination = response.data.pagination || null

        return { webhooks, pagination }
      },
      keepPreviousData: true,
    }
  )

  const deleteMutation = useMutation(webhooksApi.delete, {
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Webhook deleted successfully',
      })
      queryClient.invalidateQueries(['webhooks'])
      queryClient.invalidateQueries('webhooks-overview')
      setDeleteId(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete webhook',
        variant: 'destructive',
      })
    },
  })

  const testMutation = useMutation(
    (id: string) => webhooksApi.test(id),
    {
      onSuccess: (response) => {
        const result = response.data.data
        toast({
          title: 'Webhook Test Completed',
          description: `Test ${result.testStatus}. ${result.webhookResponse?.data?.deliveryResults?.length || 0} endpoints processed.`,
        })
        setTestingId(null)
      },
      onError: (error: any) => {
        toast({
          title: 'Test Failed',
          description: error.response?.data?.error || 'Failed to test webhook',
          variant: 'destructive',
        })
        setTestingId(null)
      },
    }
  )

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleTest = (id: string) => {
    setTestingId(id)
    testMutation.mutate(id)
  }

  const copyWebhookUrl = async (url: string) => {
    const fullUrl = `http://localhost:3001${url}`
    await copyToClipboard(fullUrl)
    toast({
      title: 'Copied',
      description: 'Complete webhook URL copied to clipboard',
    })
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading webhooks..." />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load webhooks</p>
      </div>
    )
  }

  // Safe array access with validation
  const webhooks = Array.isArray(data?.webhooks) ? data.webhooks : []
  const pagination = data?.pagination

  if (webhooks.length === 0) {
    return (
      <div className="text-center py-8">
        <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No webhooks found</h3>
        <p className="text-muted-foreground">
          Create your first webhook to start receiving HTTP requests
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
              <th className="text-left py-3 px-4 font-medium">Name</th>
              <th className="text-left py-3 px-4 font-medium">Type</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">URL</th>
              <th className="text-left py-3 px-4 font-medium">Endpoints</th>
              <th className="text-left py-3 px-4 font-medium">Requests</th>
              <th className="text-left py-3 px-4 font-medium">Created</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((webhook: any) => (
              <tr key={webhook.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  <div>
                    <Link
                      href={`/dashboard/webhooks/${webhook.id}`}
                      className="font-medium hover:text-primary hover:underline cursor-pointer"
                    >
                      {webhook.name}
                    </Link>
                    {webhook.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {webhook.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    webhook.type === 'MEETING'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {webhook.type === 'MEETING' ? '🤝 Meeting' : '📡 Generic'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(webhook.status)}`}>
                    {webhook.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono max-w-xs truncate">
                      {webhook.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyWebhookUrl(webhook.url)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">
                      {webhook.outgoingEndpoints?.length || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">endpoints</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm">
                    <div className="font-medium">{webhook._count?.payloadLogs || 0}</div>
                    <div className="text-xs text-muted-foreground">total</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(webhook.createdAt)}
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
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/webhooks/${webhook.id}`}>
                          <Activity className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(webhook)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Webhook
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/webhooks/${webhook.id}/endpoints`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Endpoints
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/webhooks/${webhook.id}/logs`}>
                          <Activity className="mr-2 h-4 w-4" />
                          View Logs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/webhooks/${webhook.id}/stats`}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Statistics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => copyWebhookUrl(webhook.url)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleTest(webhook.id)}
                        disabled={testingId === webhook.id}
                      >
                        {testingId === webhook.id ? (
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
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={webhook.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Endpoint
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(webhook.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} webhooks
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
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This will also delete all associated endpoints and logs. This action cannot be undone.
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
