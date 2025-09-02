'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, type Flatmate } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/toast'

const defaultFlatmate: Flatmate = {
  id: 'preview',
  name: '',
  age: 25,
  gender: 'Male',
  company: '',
  budget_min: 10000,
  budget_max: 25000,
  non_smoker: true,
  food_preference: 'Veg',
  gated_community: false,
  amenities: [],
  preferred_locations: [],
  image_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face',
  created_at: new Date().toISOString(),
}

export default function CreateFlatmateProfilePage() {
  const [flatmate, setFlatmate] = useState<Flatmate>(defaultFlatmate)
  const [mounted, setMounted] = useState(false)
  const [amenityInput, setAmenityInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const router = useRouter()
  const { user, loading } = useAuth()
  const [loginPrompted, setLoginPrompted] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => setMounted(true), [])

  // Gate route: if not logged in, open login modal and block rendering
  useEffect(() => {
    if (!loading && !user && !loginPrompted) {
      setLoginPrompted(true)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
    }
  }, [user, loading, loginPrompted])

  // Check limit: one profile per user
  useEffect(() => {
    const checkLimit = async () => {
      if (!user) return
      const { count, error } = await supabase
        .from('flatmates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (!error && (count || 0) > 0) {
        setLimitReached(true)
      } else {
        setLimitReached(false)
      }
    }
    checkLimit()
  }, [user])

  if (!mounted) return null
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Login required</h1>
            <p className="text-gray-600 mb-6">Please login to create your profile.</p>
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('open-login-modal'))
                }
              }}
              className="bg-purple-600 hover:bg-purple-900"
            >
              Open Login
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const update = <K extends keyof Flatmate>(key: K, value: Flatmate[K]) => {
    setFlatmate(prev => ({ ...prev, [key]: value }))
  }

  const addAmenity = () => {
    const v = amenityInput.trim()
    if (!v) return
    update('amenities', Array.from(new Set([...(flatmate.amenities || []), v])))
    setAmenityInput('')
  }

  const addLocation = () => {
    const v = locationInput.trim()
    if (!v) return
    update('preferred_locations', Array.from(new Set([...(flatmate.preferred_locations || []), v])))
    setLocationInput('')
  }

  const removeFromArray = (key: 'amenities' | 'preferred_locations', value: string) => {
    update(key, (flatmate[key] || []).filter(v => v !== value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!user) {
      setSubmitError('Please login to create a profile.')
      return
    }

    if (limitReached) {
      setSubmitError('You already have a profile. Upgrade to add more (coming soon).')
      return
    }

    // Basic validation to satisfy NOT NULL constraints
    if (!flatmate.name.trim()) return setSubmitError('Please enter your name.')
    if (!flatmate.company.trim()) return setSubmitError('Please enter your company.')
    if (!flatmate.age || flatmate.age < 16) return setSubmitError('Please enter a valid age.')
    if (!flatmate.budget_min || !flatmate.budget_max) return setSubmitError('Please provide your budget range.')
    if (flatmate.budget_min > flatmate.budget_max) return setSubmitError('Budget min cannot exceed budget max.')

    setSubmitting(true)
    try {
      const { error } = await supabase.from('flatmates').insert({
        user_id: user.id,
        name: flatmate.name.trim(),
        age: flatmate.age,
        gender: flatmate.gender,
        company: flatmate.company.trim(),
        budget_min: flatmate.budget_min,
        budget_max: flatmate.budget_max,
        non_smoker: flatmate.non_smoker,
        food_preference: flatmate.food_preference,
        gated_community: flatmate.gated_community,
        city: (flatmate.city || '').trim(),
        state: (flatmate.state || '').trim(),
        amenities: flatmate.amenities || [],
        preferred_locations: flatmate.preferred_locations || [],
        image_url: flatmate.image_url || null,
      })

      if (error) {
        setSubmitError(error.message || 'Failed to save profile. Please try again.')
        return
      }

      showToast('Your profile has been created.', { variant: 'success' })
      router.push('/flatmates')
    } catch (err) {
      setSubmitError('Unexpected error. Please try again.')
      showToast('Failed to create profile. Please try again.', { variant: 'error' })
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h1 className="text-2xl font-semibold mb-4">Create your profile</h1>

            {limitReached && (
              <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">You can create one profile per account.</p>
                  <button type="button" className="px-3 py-1.5 text-sm rounded-md bg-purple-600 text-white cursor-not-allowed opacity-80" title="Paid feature coming soon" disabled>
                    Upgrade (coming soon)
                  </button>
                </div>
              </div>
            )}

            {/* Single-page grid with comfortable spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={flatmate.name} onChange={e => update('name', e.target.value)} placeholder="Your name" className="mt-2 h-11 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={flatmate.company} onChange={e => update('company', e.target.value)} placeholder="Company" className="mt-2 h-11 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" value={flatmate.age} onChange={e => update('age', Number(e.target.value || 0))} className="mt-2 h-11 rounded-lg" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={flatmate.gender} onValueChange={v => update('gender', v)}>
                      <SelectTrigger className="mt-2 h-11 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={flatmate.city || ''} onChange={e => update('city' as keyof typeof flatmate, e.target.value)} placeholder="e.g., Bangalore" className="mt-2 h-11 rounded-lg" />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={flatmate.state || ''} onChange={e => update('state' as keyof typeof flatmate, e.target.value)} placeholder="e.g., Karnataka" className="mt-2 h-11 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="budgetMin">Budget min (₹)</Label>
                    <Input id="budgetMin" type="number" value={flatmate.budget_min} onChange={e => update('budget_min', Number(e.target.value || 0))} className="mt-2 h-11 rounded-lg" />
                  </div>
                  <div>
                    <Label htmlFor="budgetMax">Budget max (₹)</Label>
                    <Input id="budgetMax" type="number" value={flatmate.budget_max} onChange={e => update('budget_max', Number(e.target.value || 0))} className="mt-2 h-11 rounded-lg" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Checkbox id="nonSmoker" checked={flatmate.non_smoker} onCheckedChange={v => update('non_smoker', Boolean(v))} />
                  <Label htmlFor="nonSmoker">Non-smoker</Label>
                </div>
              </div>

              {/* Column 2 continued */}
              <div className="space-y-4">
                <div>
                  <Label>Food preference</Label>
                  <Select value={flatmate.food_preference} onValueChange={(v: 'Veg' | 'Non-Veg' | 'Vegan') => update('food_preference', v)}>
                    <SelectTrigger className="mt-2 h-11 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Veg">Veg</SelectItem>
                      <SelectItem value="Non-Veg">Non-Veg</SelectItem>
                      <SelectItem value="Vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Checkbox id="gated" checked={flatmate.gated_community} onCheckedChange={v => update('gated_community', Boolean(v))} />
                  <Label htmlFor="gated">Gated community</Label>
                </div>
                <div>
                  <Label htmlFor="imageUrl">Profile image URL</Label>
                  <Input id="imageUrl" value={flatmate.image_url} onChange={e => update('image_url', e.target.value)} placeholder="https://..." className="mt-2 h-11 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <Label>Amenities</Label>
              <div className="flex gap-3 mt-3">
                <Input value={amenityInput} onChange={e => setAmenityInput(e.target.value)} placeholder="Add amenity" className="h-11 rounded-lg" />
                <Button type="button" variant="outline" onClick={addAmenity} className="h-11 px-4">Add</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {(flatmate.amenities || []).map(a => (
                  <span key={a} className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                    {a}
                    <button type="button" onClick={() => removeFromArray('amenities', a)} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred locations */}
            <div>
              <Label>Preferred locations</Label>
              <div className="flex gap-3 mt-3">
                <Input value={locationInput} onChange={e => setLocationInput(e.target.value)} placeholder="Add location" className="h-11 rounded-lg" />
                <Button type="button" variant="outline" onClick={addLocation} className="h-11 px-4">Add</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {(flatmate.preferred_locations || []).map(l => (
                  <span key={l} className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                    {l}
                    <button type="button" onClick={() => removeFromArray('preferred_locations', l)} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setFlatmate(defaultFlatmate)} className="h-11 px-5">Reset</Button>
              <Button type="submit" disabled={submitting || limitReached} className="h-11 px-5 bg-purple-600 hover:bg-purple-900 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>

          {/* Live Preview removed per request */}
        </div>
      </main>
    </div>
  )
}


