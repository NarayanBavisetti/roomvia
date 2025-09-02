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
  Link2,
  Globe
} from 'lucide-react'
import { supabase, type FlatmatePreferences } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/image-upload'
import { CloudinaryImage } from '@/lib/cloudinary'
import { openAIService } from '@/lib/openai'
import { showToast } from '@/lib/toast'

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
  city: string
  state: string
  country: string
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
  images: CloudinaryImage[]
}

const initialFormData: FormData = {
  userType: 'normal',
  title: '',
  propertyType: '',
  city: '',
  state: '',
  country: 'India', // Default to India
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

// Accept sharer, short post links (/share/p/...), generic /share/, and common post routes
const isValidFacebookUrl = (url: string) => {
  const fbRegex = /^(https?:\/\/)?(www\.)?(facebook|fb)\.com\/(sharer\/sharer\.php\?u=|share\/p\/|share\/?$|permalink\.php|photo\.php|story\.php|[^/]+\/posts\/|[^/]+\/photos\/|[^/]+\/videos\/|groups\/|events\/|watch\/|reel\/|.*)/i
  return fbRegex.test(url.trim())
}

// Function to extract Facebook post content
const extractFacebookPostData = async (url: string): Promise<string> => {
  // Validate Facebook URL
  if (!isValidFacebookUrl(url)) {
    throw new Error('Please enter a valid Facebook post URL')
  }
  
  try {
    // In a real implementation, you would use a service like:
    // 1. Facebook Graph API (requires app permissions)
    // 2. Web scraping service (like Puppeteer or Playwright)
    // 3. Third-party API (like Linkpedia, Web Scraper API, etc.)
    
    // For now, simulate the extraction process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Mock extracted content - in real app, this would come from the actual FB post
    const mockExtractedText = `
URGENT: Male Flatmate Needed | Move-in immediately
🏡 Spacious 3BHK | 2500 sq. ft | Madhapur, Siddhi Vinayak Nagar | 2nd Floor
• Rent: ₹18,166 (includes maintenance)
• Security Deposit: ₹36,332
• Contact: +91 8220147153
• Amenities: Lift, Security, Fully Furnished, AC, WiFi
• Looking for: Male, Non-smoker, Pet-friendly
• Additional Details: Well-connected area, near IT hub, excellent transport connectivity
• Expenses: Electricity, Wi-Fi split equally among roommates
    `
    
    return mockExtractedText.trim()
  } catch (error) {
    console.error('Facebook extraction error:', error)
    throw new Error('Failed to extract data from Facebook post. Please try copying the text manually.')
  }
}

// AI parsing function using GPT-4o mini
const parseListingText = async (text: string, userId?: string): Promise<Partial<FormData>> => {
  try {
    if (!userId) {
      throw new Error('User authentication required for AI parsing')
    }

    // Use the OpenAI service to parse the text
    const result = await openAIService.parseListingText(userId, text, 'text')
    
    if (!result) {
      throw new Error('Failed to parse the listing text. Please try again or fill the form manually.')
    }

    // Convert the structured result to FormData format
    return {
      title: result.formData.title,
      propertyType: result.formData.propertyType,
      city: result.formData.city,
      state: result.formData.state,
      country: result.formData.country,
      areaSqft: result.formData.areaSqft,
      floor: result.formData.floor,
      description: result.formData.description,
      highlights: result.formData.highlights,
      rent: result.formData.rent,
      maintenance: result.formData.maintenance,
      securityDeposit: result.formData.securityDeposit,
      expenses: result.formData.expenses,
      flatmatePreferences: result.formData.flatmatePreferences,
      contactNumber: result.formData.contactNumber
    }
  } catch (error) {
    console.error('OpenAI parsing error:', error)
    throw error
  }
}

export default function AddListingPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [rawText, setRawText] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai')
  const [inputType, setInputType] = useState<'text' | 'facebook'>('text')
  const { user, loading } = useAuth()
  const [loginPrompted, setLoginPrompted] = useState(false)
  const router = useRouter()

  // If not authenticated, prompt login modal (no redirect) and gate the page UI
  useEffect(() => {
    if (!loading && !user && !loginPrompted) {
      setLoginPrompted(true)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
    }
  }, [user, loading, loginPrompted])

  const canGenerate = inputType === 'text' ? rawText.trim().length > 0 : isValidFacebookUrl(facebookUrl)

  const handleAutoFill = async () => {
    if (inputType === 'text' && !rawText.trim()) return
    if (inputType === 'facebook' && !isValidFacebookUrl(facebookUrl)) {
      alert('Please enter a valid Facebook post URL')
      return
    }
    
    setIsProcessing(true)
    try {
      let textToParse = rawText
      
      // If Facebook URL, first extract the post content
      if (inputType === 'facebook') {
        textToParse = await extractFacebookPostData(facebookUrl)
        setRawText(textToParse) // Show extracted text
      }
      
      // Then parse the text with AI
      const parsedData = await parseListingText(textToParse, user?.id)
      setFormData(prev => ({ ...prev, ...parsedData, userType: 'normal' })) // Default to normal user
      setActiveTab('manual') // Switch to manual form after processing
    } catch (error) {
      console.error('AI parsing failed:', error)
      alert(`❌ Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  const handleImagesChange = (images: CloudinaryImage[]) => {
    setFormData(prev => ({
      ...prev,
      images
    }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    // Required field validation
    if (!formData.title.trim()) errors.push('Title is required')
    if (!formData.propertyType) errors.push('Property type is required')
    if (!formData.city.trim()) errors.push('City is required')
    if (!formData.state.trim()) errors.push('State is required')
    if (!formData.country.trim()) errors.push('Country is required')
    if (!formData.rent || parseInt(formData.rent) <= 0) errors.push('Valid rent amount is required')
    if (!formData.securityDeposit || parseInt(formData.securityDeposit) <= 0) errors.push('Valid security deposit is required')
    if (!formData.contactNumber.trim()) errors.push('Contact number is required')
    if (!formData.images || formData.images.length === 0) errors.push('At least one property image is required')
    
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

      // Check limit: one listing per user for now (upgrade coming soon)
      const { count: existingCount, error: countErr } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (!countErr && (existingCount || 0) > 0) {
        showToast('You can create one listing per account. Upgrade coming soon.')
        setIsSubmitting(false)
        return
      }

      // Form validation
      const validationErrors = validateForm()
      if (validationErrors.length > 0) {
        throw new Error(`Please fix the following errors:\n${validationErrors.join('\n')}`)
      }

      // Images are already uploaded to Cloudinary via the ImageUpload component
      console.log(`Using ${formData.images.length} pre-uploaded images from Cloudinary`)

      // Prepare data for Supabase
      const listingData = {
        user_id: user.id, // Add user association
        user_type: formData.userType || 'normal', // Default to normal if not set
        title: formData.title.trim(),
        property_type: formData.propertyType,
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
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
        images: formData.images, // Store Cloudinary image objects
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
      
      // Toast + redirect to listing page
      const createdListing = data[0]
      showToast('Listing created successfully', { variant: 'success' })
      router.push(`/listing/${createdListing.id}`)
      
      // Reset form
      setFormData(initialFormData)
      setRawText('')
      
      // Optionally: nothing else
      
    } catch (error) {
      console.error('Submission failed:', error)
      showToast('Failed to submit listing', { variant: 'error' })
      
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
        <div className="bg-white border-b border-gray-200/60 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Toggle Tabs - Refined Design */}
              <div className="flex items-center">
                <div
                  className="bg-gray-50 rounded-xl p-1 border border-gray-200 shadow-xs"
                  role="tablist"
                  aria-label="Listing input mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'ai'}
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center justify-center min-w-[140px] px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:outline-none ${
                      activeTab === 'ai'
                        ? 'bg-purple-500 text-white shadow-sm'
                        : 'text-gray-700 hover:text-purple-600 hover:bg-white'
                    }`}
                  >
                    <Sparkles className={`h-4 w-4 mr-2 transition-colors duration-200 ${
                      activeTab === 'ai' ? 'text-white' : 'text-purple-500'
                    }`} />
                    AI Creator
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'manual'}
                    onClick={() => setActiveTab('manual')}
                    className={`flex items-center justify-center min-w-[140px] px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:outline-none ${
                      activeTab === 'manual'
                        ? 'bg-purple-500 text-white shadow-sm'
                        : 'text-gray-700 hover:text-purple-600 hover:bg-white'
                    }`}
                  >
                    <Home className={`h-4 w-4 mr-2 transition-colors duration-200 ${
                      activeTab === 'manual' ? 'text-white' : 'text-purple-500'
                    }`} />
                    Manual Form
                  </button>
                </div>
              </div>

              {/* Broker Account Link - Clean Design */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Are you a broker?</span>
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2 hover:underline-offset-4 transition-all duration-200"
                >
                  Change to broker account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'ai' ? (
            /* AI Listing Creator View */
            <div className="h-full overflow-y-auto bg-gray-50/30">
              <div className="max-w-4xl mx-auto p-6">                
                <div className="space-y-6">
                  {/* AI Input Section */}
                  <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            AI Listing Creator
                          </h3>
                          
                          {/* Input Type Toggle */}
                          <div className="flex bg-gray-100 rounded-lg p-1 mb-4 max-w-sm">
                            <button
                              type="button"
                              onClick={() => setInputType('text')}
                              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                                inputType === 'text'
                                  ? 'bg-white text-purple-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <Sparkles className="h-4 w-4 mr-1 inline" />
                              Text Input
                            </button>
                            <button
                              type="button"
                              onClick={() => setInputType('facebook')}
                              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                                inputType === 'facebook'
                                  ? 'bg-white text-purple-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <Globe className="h-4 w-4 mr-1 inline" />
                              Facebook Post
                            </button>
                          </div>

                          {inputType === 'text' ? (
                            <div>
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
                          ) : (
                            <div>
                              <Label htmlFor="facebookUrl" className="text-base font-medium text-gray-800 mb-3 block">
                                Facebook Post URL
                              </Label>
                              <div className="relative">
                                <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                  id="facebookUrl"
                                  value={facebookUrl}
                                  onChange={(e) => setFacebookUrl(e.target.value)}
                                  placeholder="https://www.facebook.com/share/p/EXAMPLE"
                                  className="pl-10 border-gray-300"
                                />
                              </div>
                              <p className="text-sm text-gray-500 mt-3">
                                Supports sharer links and short post links like /share/p/...
                              </p>
                              
                              {/* Show extracted text preview */}
                              {rawText && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Content:</h4>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{rawText}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-center pt-3">
                          <Button
                            onClick={handleAutoFill}
                            disabled={!canGenerate || isProcessing}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200"
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
            <div className="h-full overflow-y-auto bg-gray-50/30">
              <div className="max-w-6xl mx-auto p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-5">
                    {/* Basic Information */}
                    <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold">Property Details</CardTitle>
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
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor="city" className="text-sm font-medium text-gray-700">City *</Label>
                              <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="e.g., Bangalore"
                                required
                                className="mt-1 border-gray-300"
                              />
                            </div>
                            <div>
                              <Label htmlFor="state" className="text-sm font-medium text-gray-700">State *</Label>
                              <Input
                                id="state"
                                value={formData.state}
                                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                placeholder="e.g., Karnataka"
                                required
                                className="mt-1 border-gray-300"
                              />
                            </div>
                            <div>
                              <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country *</Label>
                              <Input
                                id="country"
                                value={formData.country}
                                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                placeholder="e.g., India"
                                required
                                className="mt-1 border-gray-300"
                              />
                            </div>
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
                    <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
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
                  <div className="space-y-5">
                    {/* Highlights/Amenities */}
                    <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold">Highlights & Amenities</CardTitle>
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
                    <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold">Flatmate Preferences</CardTitle>
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
                    <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold">Contact & Images</CardTitle>
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
                          <ImageUpload
                            images={formData.images}
                            onImagesChange={handleImagesChange}
                            maxImages={10}
                            disabled={isSubmitting}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Submit Button - Full Width Across Both Columns */}
                  <div className="lg:col-span-2 pt-3">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
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