'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Settings, Shield, CheckCircle } from 'lucide-react'

interface Profile {
  name: string | null
  account_type: 'normal' | 'broker'
  locked: boolean
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<Profile>({
    name: '',
    account_type: 'normal',
    locked: false
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [supportsName, setSupportsName] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'))
    }
  }, [user, loading])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        // First try selecting with name column
        let profQuery = await supabase
          .from('profiles')
          .select('name, account_type, locked')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profQuery.error) {
          // If name column does not exist, fall back without it
          const msg = String(profQuery.error.message || '')
          if (msg.toLowerCase().includes("'name' column") || msg.toLowerCase().includes('name') ) {
            setSupportsName(false)
            profQuery = await supabase
              .from('profiles')
              .select('account_type, locked')
              .eq('user_id', user.id)
              .maybeSingle()
          } else {
            console.error('Profile query error:', profQuery.error)
          }
        }

        if (profQuery.data) {
          const prof = profQuery.data as { name?: string; account_type?: string; locked?: boolean }
          setProfile({
            name: (supportsName ? (prof.name || '') : ''),
            account_type: (prof.account_type as 'normal' | 'broker') || 'normal',
            locked: !!prof.locked,
          })
          return
        }

        // No profile exists → bootstrap a default one (omit name when unsupported)
        const insertPayload: Record<string, unknown> = {
          user_id: user.id,
          account_type: 'normal',
          locked: false,
        }
        if (supportsName) insertPayload.name = null

        const selectColumns = supportsName ? 'name, account_type, locked' : 'account_type, locked'

        const { data: newProf, error: createErr } = await supabase
          .from('profiles')
          .insert(insertPayload)
          .select(selectColumns)
          .single()

        if (createErr) {
          setError(createErr.message || 'Failed to create profile')
          return
        }

        if (newProf) {
          const np = newProf as { name?: string; account_type?: string; locked?: boolean }
          setProfile({
            name: (supportsName ? (np.name || '') : ''),
            account_type: (np.account_type as 'normal' | 'broker') || 'normal',
            locked: !!np.locked,
          })
        }
      } catch (err) {
        setError('Failed to load profile')
        console.error('Profile load error:', err)
      }
    }

    loadProfile()
  }, [user, supportsName])

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload: Record<string, unknown> = {
        user_id: user.id,
        account_type: profile.account_type,
        locked: profile.locked,
        updated_at: new Date().toISOString(),
      }
      if (supportsName) payload.name = profile.name || null

      const { error: updateErr } = await supabase
        .from('profiles')
        .upsert(payload)

      if (updateErr) {
        setError(updateErr.message)
      } else {
        setSuccess('Profile updated successfully!')
        setIsEditing(false)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Failed to update profile')
      console.error('Profile update error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleLockAccountType = async () => {
    if (!user || profile.locked) return
    
    setSaving(true)
    setError('')

    try {
      const payload: Record<string, unknown> = {
        user_id: user.id,
        account_type: profile.account_type,
        locked: true,
        updated_at: new Date().toISOString(),
      }
      if (supportsName) payload.name = profile.name || null

      const { error: updateErr } = await supabase
        .from('profiles')
        .upsert(payload)

      if (updateErr) {
        setError(updateErr.message)
      } else {
        setProfile(prev => ({ ...prev, locked: true }))
        setSuccess('Account type locked successfully!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Failed to lock account type')
      console.error('Account lock error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Login required</h1>
              <p className="text-gray-600 mb-6">Please login to view your profile.</p>
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('open-login-modal'))
                  }
                }}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Open Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              {success}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 bg-gray-50 border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                  className="mt-1 border-gray-300"
                />
              </div>

              <div className="pt-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Type */}
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Account Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Current Account Type</Label>
                <Select 
                  value={profile.account_type} 
                  onValueChange={(v: 'normal' | 'broker') => setProfile(prev => ({ ...prev, account_type: v }))}
                  disabled={profile.locked}
                >
                  <SelectTrigger className="mt-1 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal User</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                  </SelectContent>
                </Select>
                
                {profile.locked && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Account type is locked. Contact support to change.
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Account Type Benefits</h4>
                <div className="space-y-1 text-xs text-blue-700">
                  <p><strong>Normal:</strong> Search and save properties, connect with flatmates</p>
                  <p><strong>Broker:</strong> List multiple properties, advanced analytics</p>
                </div>
              </div>

              {!profile.locked && (
                <Button
                  onClick={handleLockAccountType}
                  disabled={isSaving}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  {isSaving ? 'Locking...' : 'Lock Account Type (One-time)'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}