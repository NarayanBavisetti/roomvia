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
import { showToast } from '@/lib/toast'
import { INDIAN_STATES, getCitiesForState, findStateByName, findCityByName, StateOption, CityOption } from '@/lib/location-data'

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
  area: string
  state: string
  country: string
  buildingName: string
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
  area: '',
  state: '',
  country: 'India', // Default to India
  buildingName: '',
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

// AI parsing function via server API
const parseListingText = async (text: string, userId?: string): Promise<Partial<FormData>> => {
  try {
    if (!userId) {
      throw new Error('User authentication required for AI parsing')
    }

    // Call server API to parse the text (keeps OpenAI on server)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch('/api/ai/parse-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, inputType: 'text' }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to parse text')
    }
    const { result } = await res.json()
    
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
  const [availableCities, setAvailableCities] = useState<CityOption[]>([])
  const [selectedStateOption, setSelectedStateOption] = useState<StateOption | null>(null)
  const [selectedCityOption, setSelectedCityOption] = useState<CityOption | null>(null)

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
      
      // Set state and city dropdowns if AI parsed them
      if (parsedData.state) {
        const stateOption = findStateByName(parsedData.state)
        if (stateOption) {
          setSelectedStateOption(stateOption)
          const cities = getCitiesForState(stateOption.id)
          setAvailableCities(cities)
          
          if (parsedData.city) {
            const cityOption = findCityByName(parsedData.city, stateOption.id)
            if (cityOption) {
              setSelectedCityOption(cityOption)
            }
          }
        }
      }
      
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

  const handleStateChange = (stateId: string) => {
    const stateOption = INDIAN_STATES.find(s => s.id === stateId) || null
    setSelectedStateOption(stateOption)
    setSelectedCityOption(null)
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      state: stateOption?.name || '',
      city: ''
    }))
    
    // Load cities for the selected state
    if (stateOption) {
      const cities = getCitiesForState(stateOption.id)
      setAvailableCities(cities)
    } else {
      setAvailableCities([])
    }
  }
  
  const handleCityChange = (cityId: string) => {
    const cityOption = availableCities.find(c => c.id === cityId) || null
    setSelectedCityOption(cityOption)
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      city: cityOption?.name || ''
    }))
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
        area: formData.area.trim() || null,
        state: formData.state.trim(),
        country: formData.country.trim(),
        building_name: formData.buildingName.trim() || null,
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
      
      // Show success toast and redirect to landing page
      showToast('Listing created successfully! You can now see it on the homepage.', { variant: 'success' })
      
      // Reset form
      setFormData(initialFormData)
      setRawText('')
      
      // Redirect to landing page after a brief delay to show the toast
      setTimeout(() => {
        router.push('/')
      }, 1000)
      
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
          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/70 shadow-sm p-8 text-center">
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
      <main className="h-screen flex flex-col pt-4">
        {/* Header Bar */}
        <div className="bg-grey/95 backdrop-blur-sm  sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto py-4">
            <div className="flex items-center justify-between">
              {/* Toggle Tabs - Refined Design */}
              <div className="flex items-center">
                <div
                  className="flex gap-2 items-center bg-gray-50/80 backdrop-blur-sm rounded-xl p-1.5 border border-gray-200/70 shadow-sm"
                  role="tablist"
                  aria-label="Listing input mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'ai'}
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center justify-center min-w-[142px] px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:outline-none ${
                      activeTab === 'ai'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-gray-700 hover:text-purple-600 hover:bg-white/80'
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
                    className={`flex items-center justify-center min-w-[142px] px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:outline-none ${
                      activeTab === 'manual'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-gray-700 hover:text-purple-600 hover:bg-white/80'
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
            <div className="h-full overflow-y-auto bg-gray-50">
              <div className="w-full sm:px-6 lg:px-8">                
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
            <div className="h-full overflow-y-auto bg-gray-50">
              <div className="max-w-6xl mx-auto p-4">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    {/* Basic Information */}
                    <Card className="border border-gray-200 bg-white">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-base font-semibold text-gray-800">Property Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 px-4 pb-4">
                        <div>
                          <Label htmlFor="title" className="text-xs font-medium text-gray-700 mb-1 block">Title *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Spacious 2BHK in Koramangala"
                            required
                            className="h-8 text-sm border-gray-300"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="propertyType" className="text-xs font-medium text-gray-700 mb-1 block">Property Type *</Label>
                            <Select
                              value={formData.propertyType}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}
                            >
                              <SelectTrigger className="h-8 text-sm border-gray-300">
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
                            <Label htmlFor="state" className="text-xs font-medium text-gray-700 mb-1 block">State *</Label>
                            <Select
                              value={selectedStateOption?.id || ''}
                              onValueChange={handleStateChange}
                            >
                              <SelectTrigger className="h-8 text-sm border-gray-300">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {INDIAN_STATES.map(state => (
                                  <SelectItem key={state.id} value={state.id}>
                                    {state.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="city" className="text-xs font-medium text-gray-700 mb-1 block">City *</Label>
                            <Select
                              value={selectedCityOption?.id || ''}
                              onValueChange={handleCityChange}
                              disabled={!selectedStateOption}
                            >
                              <SelectTrigger className="h-8 text-sm border-gray-300">
                                <SelectValue placeholder={selectedStateOption ? "Select city" : "Select state first"} />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {availableCities.map(city => (
                                  <SelectItem key={city.id} value={city.id}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="area" className="text-xs font-medium text-gray-700 mb-1 block">Area/Locality</Label>
                            <Input
                              id="area"
                              value={formData.area}
                              onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                              placeholder="e.g., Koramangala, Gachibowli"
                              className="h-8 text-sm border-gray-300"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="buildingName" className="text-xs font-medium text-gray-700 mb-1 block">Building/Apartment Name</Label>
                          <Input
                            id="buildingName"
                            value={formData.buildingName}
                            onChange={(e) => setFormData(prev => ({ ...prev, buildingName: e.target.value }))}
                            placeholder="e.g., Prestige Shantiniketan, Brigade Gateway"
                            className="h-8 text-sm border-gray-300"
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="areaSqft" className="text-xs font-medium text-gray-700 mb-1 block">Area (sq. ft.)</Label>
                            <Input
                              id="areaSqft"
                              type="number"
                              value={formData.areaSqft}
                              onChange={(e) => setFormData(prev => ({ ...prev, areaSqft: e.target.value }))}
                              placeholder="e.g., 1200"
                              className="h-8 text-sm border-gray-300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="floor" className="text-xs font-medium text-gray-700 mb-1 block">Floor</Label>
                            <Input
                              id="floor"
                              type="number"
                              value={formData.floor}
                              onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                              placeholder="e.g., 3"
                              className="h-8 text-sm border-gray-300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="country" className="text-xs font-medium text-gray-700 mb-1 block">Country *</Label>
                            <Input
                              id="country"
                              value={formData.country}
                              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                              placeholder="India"
                              required
                              className="h-8 text-sm border-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-xs font-medium text-gray-700 mb-1 block">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your property, location benefits, and what you're looking for..."
                            rows={2}
                            className="text-sm border-gray-300 resize-none"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card className="border border-gray-200 bg-white">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                          <DollarSign className="h-4 w-4 text-purple-500" />
                          Pricing Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 px-4 pb-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="rent" className="text-xs font-medium text-gray-700 mb-1 block">Monthly Rent *</Label>
                            <Input
                              id="rent"
                              type="number"
                              value={formData.rent}
                              onChange={(e) => setFormData(prev => ({ ...prev, rent: e.target.value }))}
                              placeholder="25000"
                              required
                              className="h-8 text-sm border-gray-300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="maintenance" className="text-xs font-medium text-gray-700 mb-1 block">Maintenance</Label>
                            <Input
                              id="maintenance"
                              type="number"
                              value={formData.maintenance}
                              onChange={(e) => setFormData(prev => ({ ...prev, maintenance: e.target.value }))}
                              placeholder="2000"
                              className="h-8 text-sm border-gray-300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="securityDeposit" className="text-xs font-medium text-gray-700 mb-1 block">Security Deposit *</Label>
                            <Input
                              id="securityDeposit"
                              type="number"
                              value={formData.securityDeposit}
                              onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                              placeholder="50000"
                              required
                              className="h-8 text-sm border-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="expenses" className="text-xs font-medium text-gray-700 mb-1 block">Additional Expenses</Label>
                          <Input
                            id="expenses"
                            value={formData.expenses}
                            onChange={(e) => setFormData(prev => ({ ...prev, expenses: e.target.value }))}
                            placeholder="e.g., Electricity, WiFi, Gas split equally"
                            className="h-8 text-sm border-gray-300"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    {/* Highlights/Amenities */}
                    <Card className="border border-gray-200 bg-white">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-base font-semibold text-gray-800">Highlights & Amenities</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                          {AVAILABLE_HIGHLIGHTS.slice(0, 12).map(highlight => (
                            <label key={highlight} className="flex items-center space-x-2 cursor-pointer py-1">
                              <Checkbox
                                checked={formData.highlights.includes(highlight)}
                                onCheckedChange={() => handleHighlightToggle(highlight)}
                                className="h-4 w-4"
                              />
                              <span className="text-xs">{highlight}</span>
                            </label>
                          ))}
                        </div>
                        {formData.highlights.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-600 mb-1">Selected:</p>
                            <div className="flex flex-wrap gap-1">
                              {formData.highlights.map(highlight => (
                                <Badge key={highlight} variant="secondary" className="bg-purple-50 text-purple-700 text-xs px-2 py-1">
                                  {highlight}
                                  <button
                                    type="button"
                                    onClick={() => handleHighlightToggle(highlight)}
                                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Flatmate Preferences */}
                    <Card className="border border-gray-200 bg-white">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-base font-semibold text-gray-800">Flatmate Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 px-4 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-700 mb-1 block">Gender Preference</Label>
                            <Select
                              value={formData.flatmatePreferences.gender}
                              onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                flatmatePreferences: { ...prev.flatmatePreferences, gender: value }
                              }))}
                            >
                              <SelectTrigger className="h-8 text-sm border-gray-300">
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
                            <Label className="text-xs font-medium text-gray-700 mb-1 block">Food Preference</Label>
                            <Select
                              value={formData.flatmatePreferences.food}
                              onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                flatmatePreferences: { ...prev.flatmatePreferences, food: value }
                              }))}
                            >
                              <SelectTrigger className="h-8 text-sm border-gray-300">
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

                        <div className="flex gap-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={formData.flatmatePreferences.smoker}
                              onCheckedChange={(checked) => setFormData(prev => ({
                                ...prev,
                                flatmatePreferences: { ...prev.flatmatePreferences, smoker: checked as boolean }
                              }))}
                              className="h-4 w-4"
                            />
                            <span className="text-xs">Smoking allowed</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={formData.flatmatePreferences.pets}
                              onCheckedChange={(checked) => setFormData(prev => ({
                                ...prev,
                                flatmatePreferences: { ...prev.flatmatePreferences, pets: checked as boolean }
                              }))}
                              className="h-4 w-4"
                            />
                            <span className="text-xs">Pet friendly</span>
                          </label>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact & Images */}
                    <Card className="border border-gray-200 bg-white">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-base font-semibold text-gray-800">Contact & Images</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 px-4 pb-4">
                        <div>
                          <Label htmlFor="contactNumber" className="text-xs font-medium text-gray-700 mb-1 block">Contact Number *</Label>
                          <Input
                            id="contactNumber"
                            value={formData.contactNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                            placeholder="e.g., +91 9876543210"
                            required
                            className="h-8 text-sm border-gray-300"
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
                  <div className="lg:col-span-2 pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Submitting Listing...
                        </>
                      ) : (
                        <>
                          <Home className="h-4 w-4 mr-2" />
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