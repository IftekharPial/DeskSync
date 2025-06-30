'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from 'react-query'
import { webhooksApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { WebhookForm } from '@/components/webhooks/webhook-form'
import { WebhooksTable } from '@/components/webhooks/webhooks-table'
import { WebhookStats } from '@/components/webhooks/webhook-stats'
import { Plus, Webhook, Activity, AlertCircle, MessageSquare } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default function WebhooksPage() {
  const { data: session } = useSession()
  const [showForm, setShowForm] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null)

  // Check if user is admin
  const isAdmin = (session as any)?.user?.role === 'ADMIN'
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Get webhooks overview
  const { data: webhooksData, isLoading: loadingWebhooks } = useQuery(
    'webhooks-overview',
    () => webhooksApi.getAll({ page: 1, limit: 5 }),
    {
      select: (response) => {
        // Ensure we always return a valid structure
        if (!response?.data) {
          return { webhooks: [], pagination: null }
        }

        // Type assertion to handle PaginatedResponse type mismatch
        const responseData = response.data as any
        if (Array.isArray(responseData)) {
          return { webhooks: responseData, pagination: null }
        }

        if (responseData.webhooks && Array.isArray(responseData.webhooks)) {
          return {
            webhooks: responseData.webhooks,
            pagination: responseData.pagination || null
          }
        }

        if (responseData.data && Array.isArray(responseData.data)) {
          return {
            webhooks: responseData.data,
            pagination: responseData.pagination || null
          }
        }

        return { webhooks: [], pagination: null }
      },
    }
  )

  const handleCreateWebhook = () => {
    setSelectedWebhook(null)
    setShowForm(true)
  }

  const handleEditWebhook = (webhook: any) => {
    setSelectedWebhook(webhook)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedWebhook(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Management</h1>
          <p className="text-muted-foreground">
            Manage incoming webhooks, endpoints, and message templates
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/webhooks/templates">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Templates
            </Button>
          </Link>
          <Button onClick={handleCreateWebhook}>
            <Plus className="mr-2 h-4 w-4" />
            Create Webhook
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <WebhookStats />

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Overview of webhook system health and recent activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                ✅ Operational
              </div>
              <div className="text-sm text-muted-foreground">System Status</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {Array.isArray(webhooksData?.webhooks) ? webhooksData.webhooks.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Webhooks</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                24/7
              </div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedWebhook ? 'Edit Webhook' : 'Create New Webhook'}
            </CardTitle>
            <CardDescription>
              {selectedWebhook 
                ? 'Update webhook configuration and settings'
                : 'Configure a new incoming webhook endpoint'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WebhookForm
              initialData={selectedWebhook}
              onSuccess={handleFormClose}
              onCancel={handleFormClose}
            />
          </CardContent>
        </Card>
      )}

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Webhook className="mr-2 h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Manage your incoming webhooks and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingWebhooks ? (
            <LoadingSpinner text="Loading webhooks..." />
          ) : (
            <WebhooksTable onEdit={handleEditWebhook} />
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Quick guide to setting up and using webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">1. Create a Webhook</h4>
                <p className="text-sm text-muted-foreground">
                  Start by creating a new webhook. You'll get a unique URL that can receive HTTP requests.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">2. Configure Endpoints</h4>
                <p className="text-sm text-muted-foreground">
                  Add outgoing endpoints where webhook payloads should be forwarded (Slack, Discord, etc.).
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">3. Set Up Templates</h4>
                <p className="text-sm text-muted-foreground">
                  Create message templates to transform incoming payloads into the format your endpoints expect.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">4. Monitor Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  Track delivery success rates, response times, and troubleshoot any issues.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
