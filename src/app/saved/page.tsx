'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { savesApi, type SaveItem } from '@/lib/saves'
import { useAuth } from '@/contexts/auth-context'
import { Heart, Home, Users, Trash2, ExternalLink, AlertCircle } from 'lucide-react'

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
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Heart className="h-8 w-8 text-purple-500 mr-3" />
            Your Saved Items
          </h1>
          <p className="text-gray-600">Keep track of properties and people you're interested in</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saved Properties</p>
                  <p className="text-2xl font-bold text-purple-600">{flats.length}</p>
                </div>
                <Home className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saved People</p>
                  <p className="text-2xl font-bold text-purple-600">{people.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="flats" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="flats" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Saved Properties ({flats.length})
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Saved People ({people.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flats" className="mt-6">
            {loadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/95 backdrop-blur-sm border border-gray-200/70 rounded-lg p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : flats.length === 0 ? (
              <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved properties yet</h3>
                  <p className="text-gray-600 mb-6">Start saving properties you like to keep track of them here</p>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    Browse Properties
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {flats.map((flat) => (
                  <Card key={flat.id} className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">Property</h4>
                          <p className="text-sm text-gray-600">ID: {flat.target_id}</p>
                        </div>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          Flat
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-4">
                        Saved on {formatDate(flat.created_at)}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-300"
                          onClick={() => window.open(`/listing/${flat.target_id}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveItem('flat', flat.id, flat.target_id)}
                          disabled={removingItems.has(flat.id)}
                        >
                          {removingItems.has(flat.id) ? (
                            <div className="h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="mt-6">
            {loadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/95 backdrop-blur-sm border border-gray-200/70 rounded-lg p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : people.length === 0 ? (
              <Card className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved people yet</h3>
                  <p className="text-gray-600 mb-6">Connect with flatmates and save their profiles here</p>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    Find Flatmates
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {people.map((person) => (
                  <Card key={person.id} className="shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">Person</h4>
                          <p className="text-sm text-gray-600">ID: {person.target_id}</p>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          Person
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-4">
                        Saved on {formatDate(person.created_at)}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-300"
                          onClick={() => window.open(`/profile/${person.target_id}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveItem('person', person.id, person.target_id)}
                          disabled={removingItems.has(person.id)}
                        >
                          {removingItems.has(person.id) ? (
                            <div className="h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8 shadow-sm border-gray-200/70 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="justify-start border-gray-300"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4 mr-2" />
                Browse Properties
              </Button>
              <Button 
                variant="outline" 
                className="justify-start border-gray-300"
                onClick={() => window.location.href = '/profile'}
              >
                <Users className="h-4 w-4 mr-2" />
                View Profile
              </Button>
              <Button 
                variant="outline" 
                className="justify-start border-gray-300"
                onClick={() => window.location.href = '/add-listing'}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Add Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}