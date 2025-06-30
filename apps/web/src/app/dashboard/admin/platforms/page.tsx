'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Settings
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { toast } from 'sonner'

interface SupportPlatform {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PlatformFormData {
  name: string
  isActive: boolean
}

export default function PlatformsManagementPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<SupportPlatform | null>(null)
  const [formData, setFormData] = useState<PlatformFormData>({
    name: '',
    isActive: true
  })

  // Check if user is admin
  const isAdmin = (session as any)?.user?.role === 'ADMIN'
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Fetch platforms
  const { data: platformsData, isLoading, error } = useQuery(
    ['admin-platforms', searchTerm],
    async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/admin/platforms?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch platforms')
      }
      return response.json()
    },
    {
      refetchOnWindowFocus: false,
    }
  )

  // Create platform mutation
  const createPlatformMutation = useMutation(
    async (data: PlatformFormData) => {
      const response = await fetch('/api/admin/platforms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create platform')
      }
      
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-platforms'])
        setShowCreateDialog(false)
        setFormData({ name: '', isActive: true })
        toast.success('Platform created successfully')
      },
      onError: (error: Error) => {
        toast.error(error.message)
      },
    }
  )

  // Update platform mutation
  const updatePlatformMutation = useMutation(
    async ({ id, data }: { id: string; data: Partial<PlatformFormData> }) => {
      const response = await fetch(`/api/admin/platforms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update platform')
      }
      
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-platforms'])
        setEditingPlatform(null)
        setFormData({ name: '', isActive: true })
        toast.success('Platform updated successfully')
      },
      onError: (error: Error) => {
        toast.error(error.message)
      },
    }
  )

  // Delete platform mutation
  const deletePlatformMutation = useMutation(
    async (id: string) => {
      const response = await fetch(`/api/admin/platforms/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to archive platform')
      }
      
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-platforms'])
        toast.success('Platform archived successfully')
      },
      onError: (error: Error) => {
        toast.error(error.message)
      },
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingPlatform) {
      updatePlatformMutation.mutate({
        id: editingPlatform.id,
        data: formData
      })
    } else {
      createPlatformMutation.mutate(formData)
    }
  }

  const handleEdit = (platform: SupportPlatform) => {
    setEditingPlatform(platform)
    setFormData({
      name: platform.name,
      isActive: platform.isActive
    })
  }

  const handleToggleActive = (platform: SupportPlatform) => {
    updatePlatformMutation.mutate({
      id: platform.id,
      data: { isActive: !platform.isActive }
    })
  }

  const platforms = platformsData?.data?.platforms || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">Error loading platforms</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Management</h1>
          <p className="text-muted-foreground">
            Manage support platforms for daily reporting
          </p>
        </div>
        
        <Dialog open={showCreateDialog || !!editingPlatform} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setEditingPlatform(null)
            setFormData({ name: '', isActive: true })
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlatform ? 'Edit Platform' : 'Create New Platform'}
              </DialogTitle>
              <DialogDescription>
                {editingPlatform 
                  ? 'Update the platform details below.'
                  : 'Add a new support platform for daily reporting.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Platform Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Facebook, YouTube, Crisp Chat"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setEditingPlatform(null)
                    setFormData({ name: '', isActive: true })
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPlatformMutation.isLoading || updatePlatformMutation.isLoading}
                >
                  {createPlatformMutation.isLoading || updatePlatformMutation.isLoading ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : null}
                  {editingPlatform ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Platforms</CardTitle>
          <CardDescription>
            Manage the list of support platforms available for daily reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search platforms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platforms.map((platform: SupportPlatform) => (
                <TableRow key={platform.id}>
                  <TableCell className="font-medium">{platform.name}</TableCell>
                  <TableCell>
                    <Badge variant={platform.isActive ? 'default' : 'secondary'}>
                      {platform.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(platform.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(platform)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(platform)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePlatformMutation.mutate(platform.id)}
                        disabled={deletePlatformMutation.isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {platforms.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No platforms found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
