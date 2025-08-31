"use client"

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Upload, 
  Sparkles, 
  X,
  DollarSign,
  Users
} from 'lucide-react'
import { supabase, type FlatmatePreferences } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

// Property types for dropdown
const PROPERTY_TYPES = [
  'Flat',
  '1BHK',
  '2BHK', 
  '3BHK',
  'PG',
  'Other'
]

// Available highlights/amenities
const AVAILABLE_HIGHLIGHTS = [
  'Lift', 'Security', 'Gym', 'Balcony', 'Parking', 
  'Fully Furnished', 'Semi Furnished', 'AC', 'WiFi',
  'Swimming Pool', 'Clubhouse', 'Garden', 'Power Backup',
  'Water Supply', 'Nearby Metro', 'Shopping Mall'
]

interface FormData {
  userType: 'normal' | 'broker'
  title: string
  propertyType: string
  location: string
  areaSqft: string
  floor: string
  description: string
  highlights: string[]
  rent: string
  maintenance: string
  securityDeposit: string
  expenses: string
  flatmatePreferences: FlatmatePreferences
  contactNumber: string
  images: File[]
}

const initialFormData: FormData = {
  userType: 'normal',
  title: '',
  propertyType: '',
  location: '',
  areaSqft: '',
  floor: '',
  description: '',
  highlights: [],
  rent: '',
  maintenance: '',
  securityDeposit: '',
  expenses: '',
  flatmatePreferences: {
    gender: 'Any',
    smoker: false,
    food: 'Any',
    pets: false
  },
  contactNumber: '',
  images: []
}

// AI parsing function (mock implementation for now)
const parseListingText = async (text: string): Promise<Partial<FormData>> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock parsing logic for the example text
  const parsed: Partial<FormData> = {}
  
  // Extract title
  if (text.includes('Male Flatmate Needed') && text.includes('3BHK')) {
    parsed.title = 'Spacious 3BHK in Madhapur, Siddhi Vinayak Nagar'
    parsed.propertyType = '3BHK'
  }
  
  // Extract location
  if (text.includes('Madhapur') && text.includes('Siddhi Vinayak Nagar')) {
    parsed.location = 'Madhapur, Siddhi Vinayak Nagar'
  }
  
  // Extract area
  const areaMatch = text.match(/(\d+)\s*sq\.?\s*ft/i)
  if (areaMatch) {
    parsed.areaSqft = areaMatch[1]
  }
  
  // Extract floor
  const floorMatch = text.match(/(\d+)(?:st|nd|rd|th)?\s*floor/i)
  if (floorMatch) {
    parsed.floor = floorMatch[1]
  }
  
  // Extract rent
  const rentMatch = text.match(/₹\s*(\d+(?:,\d+)*)/i)
  if (rentMatch) {
    parsed.rent = rentMatch[1].replace(/,/g, '')
  }
  
  // Extract highlights
  const highlights: string[] = []
  if (text.includes('lift')) highlights.push('Lift')
  if (text.includes('watchman') || text.includes('security')) highlights.push('Security')
  if (text.includes('furnished')) highlights.push('Fully Furnished')
  if (text.includes('AC')) highlights.push('AC')
  if (text.includes('Wi-Fi') || text.includes('WiFi')) highlights.push('WiFi')
  parsed.highlights = highlights
  
  // Extract contact
  const phoneMatch = text.match(/\+91\s*(\d+)/i)
  if (phoneMatch) {
    parsed.contactNumber = `+91 ${phoneMatch[1]}`
  }
  
  // Extract flatmate preferences
  if (text.includes('Male preferred')) {
    parsed.flatmatePreferences = {
      gender: 'Male',
      smoker: false,
      food: text.includes('Non-veg friendly') ? 'Any' : 'Any',
      pets: text.includes('Pet friendly')
    }
  }
  
  // Extract description
  parsed.description = 'Looking for a cool, easy-going third roommate to join our fully furnished 3BHK in Madhapur. Well-connected location with excellent amenities.'
  
  // Extract expenses
  parsed.expenses = 'Electricity, Wi-Fi, Gas: Split equally, Maid service: 1k, Furniture Rental: 3k'
  
  return parsed
}

