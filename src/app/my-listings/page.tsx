'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { 
  Home, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  AlertCircle, 
  MapPin, 
  IndianRupee,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react'

interface Listing {
  id: string
  title: string
  property_type: string
  city: string
  area: string
  state: string
  rent: number
  security_deposit: number
  highlights: string[]
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  images: Array<{ public_id: string; url: string; width?: number; height?: number }>
  contact_number: string
  description: string | null
  user_type: 'normal' | 'broker'
}

export default function MyListingsPage() {
  const { user, loading } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'))
    }
  }, [user, loading])

  useEffect(() => {
    const loadListings = async () => {
      if (!user) return
      
      setLoadingData(true)
      setError('')

      try {
        const { data, error: fetchError } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            property_type,
            city,
            area,
            state,
            rent,
            security_deposit,
            highlights,
            status,
            created_at,
            images,
            contact_number,
            description,
            user_type
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchError) {
          setError(fetchError.message || 'Failed to load listings')
        } else {
          setListings(data || [])
        }
      } catch (err) {
        setError('Failed to load listings')
        console.error('Error loading listings:', err)
      } finally {
        setLoadingData(false)
      }
    }

    loadListings()
  }, [user])

  const handleDeleteListing = async (listingId: string) => {
    if (deletingItems.has(listingId)) return
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return
    }

    setDeletingItems(prev => new Set([...prev, listingId]))

    try {
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('user_id', user?.id) // Extra security check

      if (deleteError) {
        setError(deleteError.message)
      } else {
        // Remove from local state
        setListings(prev => prev.filter(listing => listing.id !== listingId))
      }
    } catch (err) {
      setError('Failed to delete listing')
      console.error('Error deleting listing:', err)
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(listingId)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-3 w-3" />
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'inactive':
        return <XCircle className="h-3 w-3" />
      default:
        return <XCircle className="h-3 w-3" />
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
              <p className="text-gray-600 mb-6">Please login to view your listings.</p>
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
    <div className="min-h-screen bg-white-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Home className="h-8 w-8 text-purple-500 mr-3" />
                My Listings
              </h1>
              <p className="text-gray-600">Manage all your property listings in one place</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Listings</p>
                  <p className="text-2xl font-bold text-purple-600">{listings.length}</p>
                </div>
                <Home className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {listings.filter(l => l.status === 'active').length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {listings.filter(l => l.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/95 backdrop-blur-sm border border-gray-200/70 rounded-lg p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded w-full"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No listings yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                You haven&apos;t created any property listings yet. Get started by creating your first listing.
              </p>
              <Button
                onClick={() => window.location.href = '/add-listing'}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card 
                key={listing.id} 
                className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm hover:shadow-md transition-shadow group"
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">
                          {listing.area ? `${listing.area}, ` : ''}{listing.city}, {listing.state}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(listing.status)} border flex items-center gap-1`}
                    >
                      {getStatusIcon(listing.status)}
                      <span className="capitalize">{listing.status}</span>
                    </Badge>
                  </div>

                  {/* Property Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Property Type</span>
                      <Badge variant="outline" className="text-xs">
                        {listing.property_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Monthly Rent</span>
                      <span className="font-semibold text-purple-600 flex items-center">
                        <IndianRupee className="h-3 w-3 mr-0.5" />
                        {formatCurrency(listing.rent).replace('₹', '')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Security Deposit</span>
                      <span className="text-sm text-gray-600 flex items-center">
                        <IndianRupee className="h-3 w-3 mr-0.5" />
                        {formatCurrency(listing.security_deposit).replace('₹', '')}
                      </span>
                    </div>

                    {listing.highlights && listing.highlights.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 block mb-2">Highlights</span>
                        <div className="flex flex-wrap gap-1">
                          {listing.highlights.slice(0, 3).map((highlight, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                              {highlight}
                            </Badge>
                          ))}
                          {listing.highlights.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                              +{listing.highlights.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Created {formatDate(listing.created_at)}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="h-3 w-3 mr-1" />
                        <span className="capitalize">{listing.user_type}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 hover:bg-gray-50"
                        onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                        onClick={() => window.location.href = `/edit-listing/${listing.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteListing(listing.id)}
                        disabled={deletingItems.has(listing.id)}
                      >
                        {deletingItems.has(listing.id) ? (
                          <div className="h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}