'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { savesApi, type SaveItem } from '@/lib/saves'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [flats, setFlats] = useState<SaveItem[]>([])
  const [people, setPeople] = useState<SaveItem[]>([])
  const [error, setError] = useState('')
  const [accountType, setAccountType] = useState<'normal' | 'broker'>('normal')
  const [locked, setLocked] = useState(false)
  const [savingType, setSavingType] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'))
    }
  }, [user, loading])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      // Load or bootstrap profile
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('account_type, locked')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profErr) {
        // try to create if missing
        await supabase.from('profiles').insert({ user_id: user.id, account_type: 'normal', locked: false }).select().maybeSingle()
      } else if (prof) {
        setAccountType((prof.account_type as 'normal' | 'broker') || 'normal')
        setLocked(!!prof.locked)
      }
      const [sf, sp] = await Promise.all([
        savesApi.listSaves('flat'),
        savesApi.listSaves('person')
      ])
      if (sf.error || sp.error) {
        setError(sf.error?.message || sp.error?.message || 'Failed to load saves')
      }
      setFlats(sf.items)
      setPeople(sp.items)
    }
    load()
  }, [user])

  const handleConfirmAccountType = async () => {
    if (!user || locked) return
    setSavingType(true)
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, account_type: accountType, locked: true, updated_at: new Date().toISOString() })
      if (updErr) {
        setError(updErr.message)
      } else {
        setLocked(true)
      }
    } finally {
      setSavingType(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-2xl font-semibold mb-6">Profile</h1>
        {/* Account Type */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Account type</p>
              <div className="flex items-center gap-3">
                <Select value={accountType} onValueChange={(v: 'normal' | 'broker') => setAccountType(v)} disabled={locked}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                  </SelectContent>
                </Select>
                {!locked ? (
                  <Button size="sm" onClick={handleConfirmAccountType} disabled={savingType} className="bg-purple-600 hover:bg-purple-900">
                    {savingType ? 'Saving...' : 'Confirm (one-time)'}
                  </Button>
                ) : (
                  <span className="text-xs text-gray-500">Locked. Contact support to change.</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-3">Your Saved Items</h2>
        {error && (
          <div className="mb-4 text-red-600">{error}</div>
        )}
        <Tabs defaultValue="flats" className="w-full">
          <TabsList>
            <TabsTrigger value="flats">Saved Flats</TabsTrigger>
            <TabsTrigger value="people">Saved People</TabsTrigger>
          </TabsList>
          <TabsContent value="flats" className="mt-4">
            {flats.length === 0 ? (
              <div className="text-gray-500">No saved flats yet.</div>
            ) : (
              <ul className="space-y-2">
                {flats.map(s => (
                  <li key={s.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <span className="text-sm">Flat ID: {s.target_id}</span>
                    <Button size="sm" variant="outline" onClick={async () => { await savesApi.toggleSave('flat', s.target_id); setFlats(prev => prev.filter(i => i.id !== s.id)) }}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="people" className="mt-4">
            {people.length === 0 ? (
              <div className="text-gray-500">No saved people yet.</div>
            ) : (
              <ul className="space-y-2">
                {people.map(s => (
                  <li key={s.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <span className="text-sm">User ID: {s.target_id}</span>
                    <Button size="sm" variant="outline" onClick={async () => { await savesApi.toggleSave('person', s.target_id); setPeople(prev => prev.filter(i => i.id !== s.id)) }}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


