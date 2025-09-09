'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { savesApi, type SaveItem } from '@/lib/saves'
import { useAuth } from '@/contexts/auth-context'
import { Heart, Home, Users, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function SavedPage() {
  const { user, loading } = useAuth()
  const [flats, setFlats] = useState<SaveItem[]>([])
  const [people, setPeople] = useState<SaveItem[]>([])
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'))
    }
  }, [user, loading])

  useEffect(() => {
    const loadSavedItems = async () => {
      if (!user) return
      
      setLoadingData(true)
      setError('')

      try {
        const [savedFlats, savedPeople] = await Promise.all([
          savesApi.listSaves('flat'),
          savesApi.listSaves('person')
        ])

        if (savedFlats.error) {
          setError(savedFlats.error.message || 'Failed to load saved flats')
        } else {
          setFlats(savedFlats.items)
        }

        if (savedPeople.error) {
          setError(prev => prev ? `${prev}; ${savedPeople.error?.message}` : (savedPeople.error?.message || 'Failed to load saved people'))
        } else {
          setPeople(savedPeople.items)
        }
      } catch (err) {
        setError('Failed to load saved items')
        console.error('Error loading saved items:', err)
      } finally {
        setLoadingData(false)
      }
    }

    loadSavedItems()
  }, [user])

  const handleRemoveItem = async (type: 'flat' | 'person', itemId: string, targetId: string) => {
    if (removingItems.has(itemId)) return

    setRemovingItems(prev => new Set([...prev, itemId]))

    try {
      const result = await savesApi.toggleSave(type, targetId)
      
      if (result.error) {
        setError(result.error.message)
      } else {
        // Remove from local state
        if (type === 'flat') {
          setFlats(prev => prev.filter(item => item.id !== itemId))
        } else {
          setPeople(prev => prev.filter(item => item.id !== itemId))
        }
      }
    } catch (err) {
      setError('Failed to remove item')
      console.error('Error removing item:', err)
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
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

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-white-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Login required</h1>
              <p className="text-gray-600 mb-6">Please login to view your saved items.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />
      
      {/* Hero Section with Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Your Saved Items
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Keep track of properties and people you&apos;re interested in. Your personal collection of favorites.
              </p>
            </div>
            
            {/* Compact Stats Cards */}
            <div className="flex gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 min-w-[120px]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Home className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{flats.length}</p>
                    <p className="text-xs text-gray-600 font-medium">Properties</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 min-w-[120px]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{people.length}</p>
                    <p className="text-xs text-gray-600 font-medium">People</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Enhanced Tabs */}
        <Tabs defaultValue="flats" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="inline-flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
              <TabsTrigger 
                value="flats" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Saved Properties</span>
                <span className="sm:hidden">Properties</span>
                <Badge variant="secondary" className="ml-1 text-xs bg-gray-100 text-gray-600 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {flats.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="people" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Saved People</span>
                <span className="sm:hidden">People</span>
                <Badge variant="secondary" className="ml-1 text-xs bg-gray-100 text-gray-600 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {people.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="hidden sm:flex border-gray-200 hover:bg-gray-50"
              >
                <Home className="h-4 w-4 mr-1" />
                Browse Properties
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/flatmates'}
                className="hidden sm:flex border-gray-200 hover:bg-gray-50"
              >
                <Users className="h-4 w-4 mr-1" />
                Find Flatmates
              </Button>
            </div>
          </div>

          <TabsContent value="flats" className="space-y-6">
            {loadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-0 overflow-hidden">
                    <div className="animate-pulse">
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : flats.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 max-w-md mx-auto">
                  <div className="p-4 bg-purple-50 rounded-2xl w-fit mx-auto mb-6">
                    <Home className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No saved properties yet</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Start exploring and save properties you like to build your personal collection
                  </p>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Browse Properties
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {flats.map((flat) => {
                  const listing = flat.listing || null
                  const title = listing?.title || 'Property'
                  const imageSrc = (() => {
                    if (!Array.isArray(listing?.images)) return undefined
                    const images = listing?.images as unknown[]
                    const first = images[0]
                    if (first && typeof first === 'object' && 'url' in first) {
                      return (first as { url?: string }).url
                    }
                    return undefined
                  })()
                  const location = [listing?.area, listing?.city, listing?.state].filter(Boolean).join(', ')
                  return (
                    <div key={flat.id} className="group bg-white rounded-2xl border border-gray-200 hover:border-purple-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      {/* Enhanced Image Section */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {imageSrc ? (
                          <Image 
                            src={imageSrc} 
                            alt={title} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <Home className="h-8 w-8 mb-2" />
                            <span className="text-sm font-medium">No Image</span>
                          </div>
                        )}
                        
                        {/* Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-white/95 backdrop-blur-sm text-purple-700 border-0 font-semibold text-xs">
                            Property
                          </Badge>
                        </div>
                        
                        <button
                          aria-label="Remove saved property"
                          title="Remove from saved"
                          onClick={() => handleRemoveItem('flat', flat.id, flat.target_id)}
                          disabled={removingItems.has(flat.id)}
                          className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white hover:scale-105 transition-all duration-200 shadow-sm"
                        >
                          {removingItems.has(flat.id) ? (
                            <div className="h-3.5 w-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          )}
                        </button>
                      </div>
                      
                      {/* Enhanced Content */}
                      <div className="p-4">
                        <div className="mb-3">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
                            {title}
                          </h4>
                          {location && (
                            <p className="text-sm text-gray-500 line-clamp-1 flex items-center gap-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              {location}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                            Saved {formatDate(flat.created_at)}
                          </p>
                        </div>
                        
                        <Button
                          size="sm"
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                          onClick={() => window.open(`/listing/${flat.target_id}`, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="space-y-6">
            {loadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <div className="animate-pulse">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : people.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 max-w-md mx-auto">
                  <div className="p-4 bg-blue-50 rounded-2xl w-fit mx-auto mb-6">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No saved people yet</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Connect with potential flatmates and save their profiles for easy access later
                  </p>
                  <Button
                    onClick={() => window.location.href = '/flatmates'}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Find Flatmates
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {people.map((person) => {
                  const p = person.person || null
                  const name = p?.name || 'Person'
                  const getInitials = (name: string) => {
                    const parts = name.trim().split(' ')
                    const first = parts[0]?.charAt(0) || ''
                    const second = parts.length > 1 ? parts[1].charAt(0) : ''
                    return (first + second).toUpperCase()
                  }
                  
                  return (
                    <div key={person.id} className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-200 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all">
                            {p?.image_url ? (
                              <AvatarImage src={p.image_url} alt={name} />
                            ) : (
                              <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
                                {getInitials(name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="absolute -top-1 -right-1">
                            <Badge className="bg-white/95 backdrop-blur-sm text-blue-700 border border-blue-200 text-xs px-1.5 py-0.5">
                              Person
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 leading-tight truncate">
                            {name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Flatmate Profile
                          </p>
                        </div>

                        <button
                          aria-label="Remove saved person"
                          title="Remove from saved"
                          onClick={() => handleRemoveItem('person', person.id, person.target_id)}
                          disabled={removingItems.has(person.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                        >
                          {removingItems.has(person.id) ? (
                            <div className="h-3.5 w-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full text-center">
                          Saved {formatDate(person.created_at)}
                        </div>
                        
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                          onClick={() => window.open(`/flatmates`, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          View Profile
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}