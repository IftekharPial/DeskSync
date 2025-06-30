'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Save,
  Key
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')

  // Get user profile
  const { data: profileData, isLoading: profileLoading } = useQuery(
    'user-profile',
    () => apiClient.get('/settings/profile'),
    {
      select: (response) => response.data.data,
    }
  )

  // Get application settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery(
    'app-settings',
    () => apiClient.get('/settings'),
    {
      select: (response) => response.data.data,
    }
  )

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data: any) => apiClient.put('/settings/profile', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-profile')
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        })
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        })
      },
    }
  )

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    (data: any) => apiClient.put('/settings', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('app-settings')
        toast({
          title: 'Settings updated',
          description: 'Application settings have been updated successfully.',
        })
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to update settings. Please try again.',
          variant: 'destructive',
        })
      },
    }
  )

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data: any) => apiClient.post('/settings/change-password', data),
    {
      onSuccess: () => {
        toast({
          title: 'Password changed',
          description: 'Your password has been changed successfully.',
        })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to change password.',
          variant: 'destructive',
        })
      },
    }
  )

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: false,
        desktop: true
      }
    }
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Update form when data loads
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        name: profileData.name || '',
        email: profileData.email || '',
        preferences: profileData.preferences || profileForm.preferences
      })
    }
  }, [profileData])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(profileForm)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      })
      return
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
  }

  if (profileLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and application preferences
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={(session as any)?.user?.role?.replace('_', ' ') || 'Support Agent'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isLoading}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={profileForm.preferences.notifications.email}
                  onCheckedChange={(checked) => 
                    setProfileForm({
                      ...profileForm,
                      preferences: {
                        ...profileForm.preferences,
                        notifications: {
                          ...profileForm.preferences.notifications,
                          email: checked
                        }
                      }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show desktop notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={profileForm.preferences.notifications.desktop}
                  onCheckedChange={(checked) => 
                    setProfileForm({
                      ...profileForm,
                      preferences: {
                        ...profileForm.preferences,
                        notifications: {
                          ...profileForm.preferences.notifications,
                          desktop: checked
                        }
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter your new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm your new password"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={changePasswordMutation.isLoading}
                  className="flex items-center space-x-2"
                >
                  <Key className="h-4 w-4" />
                  <span>{changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Current theme: {profileForm.preferences.theme}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Language</Label>
                <p className="text-sm text-muted-foreground">
                  Current language: English
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Timezone</Label>
                <p className="text-sm text-muted-foreground">
                  Current timezone: {profileForm.preferences.timezone}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
