'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FlatmateCard from '@/components/flatmate-card'
import { supabase, type Flatmate } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

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

    // Basic validation to satisfy NOT NULL constraints
    if (!flatmate.name.trim()) return setSubmitError('Please enter your name.')
    if (!flatmate.company.trim()) return setSubmitError('Please enter your company.')
    if (!flatmate.age || flatmate.age < 16) return setSubmitError('Please enter a valid age.')
    if (!flatmate.budget_min || !flatmate.budget_max) return setSubmitError('Please provide your budget range.')
    if (flatmate.budget_min > flatmate.budget_max) return setSubmitError('Budget min cannot exceed budget max.')

    setSubmitting(true)
    try {
      const { error } = await supabase.from('flatmates').insert({
        name: flatmate.name.trim(),
        age: flatmate.age,
        gender: flatmate.gender,
        company: flatmate.company.trim(),
        budget_min: flatmate.budget_min,
        budget_max: flatmate.budget_max,
        non_smoker: flatmate.non_smoker,
        food_preference: flatmate.food_preference,
        gated_community: flatmate.gated_community,
        amenities: flatmate.amenities || [],
        preferred_locations: flatmate.preferred_locations || [],
        image_url: flatmate.image_url || null,
      })

      if (error) {
        setSubmitError(error.message || 'Failed to save profile. Please try again.')
        return
      }

      router.push('/flatmates')
    } catch (err) {
      setSubmitError('Unexpected error. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-7">
            <h1 className="text-2xl font-semibold">Create your profile</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={flatmate.name} onChange={e => update('name', e.target.value)} placeholder="Your name" className="mt-2 h-11 rounded-lg" />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" value={flatmate.age} onChange={e => update('age', Number(e.target.value || 0))} className="mt-2 h-11 rounded-lg" />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={flatmate.gender} onValueChange={v => update('gender', v)}>
                  <SelectTrigger className="mt-2 h-11 rounded-lg"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={flatmate.company} onChange={e => update('company', e.target.value)} placeholder="Company" className="mt-2 h-11 rounded-lg" />
              </div>
              <div>
                <Label htmlFor="budgetMin">Budget min (₹)</Label>
                <Input id="budgetMin" type="number" value={flatmate.budget_min} onChange={e => update('budget_min', Number(e.target.value || 0))} className="mt-2 h-11 rounded-lg" />
              </div>
              <div>
                <Label htmlFor="budgetMax">Budget max (₹)</Label>
                <Input id="budgetMax" type="number" value={flatmate.budget_max} onChange={e => update('budget_max', Number(e.target.value || 0))} className="mt-2 h-11 rounded-lg" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Checkbox id="nonSmoker" checked={flatmate.non_smoker} onCheckedChange={v => update('non_smoker', Boolean(v))} />
                <Label htmlFor="nonSmoker">Non-smoker</Label>
              </div>
              <div>
                <Label>Food preference</Label>
                <Select value={flatmate.food_preference} onValueChange={(v: 'Veg' | 'Non-Veg' | 'Vegan') => update('food_preference', v)}>
                  <SelectTrigger className="mt-2 h-11 rounded-lg"><SelectValue placeholder="Select preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Veg">Veg</SelectItem>
                    <SelectItem value="Non-Veg">Non-Veg</SelectItem>
                    <SelectItem value="Vegan">Vegan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Checkbox id="gated" checked={flatmate.gated_community} onCheckedChange={v => update('gated_community', Boolean(v))} />
                <Label htmlFor="gated">Gated community preference</Label>
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

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setFlatmate(defaultFlatmate)} className="h-11 px-5">Reset</Button>
              <Button type="submit" disabled={submitting} className="h-11 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>

          {/* Live Preview */}
          <div>
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Live preview</h2>
              <FlatmateCard flatmate={flatmate} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


