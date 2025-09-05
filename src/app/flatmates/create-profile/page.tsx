'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
// import { Checkbox } from '@/components/ui/checkbox'
import Switch from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ProfileImageUpload from '@/components/profile-image-upload'
import { supabase, type Flatmate } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/toast'
import { INDIAN_STATES, INDIAN_CITIES, getCitiesForState, findStateByName, findCityByName } from '@/lib/location-data'

// Generate a random alphabet for default avatar
const getRandomAlphabet = () => {
  const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return alphabets[Math.floor(Math.random() * alphabets.length)]
}

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
  image_url: '',
  created_at: new Date().toISOString(),
}

export default function CreateFlatmateProfilePage() {
  const [flatmate, setFlatmate] = useState<Flatmate>(defaultFlatmate)
  const [mounted, setMounted] = useState(false)
  const [amenityInput, setAmenityInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [selectedStateId, setSelectedStateId] = useState('')
  const [availableCities, setAvailableCities] = useState(getCitiesForState(''))
  const router = useRouter()
  const { user, loading } = useAuth()
  const [loginPrompted, setLoginPrompted] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => setMounted(true), [])

  // Initialize state and cities based on existing flatmate data
  useEffect(() => {
    if (flatmate.state) {
      const state = findStateByName(flatmate.state)
      if (state) {
        setSelectedStateId(state.id)
        setAvailableCities(getCitiesForState(state.id))
      }
    }
  }, [flatmate.state])

  // Handle state selection change
  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId)
    const state = INDIAN_STATES.find(s => s.id === stateId)
    const cities = getCitiesForState(stateId)
    setAvailableCities(cities)
    
    // Update flatmate state and reset city
    update('state' as keyof typeof flatmate, state?.name || '')
    update('city' as keyof typeof flatmate, '')
  }

  // Handle city selection change
  const handleCityChange = (cityId: string) => {
    const city = availableCities.find(c => c.id === cityId)
    update('city' as keyof typeof flatmate, city?.name || '')
  }

  // Gate route: if not logged in, open login modal and block rendering
  useEffect(() => {
    if (!loading && !user && !loginPrompted) {
      setLoginPrompted(true)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
    }
  }, [user, loading, loginPrompted])

  // Check limit: one profile per user (TEMPORARILY DISABLED)
  useEffect(() => {
    const checkLimit = async () => {
      if (!user) return
      // TODO: Re-enable this limit check when needed
      // const { count, error } = await supabase
      //   .from('flatmates')
      //   .select('id', { count: 'exact', head: true })
      //   .eq('user_id', user.id)
      // if (!error && (count || 0) > 0) {
      //   setLimitReached(true)
      // } else {
      //   setLimitReached(false)
      // }
      setLimitReached(false) // Always allow profile creation for now
    }
    checkLimit()
  }, [user])

  if (!mounted) return null
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-white-50">
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

    // TODO: Re-enable limit check when needed
    // if (limitReached) {
    //   setSubmitError('You already have a profile. Upgrade to add more (coming soon).')
    //   return
    // }

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
    <div className="min-h-screen bg-white-50">
      
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1">Create your profile</h1>
              <p className="text-sm text-gray-600">Keep it simple and clear. This helps others quickly understand you.</p>
            </div>

            {/* Form Content - Two Column Layout */}
            <div className="px-6 py-5">
              {limitReached && (
                <div className="mb-5 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">You can create one profile per account.</p>
                    <button type="button" className="px-3 py-1.5 text-xs font-medium rounded-md bg-purple-600 text-white cursor-not-allowed opacity-80" title="Paid feature coming soon" disabled>
                      Upgrade (coming soon)
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Personal Details */}
                <div className="space-y-5">
                  {/* Profile Photo */}
                  <div className="text-center">
                    <ProfileImageUpload
                      imageUrl={flatmate.image_url}
                      onImageChange={(url) => update('image_url', url)}
                      disabled={submitting}
                      userName={flatmate.name}
                    />
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name *</Label>
                        <Input id="name" value={flatmate.name} onChange={e => update('name', e.target.value)} placeholder="Your name" className="mt-1 h-9 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="company" className="text-sm font-medium text-gray-700">Company *</Label>
                        <Input id="company" value={flatmate.company} onChange={e => update('company', e.target.value)} placeholder="Company" className="mt-1 h-9 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">State</Label>
                          <Select value={selectedStateId} onValueChange={handleStateChange}>
                            <SelectTrigger className="mt-1 h-9 text-sm">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_STATES.map(state => (
                                <SelectItem key={state.id} value={state.id}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">City</Label>
                          <Select 
                            value={flatmate.city ? findCityByName(flatmate.city, selectedStateId)?.id || '' : ''} 
                            onValueChange={handleCityChange}
                            disabled={!selectedStateId}
                          >
                            <SelectTrigger className="mt-1 h-9 text-sm">
                              <SelectValue placeholder={selectedStateId ? "Select city" : "Select state first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCities.map(city => (
                                <SelectItem key={city.id} value={city.id}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age *</Label>
                          <Input id="age" type="number" value={flatmate.age} onChange={e => update('age', Number(e.target.value || 0))} placeholder="25" className="mt-1 h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Gender *</Label>
                          <Select value={flatmate.gender} onValueChange={v => update('gender', v)}>
                            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Budget Range</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="budgetMin" className="text-sm font-medium text-gray-700">Min (₹) *</Label>
                        <Input id="budgetMin" type="number" value={flatmate.budget_min} onChange={e => update('budget_min', Number(e.target.value || 0))} placeholder="15000" className="mt-1 h-9 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="budgetMax" className="text-sm font-medium text-gray-700">Max (₹) *</Label>
                        <Input id="budgetMax" type="number" value={flatmate.budget_max} onChange={e => update('budget_max', Number(e.target.value || 0))} placeholder="25000" className="mt-1 h-9 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Preferences & Lists */}
                <div className="space-y-5">
                  {/* Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Preferences</h3>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Food Preference</Label>
                      <Select value={flatmate.food_preference} onValueChange={(v: 'Veg' | 'Non-Veg' | 'Vegan') => update('food_preference', v)}>
                        <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Veg">Veg</SelectItem>
                          <SelectItem value="Non-Veg">Non-Veg</SelectItem>
                          <SelectItem value="Vegan">Vegan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2 px-3 border rounded text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Non-smoker</span>
                          <p className="text-xs text-gray-500">I don&apos;t smoke</p>
                        </div>
                        <Switch checked={flatmate.non_smoker} onCheckedChange={v => update('non_smoker', Boolean(v))} />
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 border rounded text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Gated Community</span>
                          <p className="text-xs text-gray-500">Prefer gated homes</p>
                        </div>
                        <Switch checked={flatmate.gated_community} onCheckedChange={v => update('gated_community', Boolean(v))} />
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Amenities</h3>
                    <div className="flex gap-2">
                      <Input 
                        value={amenityInput} 
                        onChange={e => setAmenityInput(e.target.value)} 
                        placeholder="Add amenity" 
                        className="h-9 text-sm" 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())} 
                      />
                      <Button type="button" variant="outline" onClick={addAmenity} className="h-9 px-3 text-sm">Add</Button>
                    </div>
                    {(flatmate.amenities || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {(flatmate.amenities || []).map(a => (
                          <span key={a} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {a}
                            <button type="button" onClick={() => removeFromArray('amenities', a)} className="text-gray-500 hover:text-gray-700 ml-1">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preferred Locations */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Preferred Locations</h3>
                    <div className="flex gap-2">
                      <Input 
                        value={locationInput} 
                        onChange={e => setLocationInput(e.target.value)} 
                        placeholder="Add location" 
                        className="h-9 text-sm" 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())} 
                      />
                      <Button type="button" variant="outline" onClick={addLocation} className="h-9 px-3 text-sm">Add</Button>
                    </div>
                    {(flatmate.preferred_locations || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {(flatmate.preferred_locations || []).map(l => (
                          <span key={l} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {l}
                            <button type="button" onClick={() => removeFromArray('preferred_locations', l)} className="text-gray-500 hover:text-gray-700 ml-1">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {submitError}
                </div>
              )}
            </div>
            
            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFlatmate(defaultFlatmate)}
                className="h-10 px-5 border-gray-300 hover:bg-white hover:border-gray-400"
              >
                Reset Form
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 px-6 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                {submitting ? 'Creating Profile...' : 'Create Profile'}
              </Button>
            </div>
          </form>

          {/* Live Preview removed per request */}
        </div>
      </main>
    </div>
  )
}


