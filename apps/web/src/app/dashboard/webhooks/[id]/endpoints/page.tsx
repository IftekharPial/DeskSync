'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { endpointsApi, webhooksApi } from '@/lib/api'
import { 
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  TestTube,
  Globe,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function WebhookEndpointsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const params = useParams()
  const webhookId = params.id as string

  const [showForm, setShowForm] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null)
  const [endpointForm, setEndpointForm] = useState({
    name: '',
    url: '',
    method: 'POST',
    headers: '{"Content-Type": "application/json"}',
    isActive: true,
    retryAttempts: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000
  })

  // Check if user is admin
  const isAdmin = (session as any)?.user?.role === 'ADMIN'
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Get webhook details
  const { data: webhook, isLoading: webhookLoading } = useQuery(
    ['webhook', webhookId],
    () => webhooksApi.getById(webhookId),
    {
      select: (response) => response.data.data,
    }
  )

  // Get endpoints for this webhook
  const { data: endpointsData, isLoading: endpointsLoading } = useQuery(
    ['endpoints', webhookId],
    () => endpointsApi.getAll({ webhookId }),
    {
      select: (response) => response.data.data,
    }
  )

  // Create endpoint mutation
  const createEndpointMutation = useMutation(
    (data: any) => endpointsApi.create({ ...data, incomingWebhookId: webhookId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['endpoints', webhookId])
        setShowForm(false)
        resetForm()
        toast({
          title: 'Endpoint created',
          description: 'Outgoing endpoint has been created successfully.',
        })
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to create endpoint. Please try again.',
          variant: 'destructive',
        })
      },
    }
  )

  // Update endpoint mutation
  const updateEndpointMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => endpointsApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['endpoints', webhookId])
        setShowForm(false)
        setSelectedEndpoint(null)
        resetForm()
        toast({
          title: 'Endpoint updated',
          description: 'Outgoing endpoint has been updated successfully.',
        })
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to update endpoint. Please try again.',
          variant: 'destructive',
        })
      },
    }
  )

  // Delete endpoint mutation
  const deleteEndpointMutation = useMutation(
    (endpointId: string) => endpointsApi.delete(endpointId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['endpoints', webhookId])
        toast({
          title: 'Endpoint deleted',
          description: 'Outgoing endpoint has been deleted successfully.',
        })
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete endpoint. Please try again.',
          variant: 'destructive',
        })
      },
    }
  )

  // Test endpoint mutation
  const testEndpointMutation = useMutation(
    (endpointId: string) => endpointsApi.test(endpointId, { test: 'payload' }),
    {
      onSuccess: () => {
        toast({
          title: 'Test successful',
          description: 'Endpoint test completed successfully.',
        })
      },
      onError: () => {
        toast({
          title: 'Test failed',
          description: 'Endpoint test failed. Check your configuration.',
          variant: 'destructive',
        })
      },
    }
  )

  const resetForm = () => {
    setEndpointForm({
      name: '',
      url: '',
      method: 'POST',
      headers: '{"Content-Type": "application/json"}',
      isActive: true,
      retryAttempts: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000
    })
  }

  const handleEdit = (endpoint: any) => {
    setSelectedEndpoint(endpoint)
    setEndpointForm({
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: JSON.stringify(endpoint.headers, null, 2),
      isActive: endpoint.isActive,
      retryAttempts: endpoint.retryAttempts,
      retryDelayMs: endpoint.retryDelayMs,
      timeoutMs: endpoint.timeoutMs
    })
    setShowForm(true)
  }

  const handleDelete = (endpointId: string, endpointName: string) => {
    if (confirm(`Are you sure you want to delete "${endpointName}"?`)) {
      deleteEndpointMutation.mutate(endpointId)
    }
  }

  const handleTest = (endpointId: string) => {
    testEndpointMutation.mutate(endpointId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const headers = JSON.parse(endpointForm.headers)
      const data = {
        ...endpointForm,
        headers,
        retryAttempts: Number(endpointForm.retryAttempts),
        retryDelayMs: Number(endpointForm.retryDelayMs),
        timeoutMs: Number(endpointForm.timeoutMs)
      }

      if (selectedEndpoint) {
        updateEndpointMutation.mutate({ id: selectedEndpoint.id, data })
      } else {
        createEndpointMutation.mutate(data)
      }
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'Please check your headers JSON format.',
        variant: 'destructive',
      })
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedEndpoint(null)
    resetForm()
  }

  if (webhookLoading || endpointsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading webhook endpoints..." />
      </div>
    )
  }

  const endpoints = endpointsData || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/webhooks')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Webhooks</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Outgoing Endpoints</h1>
            <p className="text-muted-foreground">
              Manage outgoing endpoints for webhook: {webhook?.name}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Endpoint</span>
        </Button>
      </div>

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Webhook Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm text-muted-foreground">{webhook?.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant={webhook?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {webhook?.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Endpoints</Label>
              <p className="text-sm text-muted-foreground">{endpoints.length} configured</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outgoing Endpoints</CardTitle>
          <CardDescription>
            Configure where webhook payloads should be forwarded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {endpoints.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No endpoints</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first outgoing endpoint.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Endpoint
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Retry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((endpoint: any) => (
                    <TableRow key={endpoint.id}>
                      <TableCell className="font-medium">{endpoint.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{endpoint.url}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{endpoint.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {endpoint.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {endpoint.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{endpoint.retryAttempts}x</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTest(endpoint.id)}>
                              <TestTube className="mr-2 h-4 w-4" />
                              Test
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(endpoint)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(endpoint.id, endpoint.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Endpoint Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEndpoint ? 'Edit Endpoint' : 'Create New Endpoint'}
            </DialogTitle>
            <DialogDescription>
              Configure an outgoing endpoint to forward webhook payloads
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={endpointForm.name}
                  onChange={(e) => setEndpointForm({ ...endpointForm, name: e.target.value })}
                  placeholder="e.g., Slack Notifications"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method</Label>
                <Select
                  value={endpointForm.method}
                  onValueChange={(value) => setEndpointForm({ ...endpointForm, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Destination URL</Label>
              <Input
                id="url"
                type="url"
                value={endpointForm.url}
                onChange={(e) => setEndpointForm({ ...endpointForm, url: e.target.value })}
                placeholder="https://hooks.slack.com/services/..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={endpointForm.headers}
                onChange={(e) => setEndpointForm({ ...endpointForm, headers: e.target.value })}
                placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="retryAttempts">Retry Attempts</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  min="0"
                  max="10"
                  value={endpointForm.retryAttempts}
                  onChange={(e) => setEndpointForm({ ...endpointForm, retryAttempts: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryDelayMs">Retry Delay (ms)</Label>
                <Input
                  id="retryDelayMs"
                  type="number"
                  min="100"
                  value={endpointForm.retryDelayMs}
                  onChange={(e) => setEndpointForm({ ...endpointForm, retryDelayMs: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeoutMs">Timeout (ms)</Label>
                <Input
                  id="timeoutMs"
                  type="number"
                  min="1000"
                  value={endpointForm.timeoutMs}
                  onChange={(e) => setEndpointForm({ ...endpointForm, timeoutMs: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={endpointForm.isActive}
                  onChange={(e) => setEndpointForm({ ...endpointForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Button type="button" variant="outline" onClick={handleFormClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createEndpointMutation.isLoading || updateEndpointMutation.isLoading}
                >
                  {selectedEndpoint ? 'Update' : 'Create'} Endpoint
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
