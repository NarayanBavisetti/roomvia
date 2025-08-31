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
  DollarSign
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai')
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
      setFormData(prev => ({ ...prev, ...parsedData, userType: 'normal' })) // Default to normal user
      setActiveTab('manual') // Switch to manual form after processing
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

  const uploadImageToSupabase = async (file: File, listingId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${listingId}/${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file)

    if (error) {
      console.error('Error uploading image:', error)
      // Return a fallback URL if upload fails
      return `https://images.unsplash.com/photo-${Date.now()}?w=500&h=300&fit=crop`
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('listing-images')
      .getPublicUrl(fileName)

    return publicData.publicUrl
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    // Required field validation
    if (!formData.title.trim()) errors.push('Title is required')
    if (!formData.propertyType) errors.push('Property type is required')
    if (!formData.location.trim()) errors.push('Location is required')
    if (!formData.rent || parseInt(formData.rent) <= 0) errors.push('Valid rent amount is required')
    if (!formData.securityDeposit || parseInt(formData.securityDeposit) <= 0) errors.push('Valid security deposit is required')
    if (!formData.contactNumber.trim()) errors.push('Contact number is required')
    
    // Contact number format validation
    const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/
    if (formData.contactNumber.trim() && !phoneRegex.test(formData.contactNumber.replace(/[\s-]/g, ''))) {
      errors.push('Please enter a valid Indian phone number')
    }
    
    // Rent validation
    const rent = parseInt(formData.rent)
    if (rent && (rent < 1000 || rent > 1000000)) {
      errors.push('Rent should be between ₹1,000 and ₹10,00,000')
    }
    
    // Security deposit validation
    const securityDeposit = parseInt(formData.securityDeposit)
    if (securityDeposit && (securityDeposit < 0 || securityDeposit > 5000000)) {
      errors.push('Security deposit should be between ₹0 and ₹50,00,000')
    }
    
    // Area validation
    if (formData.areaSqft && (parseInt(formData.areaSqft) < 100 || parseInt(formData.areaSqft) > 10000)) {
      errors.push('Area should be between 100 and 10,000 sq ft')
    }
    
    // Floor validation
    if (formData.floor && (parseInt(formData.floor) < 0 || parseInt(formData.floor) > 50)) {
      errors.push('Floor should be between 0 and 50')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Authentication check
      if (!user) {
        throw new Error('You must be logged in to create a listing')
      }

      // Form validation
      const validationErrors = validateForm()
      if (validationErrors.length > 0) {
        throw new Error(`Please fix the following errors:\n${validationErrors.join('\n')}`)
      }

      // Generate a temporary ID for image uploads
      const tempListingId = `temp-${Date.now()}`
      
      // Upload images to Supabase Storage with progress tracking
      const imageUrls: string[] = []
      if (formData.images.length > 0) {
        console.log(`Uploading ${formData.images.length} images...`)
        
        for (let i = 0; i < formData.images.length; i++) {
          try {
            const imageUrl = await uploadImageToSupabase(formData.images[i], tempListingId)
            imageUrls.push(imageUrl)
            console.log(`Uploaded image ${i + 1}/${formData.images.length}`)
          } catch (imageError) {
            console.warn(`Failed to upload image ${i + 1}:`, imageError)
            // Add fallback image URL for failed uploads
            imageUrls.push(`https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop`)
          }
        }
      }

      // Prepare data for Supabase
      const listingData = {
        user_id: user.id, // Add user association
        user_type: formData.userType || 'normal', // Default to normal if not set
        title: formData.title.trim(),
        property_type: formData.propertyType,
        location: formData.location.trim(),
        area_sqft: formData.areaSqft ? parseInt(formData.areaSqft) : null,
        floor: formData.floor ? parseInt(formData.floor) : null,
        description: formData.description?.trim() || null,
        highlights: formData.highlights,
        rent: parseInt(formData.rent),
        maintenance: formData.maintenance ? parseInt(formData.maintenance) : 0,
        security_deposit: parseInt(formData.securityDeposit),
        expenses: formData.expenses?.trim() || null,
        flatmate_preferences: formData.flatmatePreferences,
        contact_number: formData.contactNumber.trim(),
        image_urls: imageUrls,
        status: 'active'
      }

      console.log('Submitting listing data:', listingData)

      // Submit to Supabase
      const { data, error } = await supabase
        .from('listings')
        .insert([listingData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        
        // Handle specific Supabase errors
        if (error.code === '23505') {
          throw new Error('A listing with this information already exists')
        } else if (error.code === '23503') {
          throw new Error('Invalid user account. Please log out and log in again')
        } else if (error.code === '42P01') {
          throw new Error('Database table not found. Please contact support')
        } else {
          throw new Error(`Database error: ${error.message}`)
        }
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from database. Please try again')
      }

      console.log('Listing created successfully:', data[0])
      
      // Show success message with listing ID
      const createdListing = data[0]
      alert(`🎉 Listing submitted successfully!\n\nTitle: ${createdListing.title}\nID: ${createdListing.id}\n\nYour property is now live and can be seen by potential flatmates.`)
      
      // Reset form
      setFormData(initialFormData)
      setRawText('')
      
      // Optionally redirect to the listing or home page
      // window.location.href = `/listing/${createdListing.id}`
      
    } catch (error) {
      console.error('Submission failed:', error)
      
      if (error instanceof Error) {
        // Format validation errors nicely
        if (error.message.includes('Please fix the following errors:')) {
          alert(`❌ Form Validation Failed:\n\n${error.message.replace('Please fix the following errors:\n', '')}`)
        } else {
          alert(`❌ Failed to submit listing:\n\n${error.message}`)
        }
      } else {
        alert('❌ An unexpected error occurred. Please check your internet connection and try again.')
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
              className="bg-purple-500 hover:bg-purple-800"
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
      
      {/* Fullscreen Layout with Toggle */}
      <main className="h-screen flex flex-col pt-16">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            {/* Toggle Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 max-w-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'ai'
                    ? 'bg-white text-purple-500 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="h-4 w-4 mr-2 inline" />
                AI Creator
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white text-purple-500 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home className="h-4 w-4 mr-2 inline" />
                Manual Form
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'ai' ? (
            /* AI Listing Creator View */
            <div className="h-full overflow-y-auto bg-gray-50">
              <div className="max-w-4xl mx-auto p-8">                
                <div className="space-y-8">
                  {/* AI Input Section */}
                  <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        <div>
                                                <h3 className="text-base font-semibold text-gray-900 leading-tight truncate">
                        AI Listing Creator
                      </h3>
                          <Label htmlFor="aiRawText" className="text-base font-medium text-gray-800 mb-3 block">
                            Paste your listing text
                          </Label>
                          <Textarea
                            id="aiRawText"
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Example:
URGENT: Male Flatmate Needed | Move-in immediately
🏡 Spacious 3BHK | 2500 sq. ft | Madhapur, Siddhi Vinayak Nagar | 2nd Floor
• Rent: ₹18,166 (includes maintenance)
• Security Deposit: ₹36,332
• Contact: +91 8220147153
• Amenities: Lift, Security, Fully Furnished, AC, WiFi
• Looking for: Male, Non-smoker, Pet-friendly..."
                            rows={10}
                            className="resize-none border-gray-300 text-sm"
                          />
                          <p className="text-sm text-gray-500 mt-3">
                            Include as many details as possible - rent, location, amenities, preferences, and contact information
                          </p>
                        </div>
                        
                        {/* Image Upload Section */}
                        <div>
                          <Label className="text-base font-medium text-gray-800 mb-3 block">
                            Property Images (Optional)
                          </Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="aiImageUpload"
                            />
                            <label htmlFor="aiImageUpload" className="cursor-pointer block">
                              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
                              <p className="text-sm text-gray-500">JPEG, PNG, WebP • Max 10 images</p>
                            </label>
                          </div>
                          
                          {/* Image Previews */}
                          {formData.images.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
                              {formData.images.map((image, index) => (
                                <div key={index} className="relative group">
                                  <div
                                    style={{
                                      backgroundImage: `url(${URL.createObjectURL(image)})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }}
                                    className="w-full h-20 rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-center pt-4">
                          <Button
                            onClick={handleAutoFill}
                            disabled={!rawText.trim() || isProcessing}
                            className="bg-purple-500 hover:bg-purple-800 text-white px-8 py-3 rounded-xl text-base font-semibold"
                          >
                            {isProcessing ? (
                              <>
                                <Sparkles className="h-5 w-5 mr-3 animate-spin" />
                                Processing with AI...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-5 w-5 mr-3" />
                                Generate Listing
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                </div>
              </div>
            </div>
          ) : (
            /* Manual Form View */
            <div className="h-full overflow-y-auto bg-gray-50">
              <div className="max-w-6xl mx-auto p-8">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <Card className="shadow-sm border-gray-200">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Property Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Spacious 2BHK in Koramangala"
                            required
                            className="mt-1 border-gray-300"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="propertyType" className="text-sm font-medium text-gray-700">Property Type *</Label>
                            <Select
                              value={formData.propertyType}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}
                            >
                              <SelectTrigger className="mt-1 border-gray-300">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {PROPERTY_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location *</Label>
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="e.g., Koramangala 5th Block"
                              required
                              className="mt-1 border-gray-300"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="areaSqft" className="text-sm font-medium text-gray-700">Area (sq. ft.)</Label>
                            <Input
                              id="areaSqft"
                              type="number"
                              value={formData.areaSqft}
                              onChange={(e) => setFormData(prev => ({ ...prev, areaSqft: e.target.value }))}
                              placeholder="e.g., 1200"
                              className="mt-1 border-gray-300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="floor" className="text-sm font-medium text-gray-700">Floor</Label>
                            <Input
                              id="floor"
                              type="number"
                              value={formData.floor}
                              onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                              placeholder="e.g., 3"
                              className="mt-1 border-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your property, location benefits, and what you're looking for..."
                            rows={3}
                            className="mt-1 border-gray-300 resize-none"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card className="shadow-sm border-gray-200">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <DollarSign className="h-5 w-5 text-purple-500" />
                          Pricing Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="rent" className="text-sm font-medium text-gray-700">Monthly Rent *</Label>
                            <Input
                              id="rent"
                              type="number"
                              value={formData.rent}
                              onChange={(e) => setFormData(prev => ({ ...prev, rent: e.target.value }))}
                              placeholder="25000"
                              required
                              className="mt-1 border-gray-300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="maintenance" className="text-sm font-medium text-gray-700">Maintenance</Label>
                            <Input
                              id="maintenance"
                              type="number"
                              value={formData.maintenance}
                              onChange={(e) => setFormData(prev => ({ ...prev, maintenance: e.target.value }))}
                              placeholder="2000"
                              className="mt-1 border-gray-300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="securityDeposit" className="text-sm font-medium text-gray-700">Security Deposit *</Label>
                            <Input
                              id="securityDeposit"
                              type="number"
                              value={formData.securityDeposit}
                              onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                              placeholder="50000"
                              required
                              className="mt-1 border-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="expenses" className="text-sm font-medium text-gray-700">Additional Expenses</Label>
                          <Input
                            id="expenses"
                            value={formData.expenses}
                            onChange={(e) => setFormData(prev => ({ ...prev, expenses: e.target.value }))}
                            placeholder="e.g., Electricity, WiFi, Gas split equally"
                            className="mt-1 border-gray-300"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Highlights/Amenities */}
                    <Card className="shadow-sm border-gray-200">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Highlights & Amenities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {AVAILABLE_HIGHLIGHTS.slice(0, 12).map(highlight => (
                            <label key={highlight} className="flex items-center space-x-2 cursor-pointer">
                              <Checkbox
                                checked={formData.highlights.includes(highlight)}
                                onCheckedChange={() => handleHighlightToggle(highlight)}
                              />
                              <span className="text-sm">{highlight}</span>
                            </label>
                          ))}
                        </div>
                        {formData.highlights.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Selected:</p>
                            <div className="flex flex-wrap gap-2">
                              {formData.highlights.map(highlight => (
                                <Badge key={highlight} variant="secondary" className="bg-purple-50 text-purple-700 text-xs">
                                  {highlight}
                                  <button
                                    type="button"
                                    onClick={() => handleHighlightToggle(highlight)}
                                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Flatmate Preferences */}
                    <Card className="shadow-sm border-gray-200">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Flatmate Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Gender Preference</Label>
                            <Select
                              value={formData.flatmatePreferences.gender}
                              onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                flatmatePreferences: { ...prev.flatmatePreferences, gender: value }
                              }))}
                            >
                              <SelectTrigger className="mt-1 border-gray-300">
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
                            <Label className="text-sm font-medium text-gray-700">Food Preference</Label>
                            <Select
                              value={formData.flatmatePreferences.food}
                              onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                flatmatePreferences: { ...prev.flatmatePreferences, food: value }
                              }))}
                            >
                              <SelectTrigger className="mt-1 border-gray-300">
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

                        <div className="flex gap-6">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={formData.flatmatePreferences.smoker}
                              onCheckedChange={(checked) => setFormData(prev => ({
                                ...prev,
                                flatmatePreferences: { ...prev.flatmatePreferences, smoker: checked as boolean }
                              }))}
                            />
                            <span className="text-sm">Smoking allowed</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={formData.flatmatePreferences.pets}
                              onCheckedChange={(checked) => setFormData(prev => ({
                                ...prev,
                                flatmatePreferences: { ...prev.flatmatePreferences, pets: checked as boolean }
                              }))}
                            />
                            <span className="text-sm">Pet friendly</span>
                          </label>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact & Images */}
                    <Card className="shadow-sm border-gray-200">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Contact & Images</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">Contact Number *</Label>
                          <Input
                            id="contactNumber"
                            value={formData.contactNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                            placeholder="e.g., +91 9876543210"
                            required
                            className="mt-1 border-gray-300"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Property Images</Label>
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
                              className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <Upload className="w-6 h-6 mb-1 text-gray-400" />
                                <p className="text-xs text-gray-500">Click to upload images</p>
                              </div>
                            </label>
                          </div>

                          {formData.images.length > 0 && (
                            <div className="mt-4 grid grid-cols-4 gap-3">
                              {formData.images.map((image, index) => (
                                <div key={index} className="relative">
                                  <div
                                    style={{ 
                                      backgroundImage: `url(${URL.createObjectURL(image)})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }}
                                    className="w-full h-20 rounded-lg"
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
                  </div>

                  {/* Submit Button - Full Width Across Both Columns */}
                  <div className="lg:col-span-2 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-purple-500 hover:bg-purple-800 text-white py-4 text-base font-semibold rounded-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <Upload className="h-5 w-5 mr-2 animate-spin" />
                          Submitting Listing...
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
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}