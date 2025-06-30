'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Edit, Trash2, MessageSquare, Webhook } from 'lucide-react'

interface MessageTemplate {
  id: string
  name: string
  template: string
  type: 'SLACK' | 'TEAMS' | 'API' | 'GOOGLE_SHEETS'
  webhookType: 'GENERIC' | 'MEETING'
  createdAt: string
}

const messageTemplatesApi = {
  getAll: () => fetch('/api/message-templates').then(res => res.json()),
  create: (data: Partial<MessageTemplate>) =>
    fetch('/api/message-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  update: (id: string, data: Partial<MessageTemplate>) =>
    fetch(`/api/message-templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  delete: (id: string) =>
    fetch(`/api/message-templates/${id}`, {
      method: 'DELETE'
    }).then(res => res.json())
}

export default function MessageTemplatesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: templatesResponse, isLoading } = useQuery(
    'message-templates',
    messageTemplatesApi.getAll
  )

  const templates = templatesResponse?.data || []

  const createMutation = useMutation(messageTemplatesApi.create, {
    onSuccess: () => {
      toast({ title: 'Success', description: 'Template created successfully' })
      queryClient.invalidateQueries('message-templates')
      setIsCreateOpen(false)
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create template', variant: 'destructive' })
    }
  })

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<MessageTemplate> }) =>
      messageTemplatesApi.update(id, data),
    {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Template updated successfully' })
        queryClient.invalidateQueries('message-templates')
        setEditingTemplate(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to update template', variant: 'destructive' })
      }
    }
  )

  const deleteMutation = useMutation(messageTemplatesApi.delete, {
    onSuccess: () => {
      toast({ title: 'Success', description: 'Template deleted successfully' })
      queryClient.invalidateQueries('message-templates')
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete template', variant: 'destructive' })
    }
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SLACK': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'TEAMS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'API': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'GOOGLE_SHEETS': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getWebhookTypeColor = (webhookType: string) => {
    return webhookType === 'MEETING' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading templates...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message Templates</h1>
          <p className="text-muted-foreground">
            Manage templates for webhook notifications and messages
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Message Template</DialogTitle>
              <DialogDescription>
                Create a new message template for webhook notifications
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template: MessageTemplate) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                    <Badge className={getWebhookTypeColor(template.webhookType)}>
                      {template.webhookType === 'MEETING' ? '🤝 Meeting' : '📡 Generic'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Template Content:</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {template.template}
                    </pre>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Message Template</DialogTitle>
              <DialogDescription>
                Update the message template configuration
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              template={editingTemplate}
              onSubmit={(data) => updateMutation.mutate({ id: editingTemplate.id, data })}
              isLoading={updateMutation.isLoading}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function TemplateForm({ 
  template, 
  onSubmit, 
  isLoading 
}: { 
  template?: MessageTemplate
  onSubmit: (data: Partial<MessageTemplate>) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    template: template?.template || '',
    type: template?.type || 'SLACK',
    webhookType: template?.webhookType || 'GENERIC'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Meeting Slack Notification"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Destination Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SLACK">Slack</SelectItem>
              <SelectItem value="TEAMS">Microsoft Teams</SelectItem>
              <SelectItem value="API">API Endpoint</SelectItem>
              <SelectItem value="GOOGLE_SHEETS">Google Sheets</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhookType">Webhook Type</Label>
        <Select value={formData.webhookType} onValueChange={(value) => setFormData({ ...formData, webhookType: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GENERIC">Generic Webhook</SelectItem>
            <SelectItem value="MEETING">Meeting Webhook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">Template Content</Label>
        <Textarea
          id="template"
          value={formData.template}
          onChange={(e) => setFormData({ ...formData, template: e.target.value })}
          placeholder="Enter your template with variables like {{meetingTitle}}"
          rows={6}
          required
        />
        <div className="text-sm text-muted-foreground">
          Use variables like <code>{`{{meetingTitle}}`}</code>, <code>{`{{clientName}}`}</code>, <code>{`{{startTimeFormatted}}`}</code>, <code>{`{{meetingId}}`}</code>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  )
}