export default function AddListingPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [rawText, setRawText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, loading } = useAuth()
  const [loginPrompted, setLoginPrompted] = useState(false)

  // If not authenticated, prompt login modal (no redirect) and gate the page UI
  useEffect(() => {
    if (!loading && !user && !loginPrompted) {
      setLoginPrompted(true)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
    }
  }, [user, loading, loginPrompted])

  const handleAutoFill = async () => {
    if (!rawText.trim()) return
    
    setIsProcessing(true)
    try {
      const parsedData = await parseListingText(rawText)
      setFormData(prev => ({ ...prev, ...parsedData }))
      setShowForm(true)
    } catch (error) {
      console.error('AI parsing failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleHighlightToggle = (highlight: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.includes(highlight)
        ? prev.highlights.filter(h => h !== highlight)
        : [...prev.highlights, highlight]
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Upload images to a mock storage (in real implementation, use Supabase Storage)
      const imageUrls: string[] = []
      for (let i = 0; i < formData.images.length; i++) {
        // Mock image upload - in real implementation, upload to Supabase Storage
        const mockUrl = `https://images.unsplash.com/photo-${Date.now()}-${i}?w=500&h=300&fit=crop`
        imageUrls.push(mockUrl)
      }

      // Prepare data for Supabase
      const listingData = {
        user_type: formData.userType,
        title: formData.title,
        property_type: formData.propertyType,
        location: formData.location,
        area_sqft: formData.areaSqft ? parseInt(formData.areaSqft) : null,
        floor: formData.floor ? parseInt(formData.floor) : null,
        description: formData.description || null,
        highlights: formData.highlights,
        rent: parseInt(formData.rent),
        maintenance: formData.maintenance ? parseInt(formData.maintenance) : null,
        security_deposit: parseInt(formData.securityDeposit),
        expenses: formData.expenses || null,
        flatmate_preferences: formData.flatmatePreferences,
        contact_number: formData.contactNumber,
        image_urls: imageUrls
      }

      // Submit to Supabase
      const { data, error } = await supabase
        .from('listings')
        .insert([listingData])
        .select()

      if (error) {
        throw error
      }

      console.log('Listing created:', data)
      alert('Listing submitted successfully! 🎉')
      
      // Reset form
      setFormData(initialFormData)
      setRawText('')
      setShowForm(false)
    } catch (error) {
      console.error('Submission failed:', error)
      
      // Fallback to local storage or show more specific error
      if (error instanceof Error) {
        alert(`Failed to submit listing: ${error.message}`)
      } else {
        alert('Failed to submit listing. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // If unauthenticated, show a friendly prompt and block the form
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Login required</h1>
            <p className="text-gray-600 mb-6">Please login to add a new listing.</p>
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('open-login-modal'))
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Open Login
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-white pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Add Your <span className="text-blue-600">Listing</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Share your property or find the perfect flatmate. It&apos;s free and takes just 2 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Section A: User Type */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Step 1: Who are you?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="normal"
                  checked={formData.userType === 'normal'}
                  onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value as 'normal' | 'broker' }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900">Normal User</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="broker"
                  checked={formData.userType === 'broker'}
                  onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value as 'normal' | 'broker' }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900">Broker</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Section B: AI Auto-fill */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Step 2: Quick Auto-fill with AI
            </CardTitle>
            <p className="text-sm text-gray-600">
              Paste your listing text and let AI extract the details automatically
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rawText">Paste your listing text here</Label>
              <Textarea
                id="rawText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Example:
URGENT: Male Flatmate Needed | Move-in immediately
🏡 Spacious 3BHK | 2500 sq. ft | Madhapur, Siddhi Vinayak Nagar | 2nd Floor
• Rent: ₹18,166 (includes maintenance)
• Contact: +91 8220147153
..."
                rows={8}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleAutoFill}
              disabled={!rawText.trim() || isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-fill Form
                </>
              )}
            </Button>
            
            {!showForm && !isProcessing && (
              <div className="text-center">
                <p className="text-gray-500 mb-2">or</p>
                <Button
                  variant="outline"
                  onClick={() => setShowForm(true)}
                  className="border-gray-300"
                >
                  Fill form manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section C: Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Spacious 2BHK in Koramangala"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="propertyType">Property Type *</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Koramangala 5th Block"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="areaSqft">Area (sq. ft.)</Label>
                    <Input
                      id="areaSqft"
                      type="number"
                      value={formData.areaSqft}
                      onChange={(e) => setFormData(prev => ({ ...prev, areaSqft: e.target.value }))}
                      placeholder="e.g., 1200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="floor">Floor</Label>
                    <Input
                      id="floor"
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                      placeholder="e.g., 3"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your property, location benefits, and what you're looking for..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Highlights/Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Highlights & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AVAILABLE_HIGHLIGHTS.map(highlight => (
                    <label key={highlight} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={formData.highlights.includes(highlight)}
                        onCheckedChange={() => handleHighlightToggle(highlight)}
                      />
                      <span className="text-sm">{highlight}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Selected:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.highlights.map(highlight => (
                      <Badge key={highlight} variant="secondary" className="bg-blue-50 text-blue-700">
                        {highlight}
                        <button
                          type="button"
                          onClick={() => handleHighlightToggle(highlight)}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Pricing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="rent">Monthly Rent *</Label>
                    <Input
                      id="rent"
                      type="number"
                      value={formData.rent}
                      onChange={(e) => setFormData(prev => ({ ...prev, rent: e.target.value }))}
                      placeholder="e.g., 25000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maintenance">Maintenance</Label>
                    <Input
                      id="maintenance"
                      type="number"
                      value={formData.maintenance}
                      onChange={(e) => setFormData(prev => ({ ...prev, maintenance: e.target.value }))}
                      placeholder="e.g., 2000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="securityDeposit">Security Deposit *</Label>
                    <Input
                      id="securityDeposit"
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                      placeholder="e.g., 50000"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="expenses">Additional Expenses</Label>
                  <Input
                    id="expenses"
                    value={formData.expenses}
                    onChange={(e) => setFormData(prev => ({ ...prev, expenses: e.target.value }))}
                    placeholder="e.g., Electricity, WiFi, Gas split equally"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Flatmate Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Flatmate Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Gender Preference</Label>
                    <Select
                      value={formData.flatmatePreferences.gender}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        flatmatePreferences: { ...prev.flatmatePreferences, gender: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Any">Any</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Food Preference</Label>
                    <Select
                      value={formData.flatmatePreferences.food}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        flatmatePreferences: { ...prev.flatmatePreferences, food: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Any">Any</SelectItem>
                        <SelectItem value="Veg">Vegetarian</SelectItem>
                        <SelectItem value="Non-Veg">Non-Vegetarian</SelectItem>
                        <SelectItem value="Vegan">Vegan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={formData.flatmatePreferences.smoker}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        flatmatePreferences: { ...prev.flatmatePreferences, smoker: checked as boolean }
                      }))}
                    />
                    <span>Smoking allowed</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={formData.flatmatePreferences.pets}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        flatmatePreferences: { ...prev.flatmatePreferences, pets: checked as boolean }
                      }))}
                    />
                    <span>Pet friendly</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Images */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="e.g., +91 9876543210"
                    required
                  />
                </div>

                <div>
                  <Label>Property Images</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label
                      htmlFor="imageUpload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Click to upload images</p>
                      </div>
                    </label>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <div
                            style={{ 
                              backgroundImage: `url(${URL.createObjectURL(image)})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                            className="w-full h-24 rounded-lg"
                            role="img"
                            aria-label={`Preview ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Upload className="h-5 w-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Home className="h-5 w-5 mr-2" />
                    Submit Listing
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}